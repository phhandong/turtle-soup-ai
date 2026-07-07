import { Redis } from '@upstash/redis'

import { SESSION_TTL_SECONDS } from './auth-utils.mjs'

const SESSION_KEY_PREFIX = 'turtle-soup:session:'

const redisClientsByKey = new Map()

export async function createRedisSession(env, tokenHash, userId) {
  const session = {
    userId,
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  }

  await getWritableStore(env).set(getSessionKey(tokenHash), session, {
    ex: SESSION_TTL_SECONDS,
  })

  return session
}

export async function getRedisSession(env, tokenHash) {
  const key = getSessionKey(tokenHash)
  const readableStore = getReadableStore(env)
  const writableStore = getWritableStore(env)
  const session = normalizeSession(await readableStore.get(key))

  if (session) {
    return session
  }

  if (readableStore === writableStore) {
    return null
  }

  return normalizeSession(await writableStore.get(key))
}

export async function touchRedisSession(env, tokenHash, session) {
  await getWritableStore(env).set(
    getSessionKey(tokenHash),
    {
      userId: session.userId,
      createdAt: session.createdAt,
      lastSeenAt: new Date().toISOString(),
    },
    { ex: SESSION_TTL_SECONDS },
  )
}

export async function deleteRedisSession(env, tokenHash) {
  await getWritableStore(env).del(getSessionKey(tokenHash))
}

export function getSessionKey(tokenHash) {
  return `${SESSION_KEY_PREFIX}${tokenHash}`
}

function getReadableStore(env) {
  if (env.__redisSessionStore) {
    return env.__redisSessionStore.readable ?? env.__redisSessionStore
  }

  const token = getEnvString(env.KV_REST_API_READ_ONLY_TOKEN) || getWriteToken(env)
  return getRedisClient(env, token, 'read')
}

function getWritableStore(env) {
  if (env.__redisSessionStore) {
    return env.__redisSessionStore.writable ?? env.__redisSessionStore
  }

  return getRedisClient(env, getWriteToken(env), 'write')
}

function getRedisClient(env, token, mode) {
  const url = getEnvString(env.KV_REST_API_URL)
  if (!url) {
    throw new Error('KV_REST_API_URL is required')
  }

  const cacheKey = `${mode}:${url}:${token}`
  if (!redisClientsByKey.has(cacheKey)) {
    redisClientsByKey.set(
      cacheKey,
      new Redis({
        url,
        token,
      }),
    )
  }

  return redisClientsByKey.get(cacheKey)
}

function getWriteToken(env) {
  const token = getEnvString(env.KV_REST_API_TOKEN)
  if (!token) {
    throw new Error('KV_REST_API_TOKEN is required')
  }

  return token
}

function normalizeSession(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  const session = value
  if (
    typeof session.userId !== 'string' ||
    !session.userId ||
    typeof session.createdAt !== 'string' ||
    typeof session.lastSeenAt !== 'string'
  ) {
    return null
  }

  return {
    userId: session.userId,
    createdAt: session.createdAt,
    lastSeenAt: session.lastSeenAt,
  }
}

function getEnvString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}
