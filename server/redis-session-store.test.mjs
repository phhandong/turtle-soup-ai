import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createRedisSession,
  deleteRedisSession,
  getRedisSession,
  getSessionKey,
  touchRedisSession,
} from './redis-session-store.mjs'

test('stores sessions with token hashes and reads through read-only client', async () => {
  const store = createMemoryRedisStore()
  const env = { __redisSessionStore: store }
  const tokenHash = 'hashed-token'

  await createRedisSession(env, tokenHash, 'user-1')
  const session = await getRedisSession(env, tokenHash)

  assert.equal(session.userId, 'user-1')
  assert.equal(store.raw.has(getSessionKey(tokenHash)), true)
  assert.equal(store.raw.has(getSessionKey('plain-token')), false)
  assert.equal(store.readable.getCalls, 1)
})

test('falls back to writable client when read-only lookup misses', async () => {
  const raw = new Map()
  const readable = createMemoryRedisClient(new Map())
  const writable = createMemoryRedisClient(raw)
  const env = { __redisSessionStore: { readable, writable } }
  const tokenHash = 'replica-lag-token'

  await createRedisSession(env, tokenHash, 'user-2')
  const session = await getRedisSession(env, tokenHash)

  assert.equal(session.userId, 'user-2')
  assert.equal(readable.getCalls, 1)
  assert.equal(writable.getCalls, 1)
})

test('touches and deletes sessions with the writable client', async () => {
  const store = createMemoryRedisStore()
  const env = { __redisSessionStore: store }
  const tokenHash = 'touch-token'

  const session = await createRedisSession(env, tokenHash, 'user-3')
  await touchRedisSession(env, tokenHash, {
    ...session,
    lastSeenAt: '2000-01-01T00:00:00.000Z',
  })
  assert.notEqual(
    (await getRedisSession(env, tokenHash)).lastSeenAt,
    '2000-01-01T00:00:00.000Z',
  )

  await deleteRedisSession(env, tokenHash)
  assert.equal(await getRedisSession(env, tokenHash), null)
})

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
