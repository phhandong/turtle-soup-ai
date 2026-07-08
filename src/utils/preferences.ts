import type { AiModelId } from '../types/story'
import type { AuthUser } from '../services/authClient'
import { DEFAULT_AI_MODEL, modelOptions } from '../config/appOptions'

const MODEL_STORAGE_KEY = 'turtle-soup-model'
const GUIDE_MESSAGE_STORAGE_KEY = 'turtle-soup-guide-message'
const HINT_ENABLED_STORAGE_KEY = 'turtle-soup-hint-enabled'
const QUESTION_PROMPTS_STORAGE_KEY = 'turtle-soup-question-prompts'
const SOUND_ENABLED_STORAGE_KEY = 'turtle-soup-sound-enabled'
const AUTH_USER_STORAGE_KEY = 'turtle-soup-auth-user'

export function loadCachedAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const user = JSON.parse(raw) as Partial<AuthUser>
    return isAuthUser(user) ? user : null
  } catch {
    return null
  }
}

export function saveCachedAuthUser(user: AuthUser | null) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (user) {
      window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      window.localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    }
  } catch {
    // The verified server session remains the source of truth.
  }
}

export function loadSelectedModel(): AiModelId {
  if (typeof window === 'undefined') {
    return DEFAULT_AI_MODEL
  }

  try {
    const raw = window.localStorage.getItem(MODEL_STORAGE_KEY)
    if (raw === 'agnes-2.0-flash') {
      return DEFAULT_AI_MODEL
    }
    return isAiModelId(raw) ? raw : DEFAULT_AI_MODEL
  } catch {
    return DEFAULT_AI_MODEL
  }
}

export function saveSelectedModel(model: AiModelId) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(MODEL_STORAGE_KEY, model)
  } catch {
    // The in-memory selection still applies for this session.
  }
}

export function loadGuideMessagePreference() {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    return window.localStorage.getItem(GUIDE_MESSAGE_STORAGE_KEY) !== 'hidden'
  } catch {
    return true
  }
}

export function saveGuideMessagePreference(isVisible: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      GUIDE_MESSAGE_STORAGE_KEY,
      isVisible ? 'visible' : 'hidden',
    )
  } catch {
    // The in-memory preference still applies for this session.
  }
}

export function loadQuestionPromptPreference() {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    return (
      window.localStorage.getItem(QUESTION_PROMPTS_STORAGE_KEY) !== 'hidden'
    )
  } catch {
    return true
  }
}

export function saveQuestionPromptPreference(isVisible: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      QUESTION_PROMPTS_STORAGE_KEY,
      isVisible ? 'visible' : 'hidden',
    )
  } catch {
    // The in-memory preference still applies for this session.
  }
}

export function loadHintPreference() {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    return window.localStorage.getItem(HINT_ENABLED_STORAGE_KEY) !== 'disabled'
  } catch {
    return true
  }
}

export function saveHintPreference(isEnabled: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      HINT_ENABLED_STORAGE_KEY,
      isEnabled ? 'enabled' : 'disabled',
    )
  } catch {
    // The in-memory preference still applies for this session.
  }
}

export function loadSoundPreference() {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    return window.localStorage.getItem(SOUND_ENABLED_STORAGE_KEY) !== 'muted'
  } catch {
    return true
  }
}

export function saveSoundPreference(isEnabled: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      SOUND_ENABLED_STORAGE_KEY,
      isEnabled ? 'enabled' : 'muted',
    )
  } catch {
    // The in-memory preference still applies for this session.
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') {
    return false
  }

  const user = value as Partial<AuthUser>
  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string' &&
    typeof user.avatarKey === 'string' &&
    typeof user.avatarUrl === 'string' &&
    typeof user.createdAt === 'string'
  )
}

function isAiModelId(value: string | null): value is AiModelId {
  return modelOptions.some((option) => option.id === value)
}

