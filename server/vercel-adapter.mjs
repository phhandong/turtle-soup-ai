import { handleApiRequest } from './api-core.mjs'

const MAX_BODY_BYTES = 1024 * 1024

export async function handleVercelRequest(req, res) {
  try {
    const request = await toFetchRequest(req)
    const response = await handleApiRequest(request, process.env)

    res.statusCode = response.status
    response.headers.forEach((value, name) => {
      res.setHeader(name, value)
    })
    res.end(await response.text())
  } catch (error) {
    console.error('Unhandled Vercel API error', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ error: 'Internal server error' }))
  }
}

async function toFetchRequest(req) {
  const protocol = getForwardedProto(req)
  const host = req.headers.host || 'localhost'
  const url = `${protocol}://${host}${req.url || '/'}`
  const headers = new Headers()

  for (const [name, value] of Object.entries(req.headers || {})) {
    if (Array.isArray(value)) {
      headers.set(name, value.join(', '))
    } else if (value !== undefined) {
      headers.set(name, String(value))
    }
  }

  const method = req.method || 'GET'
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await readRequestBody(req, MAX_BODY_BYTES)

  return new Request(url, {
    method,
    headers,
    body,
  })
}

function getForwardedProto(req) {
  const value = req.headers['x-forwarded-proto']
  return Array.isArray(value) ? value[0] || 'https' : value || 'https'
}

async function readRequestBody(req, maxBytes) {
  if (req.body !== undefined) {
    if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
      return req.body
    }

    return JSON.stringify(req.body)
  }

  const chunks = []
  let totalBytes = 0

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.length
    if (totalBytes > maxBytes) {
      throw new Error('Request body is too large')
    }
    chunks.push(buffer)
  }

  return Buffer.concat(chunks)
}
