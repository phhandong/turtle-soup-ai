import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createApp } from './index.mjs'

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
  const server = await listen(
    createApp({
      distDir,
      fcApiUrl: 'https://api-turtle.handong-joy.xyz',
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
    },
    body: JSON.stringify({ storyId: 'story-1', question: 'Q?' }),
  })

  assert.equal(response.status, 200)
  assert.equal(requestedUrl, 'https://api-turtle.handong-joy.xyz')
  assert.deepEqual(requestedBody, { storyId: 'story-1', question: 'Q?' })
  assert.equal(requestedOrigin, 'http://127.0.0.1:4173')
  assert.equal(response.headers.get('server-timing'), 'total;dur=12')
  assert.deepEqual(await response.json(), { answer: 'yes', label: 'yes' })
})

test('rejects non-POST API requests', async (t) => {
  const distDir = await makeDist()
  t.after(() => rm(distDir, { recursive: true, force: true }))

  const server = await listen(createApp({ distDir }))
  t.after(async () => close(server))

  const response = await fetch(`${server.url}/api/ai`)

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
