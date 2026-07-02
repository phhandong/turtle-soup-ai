import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DEFAULT_FC_API_URL = 'https://turtle-ai-proxy-opzmtticwv.cn-wulanchabu.fcapp.run'
const DEFAULT_PORT = 4173
const DEFAULT_TIMEOUT_MS = 60000
const DEFAULT_FC_MAX_ATTEMPTS = 2
const DEFAULT_FC_RETRY_DELAY_MS = 700
const MAX_BODY_BYTES = 256 * 1024
const RETRYABLE_UPSTREAM_STATUSES = new Set([502, 503, 504])

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distDir = resolve(rootDir, 'dist')
const fcApiUrl = trimTrailingSlash(process.env.FC_API_URL || DEFAULT_FC_API_URL)
const port = getPositiveNumber(process.env.PORT, DEFAULT_PORT)
const timeoutMs = getPositiveNumber(process.env.FC_TIMEOUT_MS, DEFAULT_TIMEOUT_MS)

export function createApp(options = {}) {
  const config = {
    distDir: resolve(options.distDir || distDir),
    fcApiUrl: trimTrailingSlash(options.fcApiUrl || fcApiUrl),
    timeoutMs: getPositiveNumber(options.timeoutMs, timeoutMs),
    fcMaxAttempts: getPositiveInteger(
      options.fcMaxAttempts || process.env.FC_MAX_ATTEMPTS,
      DEFAULT_FC_MAX_ATTEMPTS,
    ),
    fcRetryDelayMs: getPositiveNumber(
      options.fcRetryDelayMs || process.env.FC_RETRY_DELAY_MS,
      DEFAULT_FC_RETRY_DELAY_MS,
    ),
    fetchImpl: options.fetchImpl || fetch,
  }

  return createServer((request, response) => {
    handleRequest(request, response, config).catch((error) => {
      console.error('Unhandled server error', error)
      sendJson(response, 500, { error: 'Internal server error' })
    })
  })
}

async function handleRequest(request, response, config) {
  const url = new URL(request.url || '/', 'http://localhost')

  if (url.pathname === '/api/ai') {
    await proxyAiRequest(request, response, config)
    return
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendJson(response, 405, { error: 'Method not allowed' })
    return
  }

  await serveStatic(request, response, config.distDir, url.pathname)
}

async function proxyAiRequest(request, response, config) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' })
    return
  }

  let body
  try {
    body = await readRequestBody(request, MAX_BODY_BYTES)
  } catch (error) {
    sendJson(response, error.status || 400, { error: error.message })
    return
  }

  let upstreamResult
  try {
    upstreamResult = await fetchFcWithRetry(config, request, body)
  } catch (error) {
    sendJson(response, 502, {
      error: 'FC request failed',
      detail: getErrorMessage(error),
    })
    return
  }

  const { upstream, upstreamBody, attempts } = upstreamResult
  if (!upstream.ok) {
    console.error('FC request returned non-OK response', {
      url: config.fcApiUrl,
      status: upstream.status,
      statusText: upstream.statusText,
      durationMs: attempts.reduce((total, attempt) => total + attempt.durationMs, 0),
      serverTiming: upstream.headers.get('server-timing'),
      body: upstreamBody.slice(0, 500),
      attempts,
    })
  }

  response.statusCode = upstream.status
  copyHeader(upstream.headers, response, 'content-type')
  copyHeader(upstream.headers, response, 'server-timing')
  response.end(upstreamBody)
}

async function fetchFcWithRetry(config, request, body) {
  const attempts = []
  const init = {
    method: 'POST',
    headers: {
      'Content-Type': request.headers['content-type'] || 'application/json',
      ...(request.headers.origin ? { Origin: request.headers.origin } : {}),
      ...(request.headers['x-debug-timing']
        ? { 'X-Debug-Timing': request.headers['x-debug-timing'] }
        : {}),
    },
    body,
  }

  let lastError
  for (let attempt = 1; attempt <= config.fcMaxAttempts; attempt += 1) {
    const startedAt = Date.now()

    try {
      const upstream = await fetchWithTimeout(
        config.fetchImpl,
        config.fcApiUrl,
        init,
        config.timeoutMs,
      )
      const upstreamBody = await upstream.text()
      const attemptMeta = {
        attempt,
        status: upstream.status,
        statusText: upstream.statusText,
        durationMs: Date.now() - startedAt,
        serverTiming: upstream.headers.get('server-timing'),
      }
      attempts.push(attemptMeta)

      if (
        upstream.ok ||
        !RETRYABLE_UPSTREAM_STATUSES.has(upstream.status) ||
        attempt >= config.fcMaxAttempts
      ) {
        return { upstream, upstreamBody, attempts }
      }

      console.warn('Retrying FC request after retryable response', {
        url: config.fcApiUrl,
        ...attemptMeta,
        body: upstreamBody.slice(0, 500),
      })
    } catch (error) {
      lastError = error
      const attemptMeta = {
        attempt,
        error: getErrorMessage(error),
        durationMs: Date.now() - startedAt,
      }
      attempts.push(attemptMeta)

      if (attempt >= config.fcMaxAttempts) {
        throw error
      }

      console.warn('Retrying FC request after request failure', {
        url: config.fcApiUrl,
        ...attemptMeta,
      })
    }

    await delay(config.fcRetryDelayMs)
  }

  throw lastError || new Error('FC request failed')
}

async function serveStatic(request, response, baseDir, pathname) {
  const filePath = getStaticPath(baseDir, pathname)

  if (!filePath) {
    sendJson(response, 403, { error: 'Forbidden' })
    return
  }

  const targetPath = getServedFilePath(baseDir, filePath)

  if (!existsSync(targetPath)) {
    sendJson(response, 404, { error: 'Build output not found. Run npm run build first.' })
    return
  }

  response.setHeader('Content-Type', getContentType(targetPath))
  if (request.method === 'HEAD') {
    response.end()
    return
  }

  createReadStream(targetPath).pipe(response)
}

function getServedFilePath(baseDir, filePath) {
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    return filePath
  }

  return extname(filePath) ? filePath : join(baseDir, 'index.html')
}

function getStaticPath(baseDir, pathname) {
  const decodedPath = decodeURIComponent(pathname)
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, '')
  const relativePath =
    normalizedPath === '/' || normalizedPath === '.'
      ? 'index.html'
      : normalizedPath.replace(/^[/\\]+/, '')
  const filePath = resolve(baseDir, relativePath)
  return filePath.startsWith(baseDir) ? filePath : null
}

async function readRequestBody(request, maxBytes) {
  const chunks = []
  let totalBytes = 0

  for await (const chunk of request) {
    totalBytes += chunk.length
    if (totalBytes > maxBytes) {
      const error = new Error('Request body is too large')
      error.status = 413
      throw error
    }
    chunks.push(chunk)
  }

  return Buffer.concat(chunks)
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetchImpl(url, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Timed out after ${timeoutMs}ms`)
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function sendJson(response, status, body) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}

function copyHeader(headers, response, name) {
  const value = headers.get(name)
  if (value) {
    response.setHeader(name, value)
  }
}

function getContentType(filePath) {
  const extension = extname(filePath)
  return (
    {
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain; charset=utf-8',
      '.webp': 'image/webp',
    }[extension] || 'application/octet-stream'
  )
}

function getPositiveNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function getPositiveInteger(value, fallback) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '')
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createApp()

  server.listen(port, () => {
    console.log(`Server listening on http://127.0.0.1:${port}`)
    console.log(`Forwarding /api/ai to ${fcApiUrl}`)
  })
}
