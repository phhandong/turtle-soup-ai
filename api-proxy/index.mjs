import proxy from './proxy-core.mjs'

export async function handler(event) {
  try {
    const request = toRequest(parseEvent(event))
    const response = await proxy.fetch(request, process.env)

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      isBase64Encoded: false,
      body: await response.text(),
    }
  } catch (error) {
    console.error('Unhandled proxy error', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      isBase64Encoded: false,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}

function parseEvent(event) {
  if (event && typeof event === 'object' && !Buffer.isBuffer(event)) {
    return event
  }

  const text = Buffer.isBuffer(event) ? event.toString('utf8') : String(event)
  return JSON.parse(text)
}

function toRequest(event) {
  const method = event.requestContext?.http?.method || 'POST'
  const path = event.rawPath || event.requestContext?.http?.path || '/'
  const domain = event.requestContext?.domainName || 'localhost'
  const query = new URLSearchParams(event.queryParameters || {}).toString()
  const url = `https://${domain}${path}${query ? `?${query}` : ''}`
  const headers = new Headers(event.headers || {})
  const body = decodeBody(event)

  return new Request(url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  })
}

function decodeBody(event) {
  if (!event.body) return undefined
  return event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body
}
