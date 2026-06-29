import assert from 'node:assert/strict'
import test from 'node:test'

import { handler } from './index.mjs'

const originalFetch = globalThis.fetch
const originalEnv = {
  AGNES_API_KEY: process.env.AGNES_API_KEY,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
}

test.afterEach(() => {
  globalThis.fetch = originalFetch
  restoreEnv('AGNES_API_KEY', originalEnv.AGNES_API_KEY)
  restoreEnv('ALLOWED_ORIGINS', originalEnv.ALLOWED_ORIGINS)
})

test('returns a health response through the FC adapter', async () => {
  const response = await handler(makeEvent({ method: 'GET', path: '/health' }))

  assert.equal(response.statusCode, 200)
  assert.deepEqual(JSON.parse(response.body), { ok: true })
})

test('rejects browser requests from an unconfigured origin', async () => {
  const response = await handler(
    makeEvent({ method: 'POST', origin: 'https://attacker.example' }),
  )

  assert.equal(response.statusCode, 403)
  assert.deepEqual(JSON.parse(response.body), { error: 'Origin not allowed' })
})

test('proxies a request with the server-side API key', async () => {
  process.env.AGNES_API_KEY = 'server-only-test-key'
  process.env.ALLOWED_ORIGINS = 'https://turtle.handong-joy.xyz'
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://apihub.agnes-ai.com/v1/chat/completions')
    assert.equal(init.headers.Authorization, 'Bearer server-only-test-key')
    assert.equal(JSON.parse(init.body).model, 'agnes-2.0-flash')

    return new Response(
      JSON.stringify({
        choices: [{ message: { content: '{"answer":"是"}' } }],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const response = await handler(
    makeEvent({
      method: 'POST',
      origin: 'https://turtle.handong-joy.xyz',
      body: {
        storyId: 'test-story',
        surface: '汤面',
        truth: '汤底',
        question: '问题',
        hintEnabled: false,
        revealMode: false,
        model: 'agnes-2.0-flash',
      },
    }),
  )

  assert.equal(response.statusCode, 200)
  assert.equal(response.headers['access-control-allow-origin'], 'https://turtle.handong-joy.xyz')
  assert.deepEqual(JSON.parse(response.body), { answer: '是', label: 'yes' })
})

function makeEvent({ method, path = '/', origin, body }) {
  return JSON.stringify({
    version: 'v1',
    rawPath: path,
    body: body ? JSON.stringify(body) : '',
    isBase64Encoded: false,
    headers: {
      ...(origin ? { Origin: origin } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    queryParameters: {},
    requestContext: {
      domainName: 'api-turtle.handong-joy.xyz',
      http: { method, path },
    },
  })
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}
