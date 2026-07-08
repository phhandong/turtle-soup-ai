import type { ChatEntry } from '../types/story'
import type { ProgressRecord, StoryProgressData } from '../services/authClient'

const STORY_PROGRESS_STORAGE_PREFIX = 'turtle-soup-history:'

export type NormalizedStoryProgress = {
  chargedHintIndexes: number[]
  entries: ChatEntry[]
  hasAcceptedLimitOverrun: boolean
  hasSeenHintUnlockGuide: boolean
  revealedHintIndexes: number[]
  showTruth: boolean
}

export function normalizeStoryProgress(
  progress?: Partial<StoryProgressData>,
): NormalizedStoryProgress {
  return {
    chargedHintIndexes: Array.isArray(progress?.chargedHintIndexes)
      ? progress.chargedHintIndexes.filter(isHintIndex)
      : [],
    entries: Array.isArray(progress?.entries)
      ? progress.entries.filter(isChatEntry)
      : [],
    hasAcceptedLimitOverrun: progress?.hasAcceptedLimitOverrun === true,
    hasSeenHintUnlockGuide: progress?.hasSeenHintUnlockGuide === true,
    revealedHintIndexes: Array.isArray(progress?.revealedHintIndexes)
      ? progress.revealedHintIndexes.filter(isHintIndex)
      : [],
    showTruth: progress?.showTruth === true,
  }
}

export function makeProgressRecord(
  storyId: string,
  progress: StoryProgressData,
): ProgressRecord {
  const updatedAt = new Date().toISOString()
  return {
    storyId,
    progress: {
      ...progress,
      updatedAt,
      version: 4,
    },
    entriesCount: progress.entries.length,
    completed: progress.showTruth,
    completedAt: progress.showTruth ? updatedAt : null,
    updatedAt,
  }
}

export function loadStoryProgress(storyId: string): NormalizedStoryProgress {
  if (typeof window === 'undefined') {
    return createEmptyStoryProgress()
  }

  try {
    const raw = window.localStorage.getItem(getStoryProgressStorageKey(storyId))
    if (!raw) {
      return createEmptyStoryProgress()
    }

    const parsed = JSON.parse(raw) as Partial<{
      chargedHintIndexes: unknown
      entries: unknown
      hasAcceptedLimitOverrun: unknown
      hasSeenHintUnlockGuide: unknown
      revealedHintIndexes: unknown
      showTruth: unknown
    }>
    const revealedHintIndexes = Array.isArray(parsed.revealedHintIndexes)
      ? parsed.revealedHintIndexes.filter(isHintIndex)
      : []
    const chargedHintIndexes = Array.isArray(parsed.chargedHintIndexes)
      ? parsed.chargedHintIndexes.filter(isHintIndex)
      : revealedHintIndexes

    return {
      chargedHintIndexes,
      entries: Array.isArray(parsed.entries)
        ? parsed.entries.filter(isChatEntry)
        : [],
      hasAcceptedLimitOverrun: parsed.hasAcceptedLimitOverrun === true,
      hasSeenHintUnlockGuide: parsed.hasSeenHintUnlockGuide === true,
      revealedHintIndexes,
      showTruth: parsed.showTruth === true,
    }
  } catch {
    return createEmptyStoryProgress()
  }
}

function createEmptyStoryProgress(): NormalizedStoryProgress {
  return {
    chargedHintIndexes: [],
    entries: [],
    hasAcceptedLimitOverrun: false,
    hasSeenHintUnlockGuide: false,
    revealedHintIndexes: [],
    showTruth: false,
  }
}

export function isStoryCompleted(storyId: string) {
  return loadStoryProgress(storyId).showTruth
}

export function saveStoryProgress(
  storyId: string,
  progress: NormalizedStoryProgress,
) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      getStoryProgressStorageKey(storyId),
      JSON.stringify({
        version: 3,
        chargedHintIndexes: progress.chargedHintIndexes,
        entries: progress.entries,
        hasAcceptedLimitOverrun: progress.hasAcceptedLimitOverrun,
        hasSeenHintUnlockGuide: progress.hasSeenHintUnlockGuide,
        revealedHintIndexes: progress.revealedHintIndexes,
        showTruth: progress.showTruth,
        updatedAt: new Date().toISOString(),
      }),
    )
  } catch {
    // localStorage can be unavailable in private mode or full storage.
  }
}

export function clearStoryProgress(storyId: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(getStoryProgressStorageKey(storyId))
  } catch {
    // Ignore storage failures; the in-memory reset still works.
  }
}

function getStoryProgressStorageKey(storyId: string) {
  return `${STORY_PROGRESS_STORAGE_PREFIX}${storyId}`
}

function isHintIndex(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < 3
  )
}

function isChatEntry(value: unknown): value is ChatEntry {
  if (!value || typeof value !== 'object') {
    return false
  }

  const entry = value as Partial<ChatEntry>
  return (
    typeof entry.id === 'string' &&
    typeof entry.question === 'string' &&
    typeof entry.askedAt === 'string' &&
    !!entry.answer &&
    typeof entry.answer === 'object' &&
    typeof entry.answer.answer === 'string' &&
    typeof entry.answer.label === 'string'
  )
}
