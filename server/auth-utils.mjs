import { randomBytes, scrypt, timingSafeEqual, createHmac } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)
const PASSWORD_PREFIX = 'scrypt'
const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
}
const HASH_BYTES = 64

export const SESSION_COOKIE_NAME = 'turtle_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30

export function normalizeUsername(value) {
  return String(value || '').normalize('NFKC').trim()
}

export function normalizeUsernameKey(value) {
  return normalizeUsername(value).toLocaleLowerCase('und')
}

export function normalizeEmail(value) {
  return String(value || '').normalize('NFKC').trim().toLocaleLowerCase('und')
}

export function validateRegistrationPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Invalid request body' }
  }

  const username = normalizeUsername(payload.username)
  const email = normalizeEmail(payload.email)
  const password = typeof payload.password === 'string' ? payload.password : ''

  if (!/^[\p{L}\p{N}_-]{2,24}$/u.test(username)) {
    return {
      ok: false,
      error: '用户名需为 2-24 位，可包含中英文、数字、下划线或短横线。',
    }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, error: '请输入有效邮箱。' }
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    return { ok: false, error: passwordError }
  }

  return {
    ok: true,
    value: {
      username,
      usernameNormalized: normalizeUsernameKey(username),
      email,
      emailNormalized: email,
      password,
    },
  }
}

export function validateLoginPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Invalid request body' }
  }

  const identity =
    typeof payload.identity === 'string'
      ? payload.identity.normalize('NFKC').trim()
      : ''
  const password = typeof payload.password === 'string' ? payload.password : ''

  if (!identity || !password) {
    return { ok: false, error: '用户名/邮箱或密码错误。' }
  }

  return {
    ok: true,
    value: {
      identity,
      identityNormalized: identity.toLocaleLowerCase('und'),
      password,
    },
  }
}

export function validatePassword(password) {
  if (password.length < 8 || password.length > 128) {
    return '密码需为 8-128 位。'
  }

  return ''
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('base64url')
  const hash = await scryptAsync(password, salt, HASH_BYTES, SCRYPT_OPTIONS)

  return [
    PASSWORD_PREFIX,
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt,
    Buffer.from(hash).toString('base64url'),
  ].join('$')
}

export async function verifyPassword(password, passwordHash) {
  const parts = String(passwordHash || '').split('$')
  if (parts.length !== 6 || parts[0] !== PASSWORD_PREFIX) {
    return false
  }

  const [, n, r, p, salt, expectedHash] = parts
  const expected = Buffer.from(expectedHash, 'base64url')
  const actual = await scryptAsync(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT_OPTIONS.maxmem,
  })

  return (
    expected.length === actual.length &&
    timingSafeEqual(expected, Buffer.from(actual))
  )
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token, secret) {
  if (!secret || String(secret).length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters')
  }

  return createHmac('sha256', secret).update(token).digest('base64url')
}

export function parseCookies(cookieHeader) {
  const cookies = new Map()

  for (const pair of String(cookieHeader || '').split(';')) {
    const index = pair.indexOf('=')
    if (index === -1) {
      continue
    }

    const name = pair.slice(0, index).trim()
    const value = pair.slice(index + 1).trim()
    if (name) {
      try {
        cookies.set(name, decodeURIComponent(value))
      } catch {
        // Ignore malformed cookie values; callers will treat them as absent.
      }
    }
  }

  return cookies
}

export function buildSessionCookie(token, requestUrl, maxAge = SESSION_TTL_SECONDS) {
  const url = new URL(requestUrl)
  const isSecure = url.protocol === 'https:' || !isLocalhost(url.hostname)
  const encodedToken = encodeURIComponent(token)

  return [
    `${SESSION_COOKIE_NAME}=${encodedToken}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    ...(isSecure ? ['Secure'] : []),
  ].join('; ')
}

export function buildClearSessionCookie(requestUrl) {
  return buildSessionCookie('', requestUrl, 0)
}

function isLocalhost(hostname) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  )
}
