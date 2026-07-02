import assert from 'node:assert/strict'
import test from 'node:test'

import { handler } from './index.mjs'

const originalFetch = globalThis.fetch
const originalEnv = {
  AGNES_API_KEY: process.env.AGNES_API_KEY,
  UNITY_API_KEY: process.env.UNITY_API_KEY,
}

test.afterEach(() => {
  globalThis.fetch = originalFetch
  restoreEnv('AGNES_API_KEY', originalEnv.AGNES_API_KEY)
  restoreEnv('UNITY_API_KEY', originalEnv.UNITY_API_KEY)
})

test('returns a health response through the FC adapter', async () => {
  const response = await handler(makeEvent({ method: 'GET', path: '/health' }))

  assert.equal(response.statusCode, 200)
  assert.deepEqual(JSON.parse(response.body), { ok: true })
})

test('allows preflight requests from any origin', async () => {
  const response = await handler(
    makeEvent({ method: 'OPTIONS', origin: 'https://anywhere.example' }),
  )

  assert.equal(response.statusCode, 204)
  assert.equal(response.headers['access-control-allow-origin'], '*')
})


test('proxies a request with the server-side API key', async () => {
  process.env.AGNES_API_KEY = 'server-only-test-key'
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
  assert.equal(response.headers['access-control-allow-origin'], '*')
  assert.deepEqual(JSON.parse(response.body), {
    answer: '是',
    label: 'yes',
    matchedHintIndexes: [],
  })
})

test('returns matched hint indexes from valid candidates only', async () => {
  process.env.AGNES_API_KEY = 'server-only-test-key'
  let promptBody
  globalThis.fetch = async (url, init) => {
    promptBody = JSON.parse(init.body)

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content:
                '{"answer":"是","matchedHintIndexes":[2,99,2],"hint":"short"}',
            },
          },
        ],
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
        question: '雨具是不是改变了触及范围？',
        hintCandidates: [
          { index: 1, text: '问题不在电梯坏了。' },
          { index: 2, text: '雨具改变了触及范围。' },
        ],
        hintEnabled: true,
        revealMode: false,
        model: 'agnes-2.0-flash',
      },
    }),
  )

  assert.match(promptBody.messages[1].content, /hintCandidates:/)
  assert.match(promptBody.messages[1].content, /2: 雨具改变了触及范围。/)
  assert.deepEqual(JSON.parse(response.body), {
    answer: '是',
    label: 'yes',
    hint: 'short',
    matchedHintIndexes: [2],
  })
})

test('drops loose hint matches without keyword overlap', async () => {
  process.env.AGNES_API_KEY = 'server-only-test-key'
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '{"answer":"是","matchedHintIndexes":[1]}',
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )

  const response = await handler(
    makeEvent({
      method: 'POST',
      origin: 'https://turtle.handong-joy.xyz',
      body: {
        storyId: 'test-story',
        surface: '汤面',
        truth: '汤底',
        question: '这个人是不是很伤心？',
        hintCandidates: [{ index: 1, text: '雨具改变了触及范围。' }],
        hintEnabled: false,
        revealMode: false,
        model: 'agnes-2.0-flash',
      },
    }),
  )

  assert.deepEqual(JSON.parse(response.body), {
    answer: '是',
    label: 'yes',
    matchedHintIndexes: [],
  })
})

test('allows a single strong hint keyword overlap', async () => {
  process.env.AGNES_API_KEY = 'server-only-test-key'
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: '{"answer":"是","matchedHintIndexes":[2]}',
            },
          },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )

  const response = await handler(
    makeEvent({
      method: 'POST',
      origin: 'https://turtle.handong-joy.xyz',
      body: {
        storyId: 'test-story',
        surface: '汤面',
        truth: '汤底',
        question: '和雨具有关系吗？',
        hintCandidates: [{ index: 2, text: '雨具改变了触及范围。' }],
        hintEnabled: false,
        revealMode: false,
        model: 'agnes-2.0-flash',
      },
    }),
  )

  assert.deepEqual(JSON.parse(response.body), {
    answer: '是',
    label: 'yes',
    matchedHintIndexes: [2],
  })
})

test('does not switch models when the selected provider is unavailable', async () => {
  delete process.env.UNITY_API_KEY
  let fetchCalled = false
  globalThis.fetch = async () => {
    fetchCalled = true
    throw new Error('fetch should not be called without selected provider key')
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
        model: 'claude-opus-4-8',
      },
    }),
  )

  assert.equal(response.statusCode, 502)
  assert.equal(fetchCalled, false)
  assert.deepEqual(JSON.parse(response.body), { error: 'AI upstream request failed' })
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
