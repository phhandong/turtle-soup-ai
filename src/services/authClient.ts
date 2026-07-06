import type { ChatEntry } from '../types/story'

export type AuthUser = {
  id: string
  username: string
  email: string
  avatarKey: string
  avatarUrl: string
  createdAt: string
}

export type StoryProgressData = {
  version?: number
  chargedHintIndexes: number[]
  entries: ChatEntry[]
  hasAcceptedLimitOverrun: boolean
  hasSeenHintUnlockGuide: boolean
  revealedHintIndexes: number[]
  showTruth: boolean
  updatedAt?: string
}

export type ProgressRecord = {
  storyId: string
  progress: StoryProgressData
  entriesCount: number
  completed: boolean
  completedAt: string | null
  updatedAt: string
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const data = await requestJson<{ user: AuthUser | null }>('/api/auth/me')
  return data.user
}

export async function registerUser(input: {
  username: string
  email: string
  password: string
}): Promise<AuthUser> {
  const data = await requestJson<{ user: AuthUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data.user
}

export async function loginUser(input: {
  identity: string
  password: string
}): Promise<AuthUser> {
  const data = await requestJson<{ user: AuthUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data.user
}

export async function logoutUser(): Promise<void> {
  await requestJson('/api/auth/logout', { method: 'POST' })
}

export async function updateProfile(input: {
  username: string
  avatarUrl: string
}): Promise<AuthUser> {
  const data = await requestJson<{ user: AuthUser }>('/api/auth/profile', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data.user
}

export async function getProgressRecords(): Promise<ProgressRecord[]> {
  const data = await requestJson<{ records: ProgressRecord[] }>('/api/progress')
  return data.records
}

export async function saveProgressRecord(
  storyId: string,
  progress: StoryProgressData,
): Promise<ProgressRecord> {
  const data = await requestJson<{ record: ProgressRecord }>('/api/progress', {
    method: 'POST',
    body: JSON.stringify({ storyId, progress }),
  })
  return data.record
}

export async function deleteProgressRecord(storyId: string): Promise<void> {
  await requestJson(`/api/progress?storyId=${encodeURIComponent(storyId)}`, {
    method: 'DELETE',
  })
}

async function requestJson<T = unknown>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(
      typeof data.error === 'string' ? data.error : '请求失败，请稍后再试。',
      response.status,
    )
  }

  return data as T
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}
