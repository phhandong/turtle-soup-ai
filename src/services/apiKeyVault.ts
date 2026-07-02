import type { AiModelId } from '../types/story'

const API_SHIFT_STORAGE_KEY = 'turtle-soup-api-caesar-shift'

type ApiUnlockResult =
  | { ok: true; shift: number }
  | { ok: false; message: string }

const encryptedApiKeyMap = parseEncryptedApiKeyMap(
  import.meta.env.VITE_ENCRYPTED_API_KEYS,
)

const modelAliases: Record<AiModelId, string[]> = {
  'agnes-2.0-flash': ['agnes', 'agnes-free'],
  'deepseek-v4-flash': ['deepseek'],
  'claude-opus-4-8': ['unity', 'unity2', 'claude'],
}

export class ApiKeyUnlockError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiKeyUnlockError'
  }
}

export function unlockApiAccess(rawShift: string): ApiUnlockResult {
  const shift = parseShift(rawShift)
  if (shift === null) {
    return { ok: false, message: '请输入整数偏移量。' }
  }

  const encryptedKeys = getConfiguredEncryptedKeys()
  if (encryptedKeys.length === 0) {
    return {
      ok: false,
      message: '当前构建未配置加密 API key。',
    }
  }

  const canDecryptAnyKey = encryptedKeys.some((encryptedKey) =>
    decodeEncryptedApiKey(encryptedKey, shift),
  )

  if (!canDecryptAnyKey) {
    return {
      ok: false,
      message: '偏移量不正确，请检查后重试。',
    }
  }

  saveApiShift(shift)
  return { ok: true, shift }
}

export function hasUnlockedApiAccess() {
  const shift = getSavedApiShift()
  if (shift === null) {
    return false
  }

  const encryptedKeys = getConfiguredEncryptedKeys()
  return (
    encryptedKeys.length > 0 &&
    encryptedKeys.some((encryptedKey) =>
      decodeEncryptedApiKey(encryptedKey, shift),
    )
  )
}

export function clearSavedApiShift() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(API_SHIFT_STORAGE_KEY)
  } catch {
    // API access will be rechecked from in-memory state.
  }
}

export function getSavedApiShift(): number | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return parseShift(window.localStorage.getItem(API_SHIFT_STORAGE_KEY) ?? '')
  } catch {
    return null
  }
}

export function hasConfiguredEncryptedApiKey() {
  return getConfiguredEncryptedKeys().length > 0
}

export function getApiKeyForModel(model: AiModelId) {
  const shift = getSavedApiShift()
  if (shift === null) {
    throw new ApiKeyUnlockError('API key is locked')
  }

  const encryptedKey = getEncryptedApiKeyForModel(model)
  if (!encryptedKey) {
    throw new ApiKeyUnlockError(`No encrypted API key configured for ${model}`)
  }

  const apiKey = decodeEncryptedApiKey(encryptedKey, shift)
  if (!apiKey) {
    throw new ApiKeyUnlockError('Saved Caesar shift no longer unlocks API key')
  }

  return apiKey
}

function saveApiShift(shift: number) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(API_SHIFT_STORAGE_KEY, String(shift))
  } catch {
    // If storage is unavailable, this session still unlocked successfully.
  }
}

function getConfiguredEncryptedKeys() {
  const keys = new Set<string>()
  const globalKey = getEnvString(import.meta.env.VITE_ENCRYPTED_API_KEY)

  if (globalKey) {
    keys.add(globalKey)
  }

  for (const model of Object.keys(modelAliases) as AiModelId[]) {
    const modelKey = getEncryptedApiKeyForModel(model)
    if (modelKey) {
      keys.add(modelKey)
    }
  }

  return Array.from(keys)
}

function getEncryptedApiKeyForModel(model: AiModelId) {
  const directEnvKey = getModelEnvKey(model)
  if (directEnvKey) {
    return directEnvKey
  }

  const mappedKey = encryptedApiKeyMap[model]
  if (mappedKey) {
    return mappedKey
  }

  for (const alias of modelAliases[model]) {
    if (encryptedApiKeyMap[alias]) {
      return encryptedApiKeyMap[alias]
    }
  }

  return getEnvString(import.meta.env.VITE_ENCRYPTED_API_KEY)
}

function getModelEnvKey(model: AiModelId) {
  if (model === 'agnes-2.0-flash') {
    return getEnvString(import.meta.env.VITE_ENCRYPTED_AGNES_API_KEY)
  }

  if (model === 'deepseek-v4-flash') {
    return getEnvString(import.meta.env.VITE_ENCRYPTED_DEEPSEEK_API_KEY)
  }

  return getEnvString(import.meta.env.VITE_ENCRYPTED_UNITY_API_KEY)
}

function parseEncryptedApiKeyMap(rawValue: string | undefined) {
  const raw = getEnvString(rawValue)
  const parsedMap: Record<string, string> = {}

  if (!raw) {
    return parsedMap
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) {
        parsedMap[key] = value.trim()
      }
    }
  } catch {
    return parsedMap
  }

  return parsedMap
}

function parseShift(rawShift: string) {
  const trimmed = rawShift.trim()
  if (!trimmed) {
    return null
  }

  const shift = Number(trimmed)
  if (!Number.isInteger(shift) || Math.abs(shift) > 10000) {
    return null
  }

  return shift
}

function decodeEncryptedApiKey(encryptedValue: string, shift: number) {
  const encrypted = encryptedValue.trim()
  const decodedCandidates = getCaesarCandidates(encrypted, shift)
    .map((candidate, index) => ({
      key: decodeBase64Text(candidate),
      index,
    }))
    .filter(
      (candidate): candidate is { key: string; index: number } =>
        !!candidate.key,
    )
    .map((candidate) => ({
      ...candidate,
      score: scoreApiKeyCandidate(candidate.key),
    }))
    .filter((candidate) => candidate.score >= 3)
    .sort(
      (left, right) =>
        right.score - left.score || left.index - right.index,
    )

  return decodedCandidates[0]?.key ?? ''
}

function getCaesarCandidates(encrypted: string, shift: number) {
  const candidates = [
    shiftAlphabetic(encrypted, -shift),
    shiftAlphabetic(encrypted, shift),
  ]

  return Array.from(new Set(candidates))
}

function shiftAlphabetic(value: string, amount: number) {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0)

    if (code >= 65 && code <= 90) {
      return String.fromCharCode(mod(code - 65 + amount, 26) + 65)
    }

    if (code >= 97 && code <= 122) {
      return String.fromCharCode(mod(code - 97 + amount, 26) + 97)
    }

    return character
  }).join('')
}

function decodeBase64Text(value: string) {
  const normalized = normalizeBase64(value)
  if (!normalized) {
    return ''
  }

  try {
    const binary = window.atob(normalized)
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    )
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim()
  } catch {
    return ''
  }
}

function normalizeBase64(value: string) {
  const compact = value.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (!compact || !/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) {
    return ''
  }

  const withoutPadding = compact.replace(/=+$/, '')
  const paddingLength = (4 - (withoutPadding.length % 4)) % 4
  const padded = `${withoutPadding}${'='.repeat(paddingLength)}`

  return padded.length % 4 === 0 ? padded : ''
}

function scoreApiKeyCandidate(value: string) {
  return /^sk/i.test(value) ? 3 : 0
}

function mod(value: number, modulus: number) {
  return ((value % modulus) + modulus) % modulus
}

function getEnvString(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed && !trimmed.includes('your-encrypted-key') ? trimmed : ''
}
