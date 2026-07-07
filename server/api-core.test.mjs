import assert from 'node:assert/strict'
import test from 'node:test'

import { handleApiRequest } from './api-core.mjs'
import {
  SESSION_COOKIE_NAME,
  buildSessionCookie,
  hashPassword,
  hashSessionToken,
  parseCookies,
} from './auth-utils.mjs'
import { createRedisSession } from './redis-session-store.mjs'

const sessionSecret = '0123456789abcdef0123456789abcdef'

test('login stores a Redis session and returns an HttpOnly cookie', async () => {
  const redis = createMemoryRedisStore()
  const user = await createUser()
  const env = createTestEnv({ redis, users: [user] })
  const response = await handleApiRequest(
    jsonRequest('https://example.com/api/auth/login', {
      identity: user.email,
      password: 'correct-horse',
    }),
    env,
  )
  const body = await response.json()
  const cookie = response.headers.get('set-cookie')
  const token = parseCookies(cookie).get(SESSION_COOKIE_NAME)
  const tokenHash = hashSessionToken(token, sessionSecret)

  assert.equal(response.status, 200)
  assert.equal(body.user.id, user.id)
  assert.match(cookie, /HttpOnly/)
  assert.equal(redis.raw.get(`turtle-soup:session:${tokenHash}`).userId, user.id)
  assert.equal(redis.raw.has(`turtle-soup:session:${token}`), false)
})

test('me reads sessions through read-only Redis and falls back to writable Redis', async () => {
  const writableRaw = new Map()
  const redis = {
    readable: createMemoryRedisClient(new Map()),
    writable: createMemoryRedisClient(writableRaw),
  }
  const user = await createUser()
  const env = createTestEnv({ redis, users: [user] })
  const token = 'session-token'
  const tokenHash = hashSessionToken(token, sessionSecret)
  await createRedisSession(env, tokenHash, user.id)

  const response = await handleApiRequest(
    new Request('https://example.com/api/auth/me', {
      headers: { Cookie: buildCookieHeader(token) },
    }),
    env,
  )
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.user.id, user.id)
  assert.equal(redis.readable.getCalls, 1)
  assert.equal(redis.writable.getCalls, 1)
})

test('logout deletes Redis session and clears the cookie', async () => {
  const redis = createMemoryRedisStore()
  const user = await createUser()
  const env = createTestEnv({ redis, users: [user] })
  const token = 'logout-token'
  const tokenHash = hashSessionToken(token, sessionSecret)
  await createRedisSession(env, tokenHash, user.id)

  const response = await handleApiRequest(
    new Request('https://example.com/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: buildCookieHeader(token) },
    }),
    env,
  )

  assert.equal(response.status, 200)
  assert.equal(redis.raw.has(`turtle-soup:session:${tokenHash}`), false)
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/)
})

test('logout clears the cookie even when Redis deletion fails', async () => {
  const originalConsoleError = console.error
  console.error = () => {}

  try {
    const response = await handleApiRequest(
      new Request('https://example.com/api/auth/logout', {
        method: 'POST',
        headers: { Cookie: buildCookieHeader('logout-token') },
      }),
      {
        SESSION_SECRET: sessionSecret,
        __redisSessionStore: {
          async del() {
            throw new Error('redis unavailable')
          },
        },
      },
    )

    assert.equal(response.status, 200)
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/)
  } finally {
    console.error = originalConsoleError
  }
})

test('ai endpoint requires a valid Redis session before proxying', async () => {
  const redis = createMemoryRedisStore()
  const user = await createUser()
  const token = 'ai-token'
  const tokenHash = hashSessionToken(token, sessionSecret)
  let requestedUrl = ''
  const env = createTestEnv({
    redis,
    users: [user],
    extra: {
      FC_API_URL: 'https://fc.example.com',
      __fetchImpl: async (url) => {
        requestedUrl = url
        return new Response(JSON.stringify({ answer: '是', label: 'yes' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      },
    },
  })

  const anonymousResponse = await handleApiRequest(
    jsonRequest('https://example.com/api/ai', { storyId: 'story-1' }),
    env,
  )
  assert.equal(anonymousResponse.status, 401)

  await createRedisSession(env, tokenHash, user.id)
  const authenticatedResponse = await handleApiRequest(
    jsonRequest(
      'https://example.com/api/ai',
      { storyId: 'story-1', question: 'Q?' },
      { Cookie: buildCookieHeader(token) },
    ),
    env,
  )

  assert.equal(authenticatedResponse.status, 200)
  assert.equal(requestedUrl, 'https://fc.example.com')
})

test('async auth route failures are returned as controlled 500 responses', async () => {
  const originalConsoleError = console.error
  console.error = () => {}

  try {
    const response = await handleApiRequest(
      jsonRequest('https://example.com/api/auth/login', {
        identity: 'alice@example.com',
        password: 'correct-horse',
      }),
      {
        SESSION_SECRET: sessionSecret,
        __sql: async () => {
          throw new Error('database unavailable')
        },
        __redisSessionStore: createMemoryRedisStore(),
      },
    )
    const body = await response.json()

    assert.equal(response.status, 500)
    assert.deepEqual(body, { error: 'Internal server error' })
  } finally {
    console.error = originalConsoleError
  }
})

async function createUser(overrides = {}) {
  return {
    id: overrides.id ?? 'user-1',
    username: overrides.username ?? 'Alice',
    username_normalized: overrides.usernameNormalized ?? 'alice',
    email: overrides.email ?? 'alice@example.com',
    email_normalized: overrides.emailNormalized ?? 'alice@example.com',
    password_hash:
      overrides.passwordHash ?? (await hashPassword('correct-horse')),
    avatar_key: overrides.avatarKey ?? 'moss-0',
    avatar_url: overrides.avatarUrl ?? null,
    created_at: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
  }
}

function createTestEnv({ redis, users, extra = {} }) {
  return {
    SESSION_SECRET: sessionSecret,
    __redisSessionStore: redis,
    __sql: createMemorySql(users),
    ...extra,
  }
}

function createMemorySql(users) {
  const normalizedUsers = [...users]

  return async function sql(strings, ...values) {
    const query = strings.join('?')

    if (/CREATE TABLE|ALTER TABLE|CREATE INDEX/i.test(query)) {
      return []
    }

    if (/FROM users\s+WHERE username_normalized/i.test(query)) {
      const usernameKey = values[0]
      const emailKey = values[1]
      return normalizedUsers.filter(
        (user) =>
          user.username_normalized === usernameKey ||
          user.email_normalized === emailKey,
      ).slice(0, 1)
    }

    if (/FROM users\s+WHERE id/i.test(query)) {
      const userId = values[0]
      return normalizedUsers.filter((user) => user.id === userId).slice(0, 1)
    }

    throw new Error(`Unexpected SQL in test: ${query}`)
  }
}

function jsonRequest(url, body, headers = {}) {
  return new Request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

function buildCookieHeader(token) {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`
}

function createMemoryRedisStore() {
  const raw = new Map()
  return {
    raw,
    readable: createMemoryRedisClient(raw),
    writable: createMemoryRedisClient(raw),
  }
}

function createMemoryRedisClient(raw) {
  return {
    getCalls: 0,
    async get(key) {
      this.getCalls += 1
      return raw.get(key) ?? null
    },
    async set(key, value) {
      raw.set(key, value)
    },
    async del(key) {
      raw.delete(key)
    },
  }
}
