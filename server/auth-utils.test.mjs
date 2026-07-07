import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildClearSessionCookie,
  buildSessionCookie,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  normalizeEmail,
  normalizeUsername,
  parseCookies,
  validateLoginPayload,
  validateRegistrationPayload,
  verifyPassword,
} from './auth-utils.mjs'

test('validates registration payloads', () => {
  const valid = validateRegistrationPayload({
    username: '玩家_01',
    email: 'USER@Example.COM',
    password: 'correct-horse',
  })

  assert.equal(valid.ok, true)
  assert.equal(valid.value.username, '玩家_01')
  assert.equal(valid.value.email, 'user@example.com')

  assert.equal(
    validateRegistrationPayload({
      username: 'x',
      email: 'user@example.com',
      password: 'correct-horse',
    }).ok,
    false,
  )
  assert.equal(
    validateRegistrationPayload({
      username: 'valid-user',
      email: 'not-email',
      password: 'correct-horse',
    }).ok,
    false,
  )
  assert.equal(
    validateRegistrationPayload({
      username: 'valid-user',
      email: 'user@example.com',
      password: 'short',
    }).ok,
    false,
  )
})

test('normalizes user identifiers', () => {
  assert.equal(normalizeUsername('  Ａlice  '), 'Alice')
  assert.equal(normalizeEmail('  USER@Example.COM  '), 'user@example.com')
  assert.deepEqual(validateLoginPayload({ identity: ' Alice ', password: '12345678' }), {
    ok: true,
    value: {
      identity: 'Alice',
      identityNormalized: 'alice',
      password: '12345678',
    },
  })
})

test('hashes and verifies passwords', async () => {
  const hash = await hashPassword('correct-horse')

  assert.match(hash, /^scrypt\$/)
  assert.equal(await verifyPassword('correct-horse', hash), true)
  assert.equal(await verifyPassword('wrong-horse', hash), false)
})

test('builds session cookies and hashes tokens', () => {
  const token = createSessionToken()
  const secret = '0123456789abcdef0123456789abcdef'
  const hash = hashSessionToken(token, secret)
  const cookie = buildSessionCookie(token, 'https://example.com/api/auth/login')
  const clearCookie = buildClearSessionCookie('http://127.0.0.1/api/auth/logout')

  assert.equal(hashSessionToken(token, secret), hash)
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /Secure/)
  assert.match(clearCookie, /Max-Age=0/)
  assert.equal(parseCookies(`turtle_session=${encodeURIComponent(token)}`).get('turtle_session'), token)
})

test('ignores malformed percent-encoded cookie values', () => {
  const cookies = parseCookies('bad=%E0%A4%A; turtle_session=valid-token')

  assert.equal(cookies.has('bad'), false)
  assert.equal(cookies.get('turtle_session'), 'valid-token')
})
