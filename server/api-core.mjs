import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'node:crypto'

import aiProxy from '../api-proxy/proxy-core.mjs'
import {
  SESSION_COOKIE_NAME,
  buildClearSessionCookie,
  buildSessionCookie,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  normalizeUsername,
  normalizeEmail,
  normalizeUsernameKey,
  parseCookies,
  validateLoginPayload,
  validateRegistrationPayload,
  verifyPassword,
} from './auth-utils.mjs'
import {
  createRedisSession,
  deleteRedisSession,
  getRedisSession,
  incrementRedisCounter,
  touchRedisSession,
} from './redis-session-store.mjs'

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
}
const MAX_PROGRESS_BYTES = 1024 * 1024
const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000
const RETRYABLE_UPSTREAM_STATUSES = new Set([502, 503, 504])
const DB_MAX_ATTEMPTS = 2
const DB_RETRY_DELAY_MS = 350
const DEFAULT_DB_QUERY_TIMEOUT_MS = 10000
const AUTH_RATE_LIMIT_WINDOW_SECONDS = 15 * 60
const AUTH_REGISTER_LIMIT = 5
const AUTH_LOGIN_LIMIT = 20
const AI_IP_RATE_LIMIT_WINDOW_SECONDS = 60
const AI_IP_RATE_LIMIT = 30
const AI_USER_DAILY_LIMIT = 200

const sqlByConnectionString = new Map()
let schemaReady = false

export async function handleApiRequest(request, env = process.env) {
  const url = new URL(request.url)

  if (url.pathname === '/api/ai') {
    const session = await requireSession(request, env)
    if (!session.ok) {
      return session.response
    }

    const rateLimit = await checkAiRateLimit(request, env, session.user.id)
    if (!rateLimit.ok) {
      return rateLimit.response
    }

    if (env.FC_API_URL) {
      return proxyAiToFc(request, env)
    }

    return aiProxy.fetch(request, env)
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...JSON_HEADERS,
        'Access-Control-Allow-Origin': url.origin,
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  try {
    if (url.pathname === '/api/auth/register') {
      return await register(request, env)
    }

    if (url.pathname === '/api/auth/login') {
      return await login(request, env)
    }

    if (url.pathname === '/api/auth/logout') {
      return await logout(request, env)
    }

    if (url.pathname === '/api/auth/me') {
      return await me(request, env)
    }

    if (url.pathname === '/api/auth/profile') {
      return await profile(request, env)
    }

    if (url.pathname === '/api/progress') {
      return await progress(request, env)
    }

    return json({ error: 'Not found' }, 404)
  } catch (error) {
    console.error('API error', error)
    return json({ error: 'Internal server error' }, 500)
  }
}

async function profile(request, env) {
  if (request.method !== 'POST') {
    return methodNotAllowed()
  }

  const session = await requireSession(request, env)
  if (!session.ok) {
    return session.response
  }

  const payload = await readJson(request, 768 * 1024)
  const username = normalizeUsername(payload?.username)
  if (!/^[\p{L}\p{N}_-]{2,24}$/u.test(username)) {
    return json({
      error: '用户名需为 2-24 位，可包含中英文、数字、下划线或短横线。',
    }, 400)
  }

  const avatarUrl =
    typeof payload?.avatarUrl === 'string' ? payload.avatarUrl.trim() : ''
  if (avatarUrl && !isValidAvatarDataUrl(avatarUrl)) {
    return json({ error: '头像文件过大或格式不支持。' }, 400)
  }

  try {
    const [user] = await session.sql`
      UPDATE users
      SET
        username = ${username},
        username_normalized = ${normalizeUsernameKey(username)},
        avatar_url = ${avatarUrl || null},
        updated_at = now()
      WHERE id = ${session.user.id}
      RETURNING id, username, email, avatar_key, avatar_url, created_at
    `

    return json({ user: toPublicUser(user) })
  } catch (error) {
    if (isUniqueViolation(error)) {
      return json({ error: '用户名已被注册。' }, 409)
    }

    throw error
  }
}

async function register(request, env) {
  if (request.method !== 'POST') {
    return methodNotAllowed()
  }

  const rateLimit = await checkAuthRateLimit(request, env, 'register')
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  const payload = await readJson(request)
  const validation = validateRegistrationPayload(payload)
  if (!validation.ok) {
    return json({ error: validation.error }, 400)
  }

  const sql = await getReadySql(env)
  const passwordHash = await hashPassword(validation.value.password)
  const userId = randomUUID()
  const avatarKey = createAvatarKey()
  const sessionToken = createSessionToken()
  const sessionTokenHash = hashSessionToken(sessionToken, getSessionSecret(env))

  try {
    await createRedisSession(env, sessionTokenHash, userId)

    const [user] = await sql`
      INSERT INTO users (
        id,
        username,
        username_normalized,
        email,
        email_normalized,
        password_hash,
        avatar_key
      )
      VALUES (
        ${userId},
        ${validation.value.username},
        ${validation.value.usernameNormalized},
        ${validation.value.email},
        ${validation.value.emailNormalized},
        ${passwordHash},
        ${avatarKey}
      )
      RETURNING id, username, email, avatar_key, avatar_url, created_at
    `
    return createSessionResponse(
      request,
      env,
      sql,
      toPublicUser(user),
      201,
      sessionToken,
    )
  } catch (error) {
    await deleteRedisSession(env, sessionTokenHash).catch((cleanupError) => {
      console.error('Failed to clean up pending registration session', cleanupError)
    })

    if (isUniqueViolation(error)) {
      return json({ error: '用户名或邮箱已被注册。' }, 409)
    }

    throw error
  }
}

async function proxyAiToFc(request, env) {
  if (request.method !== 'POST') {
    return methodNotAllowed()
  }

  const body = await request.text()
  const fetchImpl = env.__fetchImpl || fetch
  const maxAttempts = getPositiveInteger(env.FC_MAX_ATTEMPTS, 2)
  const retryDelayMs = getPositiveNumber(env.FC_RETRY_DELAY_MS, 700)
  const timeoutMs = getPositiveNumber(env.FC_TIMEOUT_MS, 60000)
  const headers = {
    'Content-Type': request.headers.get('content-type') || 'application/json',
    ...(request.headers.get('origin')
      ? { Origin: request.headers.get('origin') }
      : {}),
    ...(request.headers.get('x-debug-timing')
      ? { 'X-Debug-Timing': request.headers.get('x-debug-timing') }
      : {}),
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetchWithTimeout(
      fetchImpl,
      env.FC_API_URL,
      {
        method: 'POST',
        headers,
        body,
      },
      timeoutMs,
    )
    const responseBody = await response.text()

    if (
      response.ok ||
      !RETRYABLE_UPSTREAM_STATUSES.has(response.status) ||
      attempt >= maxAttempts
    ) {
      return new Response(responseBody, {
        status: response.status,
        headers: {
          'Content-Type':
            response.headers.get('content-type') ||
            'application/json; charset=utf-8',
          ...(response.headers.get('server-timing')
            ? { 'Server-Timing': response.headers.get('server-timing') }
            : {}),
        },
      })
    }

    await delay(retryDelayMs)
  }

  return json({ error: 'AI upstream request failed' }, 502)
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetchImpl(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getPositiveNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function getPositiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

async function checkAuthRateLimit(request, env, action) {
  const ip = getClientIp(request)
  const limit =
    action === 'register'
      ? getPositiveInteger(env.AUTH_REGISTER_RATE_LIMIT, AUTH_REGISTER_LIMIT)
      : getPositiveInteger(env.AUTH_LOGIN_RATE_LIMIT, AUTH_LOGIN_LIMIT)
  const windowSeconds = getPositiveInteger(
    env.AUTH_RATE_LIMIT_WINDOW_SECONDS,
    AUTH_RATE_LIMIT_WINDOW_SECONDS,
  )

  return checkRateLimit(env, {
    key: `turtle-soup:rl:auth:${action}:${ip}`,
    limit,
    windowSeconds,
  })
}

async function checkAiRateLimit(request, env, userId) {
  const ipLimit = await checkRateLimit(env, {
    key: `turtle-soup:rl:ai:ip:${getClientIp(request)}`,
    limit: getPositiveInteger(env.AI_IP_RATE_LIMIT, AI_IP_RATE_LIMIT),
    windowSeconds: getPositiveInteger(
      env.AI_IP_RATE_LIMIT_WINDOW_SECONDS,
      AI_IP_RATE_LIMIT_WINDOW_SECONDS,
    ),
  })
  if (!ipLimit.ok) {
    return ipLimit
  }

  return checkRateLimit(env, {
    key: `turtle-soup:rl:ai:user:${getUtcDateKey()}:${userId}`,
    limit: getPositiveInteger(env.AI_USER_DAILY_LIMIT, AI_USER_DAILY_LIMIT),
    windowSeconds: getSecondsUntilNextUtcDay(),
  })
}

async function checkRateLimit(env, { key, limit, windowSeconds }) {
  const count = await incrementRedisCounter(env, key, windowSeconds)
  if (count <= limit) {
    return { ok: true }
  }

  return {
    ok: false,
    response: json(
      { error: 'Too many requests' },
      429,
      { 'Retry-After': String(windowSeconds) },
    ),
  }
}

function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim() || 'unknown'
  }

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function getSecondsUntilNextUtcDay(now = new Date()) {
  const nextDay = new Date(now)
  nextDay.setUTCHours(24, 0, 0, 0)
  return Math.max(1, Math.ceil((nextDay.getTime() - now.getTime()) / 1000))
}

async function login(request, env) {
  if (request.method !== 'POST') {
    return methodNotAllowed()
  }

  const rateLimit = await checkAuthRateLimit(request, env, 'login')
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  const payload = await readJson(request)
  const validation = validateLoginPayload(payload)
  if (!validation.ok) {
    return json({ error: validation.error }, 401)
  }

  const sql = await getReadySql(env)
  const [user] = await sql`
    SELECT id, username, email, avatar_key, avatar_url, password_hash, created_at
    FROM users
    WHERE username_normalized = ${normalizeUsernameKey(
      validation.value.identity,
    )}
      OR email_normalized = ${normalizeEmail(validation.value.identity)}
    LIMIT 1
  `

  if (!user || !(await verifyPassword(validation.value.password, user.password_hash))) {
    return json({ error: '用户名/邮箱或密码错误。' }, 401)
  }

  return createSessionResponse(request, env, sql, toPublicUser(user))
}

async function logout(request, env) {
  if (request.method !== 'POST') {
    return methodNotAllowed()
  }

  const token = getSessionToken(request)
  if (token) {
    const tokenHash = hashSessionToken(token, getSessionSecret(env))
    try {
      await deleteRedisSession(env, tokenHash)
    } catch (error) {
      console.error('Failed to delete Redis session during logout', error)
    }
  }

  return json(
    { ok: true },
    200,
    { 'Set-Cookie': buildClearSessionCookie(request.url) },
  )
}

async function me(request, env) {
  if (request.method !== 'GET') {
    return methodNotAllowed()
  }

  const session = await getSession(request, env)
  if (!session) {
    return json({ user: null }, 200)
  }

  return json({ user: session.user })
}

async function progress(request, env) {
  const session = await requireSession(request, env)
  if (!session.ok) {
    return session.response
  }

  if (request.method === 'GET') {
    const rows = await session.sql`
      SELECT story_id, progress, entries_count, completed, completed_at, updated_at
      FROM story_progress
      WHERE user_id = ${session.user.id}
      ORDER BY updated_at DESC
    `

    return json({
      records: rows.map((row) => ({
        storyId: row.story_id,
        progress: row.progress,
        entriesCount: row.entries_count,
        completed: row.completed,
        completedAt: row.completed_at,
        updatedAt: row.updated_at,
      })),
    })
  }

  if (request.method === 'POST') {
    const payload = await readJson(request, MAX_PROGRESS_BYTES)
    if (!isValidProgressPayload(payload)) {
      return json({ error: 'Invalid progress payload' }, 400)
    }

    const normalizedProgress = normalizeProgress(payload.progress)
    const entriesCount = Array.isArray(normalizedProgress.entries)
      ? normalizedProgress.entries.length
      : 0
    const completed = normalizedProgress.showTruth === true

    const [row] = await session.sql`
      INSERT INTO story_progress (
        user_id,
        story_id,
        progress,
        entries_count,
        completed,
        completed_at,
        updated_at
      )
      VALUES (
        ${session.user.id},
        ${payload.storyId},
        ${JSON.stringify(normalizedProgress)}::jsonb,
        ${entriesCount},
        ${completed},
        CASE WHEN ${completed} THEN now() ELSE NULL END,
        now()
      )
      ON CONFLICT (user_id, story_id)
      DO UPDATE SET
        progress = EXCLUDED.progress,
        entries_count = EXCLUDED.entries_count,
        completed = EXCLUDED.completed,
        completed_at = CASE
          WHEN EXCLUDED.completed THEN COALESCE(story_progress.completed_at, now())
          ELSE NULL
        END,
        updated_at = now()
      RETURNING story_id, progress, entries_count, completed, completed_at, updated_at
    `

    return json({
      record: {
        storyId: row.story_id,
        progress: row.progress,
        entriesCount: row.entries_count,
        completed: row.completed,
        completedAt: row.completed_at,
        updatedAt: row.updated_at,
      },
    })
  }

  if (request.method === 'DELETE') {
    const storyId = new URL(request.url).searchParams.get('storyId')
    if (!storyId) {
      return json({ error: 'Missing storyId' }, 400)
    }

    await session.sql`
      DELETE FROM story_progress
      WHERE user_id = ${session.user.id}
        AND story_id = ${storyId}
    `
    return json({ ok: true })
  }

  return methodNotAllowed()
}

async function createSessionResponse(
  request,
  env,
  sql,
  user,
  status = 200,
  existingToken = '',
) {
  const token = existingToken || createSessionToken()
  const tokenHash = hashSessionToken(token, getSessionSecret(env))

  if (!existingToken) {
    await createRedisSession(env, tokenHash, user.id)
  }

  return json(
    { user },
    status,
    { 'Set-Cookie': buildSessionCookie(token, request.url) },
  )
}

async function requireSession(request, env) {
  const session = await getSession(request, env)
  if (!session) {
    return {
      ok: false,
      response: json({ error: 'Authentication required' }, 401),
    }
  }

  return { ok: true, ...session }
}

async function getSession(request, env) {
  const token = getSessionToken(request)
  if (!token) {
    return null
  }

  const sql = await getReadySql(env)
  const tokenHash = hashSessionToken(token, getSessionSecret(env))
  const session = await getRedisSession(env, tokenHash)

  if (!session) {
    return null
  }

  const [row] = await sql`
    SELECT
      id,
      username,
      email,
      avatar_key,
      avatar_url,
      created_at
    FROM users
    WHERE id = ${session.userId}
    LIMIT 1
  `

  if (!row) {
    return null
  }

  if (
    !session.lastSeenAt ||
    Date.now() - new Date(session.lastSeenAt).getTime() > SESSION_TOUCH_INTERVAL_MS
  ) {
    await touchRedisSession(env, tokenHash, session)
  }

  return {
    sql,
    user: toPublicUser(row),
  }
}

function getSessionToken(request) {
  return parseCookies(request.headers.get('cookie')).get(SESSION_COOKIE_NAME)
}

function getSessionSecret(env) {
  return env.SESSION_SECRET
}

async function getReadySql(env) {
  const sql = getSql(env)
  if (!schemaReady) {
    await ensureSchema(sql)
    schemaReady = true
  }
  return sql
}

function getSql(env) {
  if (env.__sql) {
    return env.__sql
  }

  const connectionString = env.DATABASE_URL || env.POSTGRES_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL or POSTGRES_URL is required')
  }

  if (!sqlByConnectionString.has(connectionString)) {
    sqlByConnectionString.set(
      connectionString,
      withSqlRetry(neon(connectionString), env),
    )
  }

  return sqlByConnectionString.get(connectionString)
}

function withSqlRetry(sql, env) {
  const timeoutMs = getPositiveNumber(
    env.DB_QUERY_TIMEOUT_MS,
    DEFAULT_DB_QUERY_TIMEOUT_MS,
  )

  return async function retryingSql(strings, ...values) {
    let lastError

    for (let attempt = 1; attempt <= DB_MAX_ATTEMPTS; attempt += 1) {
      try {
        return await withTimeout(
          sql(strings, ...values),
          timeoutMs,
          'Database query timed out',
        )
      } catch (error) {
        lastError = error
        if (!isRetryableDatabaseError(error) || attempt >= DB_MAX_ATTEMPTS) {
          throw error
        }

        await delay(DB_RETRY_DELAY_MS)
      }
    }

    throw lastError
  }
}

function withTimeout(promise, timeoutMs, message) {
  let timeoutId

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const error = new Error(message)
      error.code = 'ETIMEDOUT'
      reject(error)
    }, timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timeoutId)
  })
}

function isRetryableDatabaseError(error) {
  const code =
    error?.sourceError?.cause?.code ||
    error?.sourceError?.code ||
    error?.cause?.code ||
    error?.code ||
    ''
  const message = String(error?.message || error?.sourceError?.message || '')

  return (
    code === 'UND_ERR_HEADERS_TIMEOUT' ||
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'UND_ERR_SOCKET' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    /fetch failed|Headers Timeout|network|timeout/i.test(message)
  )
}

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      username text NOT NULL,
      username_normalized text NOT NULL UNIQUE,
      email text NOT NULL,
      email_normalized text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      avatar_key text NOT NULL DEFAULT 'moss-0',
      avatar_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_key text NOT NULL DEFAULT 'moss-0'
  `
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url text
  `
  await sql`
    CREATE TABLE IF NOT EXISTS story_progress (
      user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      story_id text NOT NULL,
      progress jsonb NOT NULL,
      entries_count integer NOT NULL DEFAULT 0,
      completed boolean NOT NULL DEFAULT false,
      completed_at timestamptz,
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, story_id)
    )
  `
  await sql`
    CREATE INDEX IF NOT EXISTS story_progress_user_updated_idx
    ON story_progress(user_id, updated_at DESC)
  `
}

async function readJson(request, maxBytes = 256 * 1024) {
  const text = await request.text()
  if (text.length > maxBytes) {
    return null
  }

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return null
  }
}

function isValidProgressPayload(payload) {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.storyId === 'string' &&
    payload.storyId.length > 0 &&
    payload.storyId.length <= 120 &&
    payload.progress &&
    typeof payload.progress === 'object' &&
    !Array.isArray(payload.progress)
  )
}

function normalizeProgress(progress) {
  return {
    version: 4,
    chargedHintIndexes: normalizeIndexes(progress.chargedHintIndexes),
    entries: Array.isArray(progress.entries)
      ? progress.entries.slice(0, 300).filter(isChatEntry)
      : [],
    hasAcceptedLimitOverrun: progress.hasAcceptedLimitOverrun === true,
    hasSeenHintUnlockGuide: progress.hasSeenHintUnlockGuide === true,
    revealedHintIndexes: normalizeIndexes(progress.revealedHintIndexes),
    showTruth: progress.showTruth === true,
    updatedAt: new Date().toISOString(),
  }
}

function normalizeIndexes(value) {
  return Array.isArray(value)
    ? Array.from(
        new Set(
          value.filter(
            (item) =>
              Number.isInteger(item) &&
              item >= 0 &&
              item < 3,
          ),
        ),
      ).sort((left, right) => left - right)
    : []
}

function isChatEntry(value) {
  if (!value || typeof value !== 'object') {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.question === 'string' &&
    typeof value.askedAt === 'string' &&
    value.question.length <= 160 &&
    value.answer &&
    typeof value.answer === 'object' &&
    typeof value.answer.answer === 'string' &&
    typeof value.answer.label === 'string'
  )
}

function toPublicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarKey: user.avatar_key || createFallbackAvatarKey(user.id || user.username),
    avatarUrl: user.avatar_url || '',
    createdAt: user.created_at,
  }
}

function isValidAvatarDataUrl(value) {
  return (
    value.length <= 512 * 1024 &&
    /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value)
  )
}

function createAvatarKey() {
  const palettes = ['moss', 'brick', 'gold', 'cyan', 'ink', 'sage']
  return `${palettes[Math.floor(Math.random() * palettes.length)]}-${Math.floor(
    Math.random() * 6,
  )}`
}

function createFallbackAvatarKey(value) {
  const palettes = ['moss', 'brick', 'gold', 'cyan', 'ink', 'sage']
  const text = String(value || '')
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }

  return `${palettes[hash % palettes.length]}-${hash % 6}`
}

function isUniqueViolation(error) {
  return error?.code === '23505'
}

function methodNotAllowed() {
  return json({ error: 'Method not allowed' }, 405)
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...JSON_HEADERS,
      ...headers,
    },
  })
}
