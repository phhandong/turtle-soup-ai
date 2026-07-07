import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createApp } from './index.mjs'
import {
  SESSION_COOKIE_NAME,
  hashSessionToken,
} from './auth-utils.mjs'

const fcApiUrl = 'https://turtle-ai-proxy-opzmtticwv.cn-wulanchabu.fcapp.run'
const sessionSecret = '0123456789abcdef0123456789abcdef'

test('serves built static files', async (t) => {
  const distDir = await makeDist()
  t.after(() => rm(distDir, { recursive: true, force: true }))

  const server = await listen(createApp({ distDir }))
  t.after(async () => close(server))

  const response = await fetch(`${server.url}/`)

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8')
  assert.match(await response.text(), /<div id="root"><\/div>/)
})

test('proxies /api/ai to the configured FC URL', async (t) => {
  const distDir = await makeDist()
  t.after(() => rm(distDir, { recursive: true, force: true }))

  let requestedUrl
  let requestedBody
  let requestedOrigin
  const auth = createAuthFixture()
  const server = await listen(
    createApp({
      distDir,
      fcApiUrl,
      env: createAuthenticatedEnv(auth),
      fetchImpl: async (url, init) => {
        requestedUrl = url
        requestedBody = JSON.parse(init.body.toString('utf8'))
        requestedOrigin = init.headers.Origin

        return new Response(JSON.stringify({ answer: 'yes', label: 'yes' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Server-Timing': 'total;dur=12',
          },
        })
      },
    }),
  )
  t.after(async () => close(server))

  const response = await fetch(`${server.url}/api/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://127.0.0.1:4173',
      Cookie: auth.cookie,
    },
    body: JSON.stringify({ storyId: 'story-1', question: 'Q?' }),
  })

  assert.equal(response.status, 200)
  assert.equal(requestedUrl, fcApiUrl)
  assert.deepEqual(requestedBody, { storyId: 'story-1', question: 'Q?' })
  assert.equal(requestedOrigin, 'http://127.0.0.1:4173')
  assert.equal(response.headers.get('server-timing'), 'total;dur=12')
  assert.deepEqual(await response.json(), { answer: 'yes', label: 'yes' })
})

test('retries retryable FC responses', async (t) => {
  const distDir = await makeDist()
  t.after(() => rm(distDir, { recursive: true, force: true }))

  let requestCount = 0
  const auth = createAuthFixture()
  const server = await listen(
    createApp({
      distDir,
      fcApiUrl,
      fcRetryDelayMs: 1,
      env: createAuthenticatedEnv(auth),
      fetchImpl: async () => {
        requestCount += 1

        if (requestCount === 1) {
          return new Response(JSON.stringify({ error: 'temporary' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          })
        }

        return new Response(JSON.stringify({ answer: 'yes', label: 'yes' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Server-Timing': 'total;dur=10',
          },
        })
      },
    }),
  )
  t.after(async () => close(server))

  const response = await fetch(`${server.url}/api/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: auth.cookie },
    body: JSON.stringify({ storyId: 'story-1', question: 'Q?' }),
  })

  assert.equal(response.status, 200)
  assert.equal(requestCount, 2)
  assert.equal(response.headers.get('server-timing'), 'total;dur=10')
  assert.deepEqual(await response.json(), { answer: 'yes', label: 'yes' })
})

test('rejects unauthenticated API requests before proxying', async (t) => {
  const distDir = await makeDist()
  t.after(() => rm(distDir, { recursive: true, force: true }))

  const server = await listen(createApp({ distDir }))
  t.after(async () => close(server))

  const response = await fetch(`${server.url}/api/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storyId: 'story-1', question: 'Q?' }),
  })

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { error: 'Authentication required' })
})

test('rejects authenticated non-POST API requests', async (t) => {
  const distDir = await makeDist()
  t.after(() => rm(distDir, { recursive: true, force: true }))

  const auth = createAuthFixture()
  const server = await listen(
    createApp({ distDir, env: createAuthenticatedEnv(auth) }),
  )
  t.after(async () => close(server))

  const response = await fetch(`${server.url}/api/ai`, {
    headers: { Cookie: auth.cookie },
  })

  assert.equal(response.status, 405)
  assert.deepEqual(await response.json(), { error: 'Method not allowed' })
})

async function makeDist() {
  const dir = await mkdtemp(join(tmpdir(), 'turtle-soup-dist-'))
  await mkdir(join(dir, 'assets'))
  await writeFile(join(dir, 'index.html'), '<div id="root"></div>')
  await writeFile(join(dir, 'assets', 'app.js'), 'console.log("ok")')
  return dir
}

function createAuthFixture() {
  const token = `test-token-${Math.random()}`
  const tokenHash = hashSessionToken(token, sessionSecret)
  const redis = createMemoryRedisStore()
  redis.raw.set(`turtle-soup:session:${tokenHash}`, {
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
  })

  return {
    cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    redis,
  }
}

function createAuthenticatedEnv(auth = createAuthFixture()) {
  return {
    SESSION_SECRET: sessionSecret,
    KV_REST_API_URL: 'https://example.upstash.io',
    KV_REST_API_TOKEN: 'test-token',
    __redisSessionStore: auth.redis,
    __sql: createMemorySql(),
  }
}

function createMemorySql() {
  return async function sql(strings, ...values) {
    const query = strings.join('?')

    if (/CREATE TABLE|ALTER TABLE|CREATE INDEX/i.test(query)) {
      return []
    }

    if (/FROM users\s+WHERE id/i.test(query)) {
      return [
        {
          id: values[0],
          username: 'Alice',
          email: 'alice@example.com',
          avatar_key: 'moss-0',
          avatar_url: null,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ]
    }

    throw new Error(`Unexpected SQL in test: ${query}`)
  }
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
    async get(key) {
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

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.url = `http://127.0.0.1:${address.port}`
      resolve(server)
    })
  })
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.closeAllConnections()
    server.close((error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}
