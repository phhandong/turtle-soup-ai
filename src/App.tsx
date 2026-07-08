import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Eye,
  LockKeyhole,
  LogIn,
  X,
  Home,
  Link2,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Shuffle,
} from 'lucide-react'
import {
  AuthGate,
  ProfilePage,
} from './components/auth'
import { HomePage } from './components/home'
import { SiteFooter } from './components/layout'
import {
  ChatBubble,
  HintShelf,
  ModelPicker,
  QuestionPromptStrip,
  SourcePanel,
  UnlockProgressBar,
} from './components/storyWidgets'
import {
  TruthRevealDialog,
  type TruthDialogMode,
} from './components/truthDialog'
import { stories, getStoryById } from './data/stories'
import { askAi } from './services/aiClient'
import {
  deleteProgressRecord,
  getCurrentUser,
  getProgressRecords,
  logoutUser,
  saveProgressRecord,
  type AuthUser,
  type ProgressRecord,
  type StoryProgressData,
} from './services/authClient'
import type { AiModelId, ChatEntry, Difficulty, Story } from './types/story'
import {
  defaultHintSettings,
  difficultyText,
  questionPromptGroups,
} from './config/appOptions'
import {
  loadCachedAuthUser,
  loadGuideMessagePreference,
  loadHintPreference,
  loadQuestionPromptPreference,
  loadSelectedModel,
  loadSoundPreference,
  saveCachedAuthUser,
  saveGuideMessagePreference,
  saveHintPreference,
  saveQuestionPromptPreference,
  saveSelectedModel,
  saveSoundPreference,
} from './utils/preferences'
import { getCurrentStoryId, getStoryPath } from './utils/routes'
import {
  clearStoryProgress,
  isStoryCompleted,
  loadStoryProgress,
  makeProgressRecord,
  normalizeStoryProgress,
  saveStoryProgress,
} from './utils/storyProgress'
import {
  getAutoRevealHintIndexes,
  getUnlockProgressPercent,
  mergeHintIndexes,
} from './utils/hintUnlock'
import { openRandomUnrevealedStory } from './utils/storyNavigation'
import { playUiSound } from './utils/uiSound'

type ProgressByStoryId = Record<string, ProgressRecord>

function App() {
  const [storyId, setStoryId] = useState<string | null>(() =>
    getCurrentStoryId(),
  )
  const [isProfilePage, setIsProfilePage] = useState(
    () => window.location.hash === '#/profile',
  )
  const [authRequestMode, setAuthRequestMode] = useState<
    'login' | 'register' | null
  >(null)
  const [authUser, setAuthUser] = useState<AuthUser | null>(loadCachedAuthUser)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthVerified, setIsAuthVerified] = useState(false)
  const [showSessionExpiredDialog, setShowSessionExpiredDialog] =
    useState(false)
  const [authError, setAuthError] = useState('')
  const [progressByStoryId, setProgressByStoryId] = useState<ProgressByStoryId>(
    {},
  )
  const [isProgressLoading, setIsProgressLoading] = useState(false)
  const [progressSyncError, setProgressSyncError] = useState('')
  const progressSaveSequenceRef = useRef<Record<string, number>>({})
  const [selectedModel, setSelectedModel] = useState<AiModelId>(() =>
    loadSelectedModel(),
  )

  useEffect(() => {
    let isMounted = true

    async function loadSession() {
      setIsAuthLoading(true)
      setAuthError('')

      try {
        const user = await getCurrentUser()
        if (!isMounted) {
          return
        }

        setIsAuthVerified(!!user)
        setAuthUser(user)
        saveCachedAuthUser(user)
        if (user) {
          await loadProgressRecords(isMounted)
        } else if (authUser) {
          setShowSessionExpiredDialog(true)
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load user session', error)
          setAuthError('登录状态读取失败，请刷新后再试。')
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    void loadSession()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    saveSelectedModel(selectedModel)
  }, [selectedModel])

  useEffect(() => {
    const handleHashChange = () => {
      setStoryId(getCurrentStoryId())
      setIsProfilePage(window.location.hash === '#/profile')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [storyId])

  const story = storyId ? getStoryById(storyId) : undefined

  async function loadProgressRecords(isMounted = true) {
    setIsProgressLoading(true)
    setProgressSyncError('')

    try {
      const records = await getProgressRecords()
      if (!isMounted) {
        return
      }

      setProgressByStoryId(
        Object.fromEntries(records.map((record) => [record.storyId, record])),
      )
    } catch (error) {
      console.error('Failed to load progress records', error)
      if (isMounted) {
        setProgressSyncError('做题记录读取失败，请稍后刷新。')
      }
    } finally {
      if (isMounted) {
        setIsProgressLoading(false)
      }
    }
  }

  async function handleAuthenticated(user: AuthUser) {
    setAuthUser(user)
    setIsAuthVerified(true)
    saveCachedAuthUser(user)
    setShowSessionExpiredDialog(false)
    setAuthRequestMode(null)
    await loadProgressRecords()
  }

  async function handleLogout() {
    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      setAuthUser(null)
      setIsAuthVerified(false)
      saveCachedAuthUser(null)
      setProgressByStoryId({})
      window.location.hash = ''
    }
  }

  function handleUserChange(user: AuthUser) {
    setAuthUser(user)
    saveCachedAuthUser(user)
  }

  const handleProgressChange = useCallback(
    (storyId: string, progress: StoryProgressData) => {
      const saveSequence = (progressSaveSequenceRef.current[storyId] ?? 0) + 1
      progressSaveSequenceRef.current[storyId] = saveSequence
      const optimisticRecord = makeProgressRecord(storyId, progress)
      setProgressByStoryId((current) => ({
        ...current,
        [storyId]: optimisticRecord,
      }))
      setProgressSyncError('')

      void saveProgressRecord(storyId, progress)
        .then((record) => {
          if (progressSaveSequenceRef.current[storyId] !== saveSequence) {
            return
          }

          setProgressByStoryId((current) => ({
            ...current,
            [storyId]: record,
          }))
        })
        .catch((error) => {
          console.error('Failed to sync story progress', error)
          if (progressSaveSequenceRef.current[storyId] !== saveSequence) {
            return
          }

          setProgressSyncError('做题记录暂时没有同步成功。')
        })
    },
    [],
  )

  const handleProgressClear = useCallback((storyId: string) => {
    const saveSequence = (progressSaveSequenceRef.current[storyId] ?? 0) + 1
    progressSaveSequenceRef.current[storyId] = saveSequence
    setProgressByStoryId((current) => {
      const next = { ...current }
      delete next[storyId]
      return next
    })
    setProgressSyncError('')

    void deleteProgressRecord(storyId).catch((error) => {
      console.error('Failed to delete story progress', error)
      if (progressSaveSequenceRef.current[storyId] !== saveSequence) {
        return
      }

      setProgressSyncError('重开记录暂时没有同步成功。')
    })
  }, [])

  if (authUser && isAuthVerified && isProgressLoading && storyId) {
    return <LoadingScreen message="正在读取你的做题记录..." />
  }

  if (storyId && !story) {
    return <MissingStory />
  }

  if (
    !authUser &&
    (authRequestMode || isProfilePage) &&
    !showSessionExpiredDialog
  ) {
    return (
      <AuthGate
        defaultMode={authRequestMode ?? 'login'}
        error={authError}
        onAuthenticated={handleAuthenticated}
        onBackHome={() => {
          setAuthRequestMode(null)
          window.location.hash = ''
        }}
      />
    )
  }

  if (isProfilePage && authUser) {
    return (
      <>
        <ProfilePage
          user={authUser}
          onBackHome={() => {
            window.location.hash = ''
          }}
          onUserChange={handleUserChange}
        />
        {showSessionExpiredDialog ? (
          <SessionExpiredDialog
            onLogin={() => {
              setShowSessionExpiredDialog(false)
              setAuthRequestMode('login')
            }}
          />
        ) : null}
      </>
    )
  }

  const page = story ? (
    <StoryPage
      key={story.id}
      onSelectedModelChange={setSelectedModel}
      onOpenAuth={setAuthRequestMode}
      onProgressChange={handleProgressChange}
      onProgressClear={handleProgressClear}
      selectedModel={selectedModel}
      story={story}
      progress={authUser ? progressByStoryId[story.id]?.progress : undefined}
      progressByStoryId={authUser && isAuthVerified ? progressByStoryId : {}}
      user={authUser}
      isAuthVerified={isAuthVerified}
    />
  ) : (
    <HomePage
      onOpenAuth={setAuthRequestMode}
      onLogout={handleLogout}
      progressByStoryId={authUser && isAuthVerified ? progressByStoryId : {}}
      user={authUser}
    />
  )

  return (
    <>
      {page}
      {showSessionExpiredDialog ? (
        <SessionExpiredDialog
          onLogin={() => {
            setShowSessionExpiredDialog(false)
            setAuthRequestMode('login')
          }}
        />
      ) : null}
    </>
  )
}

function SessionExpiredDialog({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="session-dialog-backdrop" role="presentation">
      <div
        aria-labelledby="session-dialog-title"
        aria-modal="true"
        className="session-dialog"
        role="dialog"
      >
        <div className="session-dialog-icon" aria-hidden="true">
          <LockKeyhole size={26} />
        </div>
        <h2 id="session-dialog-title">登录已过期</h2>
        <p>你的登录状态已经失效，请重新登录后继续同步做题记录。</p>
        <button type="button" onClick={onLogin}>
          <LogIn size={17} />
          重新登录
        </button>
      </div>
    </div>
  )
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <main className="loading-shell" aria-live="polite">
      <div className="loading-mark">
        <RefreshCw className="spin" size={26} />
      </div>
      <p>{message}</p>
    </main>
  )
}

function StoryPage({
  story,
  selectedModel,
  onSelectedModelChange,
  user,
  progress,
  progressByStoryId,
  onOpenAuth,
  onProgressChange,
  onProgressClear,
  isAuthVerified,
}: {
  story: Story
  selectedModel: AiModelId
  onSelectedModelChange: (model: AiModelId) => void
  user: AuthUser | null
  isAuthVerified: boolean
  progress?: StoryProgressData
  progressByStoryId: ProgressByStoryId
  onOpenAuth: (mode: 'login' | 'register') => void
  onProgressChange: (storyId: string, progress: StoryProgressData) => void
  onProgressClear: (storyId: string) => void
}) {
  const initialProgress = useMemo(
    () => normalizeStoryProgress(progress),
    [progress],
  )
  const [question, setQuestion] = useState('')
  const [entries, setEntries] = useState<ChatEntry[]>(
    () => initialProgress.entries,
  )
  const [hintEnabled, setHintEnabled] = useState(loadHintPreference)
  const [revealedHintIndexes, setRevealedHintIndexes] = useState<number[]>(
    () => initialProgress.revealedHintIndexes,
  )
  const [chargedHintIndexes, setChargedHintIndexes] = useState<number[]>(
    () => initialProgress.chargedHintIndexes,
  )
  const [hasSeenHintUnlockGuide, setHasSeenHintUnlockGuide] = useState(
    () => initialProgress.hasSeenHintUnlockGuide,
  )
  const [showHintUnlockGuide, setShowHintUnlockGuide] = useState(false)
  const [hasAcceptedLimitOverrun, setHasAcceptedLimitOverrun] = useState(
    () => initialProgress.hasAcceptedLimitOverrun,
  )
  const [revealMode, setRevealMode] = useState(false)
  const [showTruth, setShowTruth] = useState(() => initialProgress.showTruth)
  const [truthDialogMode, setTruthDialogMode] =
    useState<TruthDialogMode | null>(null)
  const [pendingHintIndex, setPendingHintIndex] = useState<number | null>(null)
  const [isHintTrayOpen, setIsHintTrayOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showGuideMessage, setShowGuideMessage] = useState(
    loadGuideMessagePreference,
  )
  const [showQuestionPrompts, setShowQuestionPrompts] = useState(
    loadQuestionPromptPreference,
  )
  const [showRevealModeToast, setShowRevealModeToast] = useState(false)
  const [revealModeToastKey, setRevealModeToastKey] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(loadSoundPreference)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showScrollLatestButton, setShowScrollLatestButton] = useState(false)
  const [isReturningToLatest, setIsReturningToLatest] = useState(false)
  const [questionPromptGroupIndex, setQuestionPromptGroupIndex] = useState(0)
  const chatListRef = useRef<HTMLDivElement>(null)
  const questionInputRef = useRef<HTMLTextAreaElement>(null)
  const isProgrammaticChatScrollRef = useRef(false)
  const programmaticChatScrollTimeoutRef = useRef<number | null>(null)
  const previousEntryCountRef = useRef(entries.length)
  const settingsRef = useRef<HTMLDivElement>(null)
  const hintSettings = story.hints ?? defaultHintSettings[story.difficulty]
  const hintItems = story.hints?.items ?? []
  const usedQuestionBudget =
    entries.length + chargedHintIndexes.length * hintSettings.hintCost
  const isQuestionBudgetExhausted =
    usedQuestionBudget >= hintSettings.questionLimit
  const unlockProgressPercent = getUnlockProgressPercent(
    revealedHintIndexes.length,
    hintItems.length,
    showTruth,
  )
  const isAuthenticated = !!user && isAuthVerified
  const askInputClassName = [
    'ask-input-shell',
    hintItems.length > 0 ? 'has-unlock-progress' : '',
    !isAuthenticated ? 'auth-required' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const completedStoryIds = useMemo(
    () =>
      new Set(
        Object.values(progressByStoryId)
          .filter((record) => record.completed)
          .map((record) => record.storyId),
      ),
    [progressByStoryId],
  )
  const activeQuestionPrompts =
    questionPromptGroups[questionPromptGroupIndex % questionPromptGroups.length]

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    onProgressChange(story.id, {
      chargedHintIndexes,
      entries,
      hasAcceptedLimitOverrun,
      hasSeenHintUnlockGuide,
      revealedHintIndexes,
      showTruth,
    })
  }, [
    chargedHintIndexes,
    entries,
    hasAcceptedLimitOverrun,
    hasSeenHintUnlockGuide,
    isAuthenticated,
    onProgressChange,
    revealedHintIndexes,
    showTruth,
    story.id,
  ])

  useEffect(() => {
    resizeQuestionInput()
  }, [question])

  useEffect(() => {
    return () => {
      if (programmaticChatScrollTimeoutRef.current !== null) {
        window.clearTimeout(programmaticChatScrollTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const previousEntryCount = previousEntryCountRef.current
    previousEntryCountRef.current = entries.length

    if (entries.length === 0) {
      setShowScrollLatestButton(false)
      return
    }

    let nextFrameId = 0
    const frameId = window.requestAnimationFrame(() => {
      nextFrameId = window.requestAnimationFrame(() => {
        scrollToLatestChat(
          entries.length > previousEntryCount ? 'smooth' : 'auto',
        )
      })
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      window.cancelAnimationFrame(nextFrameId)
    }
  }, [entries.length])

  useEffect(() => {
    if (!showTruth || hintItems.length === 0) {
      return
    }

    const allHintIndexes = hintItems.map((_, index) => index)
    if (allHintIndexes.every((index) => revealedHintIndexes.includes(index))) {
      return
    }

    setRevealedHintIndexes((current) =>
      mergeHintIndexes(current, allHintIndexes, hintItems.length),
    )
    openHintTrayWithoutPageJump()
  }, [hintItems, revealedHintIndexes, showTruth])

  useEffect(() => {
    saveGuideMessagePreference(showGuideMessage)
  }, [showGuideMessage])

  useEffect(() => {
    saveQuestionPromptPreference(showQuestionPrompts)
  }, [showQuestionPrompts])

  useEffect(() => {
    if (!showRevealModeToast) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setShowRevealModeToast(false)
    }, 1900)

    return () => window.clearTimeout(timeoutId)
  }, [showRevealModeToast, revealModeToastKey])

  useEffect(() => {
    saveSoundPreference(soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    if (!isSettingsOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSettingsOpen])

  useEffect(() => {
    if (!truthDialogMode || truthDialogMode === 'limit') {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setTruthDialogMode(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [truthDialogMode])

  function maybeOpenQuestionLimitDialog() {
    if (!hasAcceptedLimitOverrun && isQuestionBudgetExhausted && !showTruth) {
      setTruthDialogMode('limit')
      return true
    }

    return false
  }

  function requireLoginForPlay() {
    setError('')
    onOpenAuth('register')
  }

  function handleHintEnabledChange(isEnabled: boolean) {
    setHintEnabled(isEnabled)
    saveHintPreference(isEnabled)
  }

  function requestRevealHint(hintIndex: number) {
    if (!isAuthenticated) {
      requireLoginForPlay()
      return
    }

    if (showTruth || revealedHintIndexes.includes(hintIndex)) {
      return
    }

    setPendingHintIndex(hintIndex)
    setTruthDialogMode('hintConfirm')
  }

  function confirmRevealHint() {
    if (pendingHintIndex === null) {
      setTruthDialogMode(null)
      return
    }

    const nextRevealedHintIndexes = mergeHintIndexes(
      revealedHintIndexes,
      [pendingHintIndex],
      hintItems.length,
    )
    const nextChargedHintIndexes = mergeHintIndexes(
      chargedHintIndexes,
      [pendingHintIndex],
      hintItems.length,
    )

    setRevealedHintIndexes(nextRevealedHintIndexes)
    setChargedHintIndexes(nextChargedHintIndexes)
    maybeShowHintUnlockGuide(nextRevealedHintIndexes.length)
    setPendingHintIndex(null)

    if (
      !hasAcceptedLimitOverrun &&
      entries.length + nextChargedHintIndexes.length * hintSettings.hintCost >=
        hintSettings.questionLimit
    ) {
      setTruthDialogMode('limit')
      return
    }

    setTruthDialogMode(null)
  }

  function openHintTrayWithoutPageJump() {
    if (isHintTrayOpen) {
      return
    }

    const scrollX = window.scrollX
    const scrollY = window.scrollY

    setIsHintTrayOpen(true)

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, left: scrollX, behavior: 'auto' })
    })
  }

  function resizeQuestionInput() {
    const input = questionInputRef.current

    if (!input) {
      return
    }

    input.style.height = 'auto'

    const maxHeight = Number.parseFloat(
      window.getComputedStyle(input).maxHeight,
    )
    const contentHeight = input.scrollHeight
    const nextHeight = Number.isFinite(maxHeight)
      ? Math.min(contentHeight, maxHeight)
      : contentHeight

    input.style.height = nextHeight + 'px'
    input.style.overflowY =
      Number.isFinite(maxHeight) && contentHeight > maxHeight
        ? 'auto'
        : 'hidden'
  }

  function isChatScrolledToLatest() {
    const list = chatListRef.current

    if (!list) {
      return true
    }

    return list.scrollHeight - list.scrollTop - list.clientHeight < 36
  }

  function updateScrollLatestButton() {
    if (isProgrammaticChatScrollRef.current) {
      if (isChatScrolledToLatest()) {
        isProgrammaticChatScrollRef.current = false
        setIsReturningToLatest(false)
      } else {
        setShowScrollLatestButton(false)
        return
      }
    }

    setShowScrollLatestButton(!isChatScrolledToLatest())
  }

  function scrollToLatestChat(behavior: ScrollBehavior = 'smooth') {
    const list = chatListRef.current

    if (!list) {
      return
    }

    isProgrammaticChatScrollRef.current = true
    setIsReturningToLatest(true)
    if (programmaticChatScrollTimeoutRef.current !== null) {
      window.clearTimeout(programmaticChatScrollTimeoutRef.current)
    }
    setShowScrollLatestButton(false)

    list.scrollTo({
      top: list.scrollHeight,
      behavior,
    })

    programmaticChatScrollTimeoutRef.current = window.setTimeout(
      () => {
        isProgrammaticChatScrollRef.current = false
        setIsReturningToLatest(false)
        updateScrollLatestButton()
      },
      behavior === 'smooth' ? 520 : 0,
    )
  }

  function focusQuestionInput() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        questionInputRef.current?.focus()
      })
    })
  }

  function handleQuestionKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key !== 'Enter' ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return
    }

    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }

  function insertQuestionPrompt(prompt: string) {
    if (isLoading || !isAuthenticated) {
      return
    }

    const input = questionInputRef.current
    const selectionStart = input?.selectionStart ?? question.length
    const selectionEnd = input?.selectionEnd ?? question.length
    const remainingLength =
      160 - (question.length - (selectionEnd - selectionStart))

    if (remainingLength <= 0) {
      focusQuestionInput()
      return
    }

    const insertedPrompt = prompt.slice(0, remainingLength)
    const nextQuestion =
      question.slice(0, selectionStart) +
      insertedPrompt +
      question.slice(selectionEnd)
    const nextCursorPosition = selectionStart + insertedPrompt.length

    setQuestion(nextQuestion)

    window.requestAnimationFrame(() => {
      const nextInput = questionInputRef.current
      if (!nextInput) {
        return
      }

      nextInput.focus()
      nextInput.setSelectionRange(nextCursorPosition, nextCursorPosition)
    })
  }

  function showNextQuestionPromptGroup() {
    setQuestionPromptGroupIndex(
      (current) => (current + 1) % questionPromptGroups.length,
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isAuthenticated) {
      requireLoginForPlay()
      return
    }

    const trimmedQuestion = question.trim()

    if (!trimmedQuestion) {
      setError('请输入一个问题。')
      return
    }

    if (maybeOpenQuestionLimitDialog()) {
      return
    }

    setIsLoading(true)
    setError('')
    playUiSound('send', soundEnabled)
    let shouldFocusAfterReply = false

    try {
      const hintCandidates = hintItems
        .map((text, index) => ({ index, text }))
        .filter(({ index }) => !revealedHintIndexes.includes(index))
      const answer = await askAi({
        storyId: story.id,
        surface: story.surface,
        truth: story.truth,
        question: trimmedQuestion,
        hintCandidates,
        hintEnabled,
        revealMode,
        model: selectedModel,
        mode: 'single_turn_lateral_thinking_host',
      })

      const nextEntries = [
        ...entries,
        {
          id: `${Date.now()}-${entries.length}`,
          question: trimmedQuestion,
          answer,
          askedAt: new Date().toISOString(),
        },
      ]

      setEntries(nextEntries)
      setQuestion('')
      playUiSound('reply', soundEnabled)
      const autoRevealHintIndexes = hintEnabled
        ? getAutoRevealHintIndexes(
            answer.hint,
            hintItems,
            revealedHintIndexes,
            trimmedQuestion,
          )
        : []
      const nextRevealedHintIndexes = mergeHintIndexes(
        revealedHintIndexes,
        [...(answer.matchedHintIndexes ?? []), ...autoRevealHintIndexes],
        hintItems.length,
      )
      const didUnlockHint =
        nextRevealedHintIndexes.length > revealedHintIndexes.length

      if (didUnlockHint) {
        setRevealedHintIndexes(nextRevealedHintIndexes)
        openHintTrayWithoutPageJump()
        maybeShowHintUnlockGuide(nextRevealedHintIndexes.length)
      }
      if (revealMode && answer.answer === '还原正确') {
        playUiSound('celebrate', soundEnabled)
        setShowTruth(true)
        setTruthDialogMode('revealed')
      } else if (
        !hasAcceptedLimitOverrun &&
        nextEntries.length +
          chargedHintIndexes.length * hintSettings.hintCost >=
          hintSettings.questionLimit
      ) {
        setTruthDialogMode('limit')
      } else {
        shouldFocusAfterReply = true
      }
    } catch (error) {
      console.error('AI request failed', error)
      setError('暂时没有回应，请稍后再试。')
    } finally {
      setIsLoading(false)
      if (shouldFocusAfterReply) {
        focusQuestionInput()
      }
    }
  }

  function handleRevealTruth() {
    if (!isAuthenticated) {
      requireLoginForPlay()
      return
    }

    setTruthDialogMode('confirm')
  }

  function confirmRevealTruth() {
    setShowTruth(true)
    setTruthDialogMode('revealed')
  }

  function continueAfterQuestionLimit() {
    setHasAcceptedLimitOverrun(true)
    setTruthDialogMode(null)
  }

  function revealTruthAfterQuestionLimit() {
    setShowTruth(true)
    setTruthDialogMode('limitRevealed')
  }

  function maybeShowHintUnlockGuide(unlockedCount: number) {
    if (unlockedCount < 2 || hasSeenHintUnlockGuide) {
      return
    }

    setHasSeenHintUnlockGuide(true)
    setShowHintUnlockGuide(true)
  }

  function openRevealModeFromGuide() {
    if (isLoading) {
      return
    }

    setRevealMode(true)
    setShowHintUnlockGuide(false)
    setRevealModeToastKey((current) => current + 1)
    setShowRevealModeToast(true)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
  }

  function openRandomStory() {
    openRandomUnrevealedStory(completedStoryIds, story.id)
  }

  function openNextStory() {
    const currentIndex = stories.findIndex(
      (candidate) => candidate.id === story.id,
    )
    const nextStory =
      stories[currentIndex >= 0 ? (currentIndex + 1) % stories.length : 0]

    window.location.href = getStoryPath(nextStory.id)
  }

  return (
    <main className="app-shell story-layout">
      <nav className="story-nav" aria-label="页面导航">
        <div className="story-nav-actions">
          <a
            aria-label="返回首页"
            className="nav-round-button"
            href="#"
            title="返回首页"
          >
            <ArrowLeft size={19} />
          </a>
          <button
            aria-label="复制链接"
            className="nav-round-button"
            title="复制链接"
            type="button"
            onClick={copyLink}
          >
            <Link2 size={18} />
          </button>
        </div>
      </nav>

      <section className="story-title">
        <div>
          <p className="eyebrow">当前汤题</p>
          <div className="story-heading-line">
            <h1>{story.title}</h1>
            <span className={`difficulty ${story.difficulty}`}>
              {difficultyText[story.difficulty]}
            </span>
          </div>
        </div>
      </section>

      <section className="surface-band">
        <h2>汤面</h2>
        <p>{story.surface}</p>
      </section>

      <section className="game-panel">
        <div className="panel-toolbar">
          <div className="panel-heading">
            <div className="panel-title-row">
              <h2>问答</h2>
            </div>
            {/* <p>先从关键线索入手，再逐步缩小范围。</p> */}
          </div>
          <div className="settings-popover" ref={settingsRef}>
            <button
              aria-expanded={isSettingsOpen}
              aria-haspopup="dialog"
              className={
                isSettingsOpen ? 'settings-button active' : 'settings-button'
              }
              type="button"
              onClick={() => setIsSettingsOpen((current) => !current)}
            >
              <Settings size={18} />
              设置
            </button>
            {isSettingsOpen ? (
              <div
                aria-label="问答设置"
                className="settings-panel"
                role="dialog"
              >
                <ModelPicker
                  selectedModel={selectedModel}
                  onSelectedModelChange={onSelectedModelChange}
                />
                <label className="switch">
                  <input
                    checked={hintEnabled}
                    disabled={isLoading}
                    type="checkbox"
                    onChange={(event) =>
                      handleHintEnabledChange(event.target.checked)
                    }
                  />
                  <span>提示模式</span>
                </label>
                <label className="switch">
                  <input
                    checked={revealMode}
                    disabled={isLoading}
                    type="checkbox"
                    onChange={(event) => setRevealMode(event.target.checked)}
                  />
                  <span>揭晓模式</span>
                </label>
                <label className="switch">
                  <input
                    checked={showGuideMessage}
                    type="checkbox"
                    onChange={(event) =>
                      setShowGuideMessage(event.target.checked)
                    }
                  />
                  <span>显示玩法说明</span>
                </label>
                <label className="switch">
                  <input
                    checked={showQuestionPrompts}
                    type="checkbox"
                    onChange={(event) =>
                      setShowQuestionPrompts(event.target.checked)
                    }
                  />
                  <span>显示提问词</span>
                </label>
                <label className="switch">
                  <input
                    checked={soundEnabled}
                    type="checkbox"
                    onChange={(event) => setSoundEnabled(event.target.checked)}
                  />
                  <span>音效</span>
                </label>
              </div>
            ) : null}
          </div>
        </div>

        <div className="chat-list-shell">
          <div
            className="chat-list"
            aria-live="polite"
            ref={chatListRef}
            onScroll={updateScrollLatestButton}
          >
            {showGuideMessage ? (
              <article className="guide-message">
                <div>
                  <span>玩法说明</span>
                  <div className="guide-message-copy">
                    <p>右上角设置可切换 模型和游玩模式</p>
                    <p>
                      <strong>提示模式：</strong>回答会附带 方向提示
                    </p>
                    <p>
                      <strong>揭晓模式：</strong>用于提交 完整真相
                    </p>
                    <p>
                      <strong>提示：</strong>可查看提示，消耗提问次数
                    </p>
                  </div>
                </div>
                <button
                  aria-label="关闭玩法说明"
                  className="guide-message-action guide-message-close"
                  type="button"
                  onClick={() => setShowGuideMessage(false)}
                >
                  <X size={16} />
                </button>
              </article>
            ) : null}
            {showHintUnlockGuide ? (
              <article className="guide-message hint-unlock-guide">
                <div>
                  <span>提示已解锁</span>
                  <div className="guide-message-copy">
                    <p>
                      你已经抓住关键线索，可以在设置里开启
                      <strong>揭晓模式</strong>
                      ，说出完整答案。
                    </p>
                  </div>
                </div>
                <div className="guide-message-actions">
                  <button
                    aria-label="打开揭晓模式"
                    aria-pressed={revealMode}
                    className="guide-message-action guide-message-confirm"
                    disabled={isLoading}
                    title="打开揭晓模式"
                    type="button"
                    onClick={openRevealModeFromGuide}
                  >
                    <CheckCircle2 size={16} />
                  </button>
                  <button
                    aria-label="关闭提示解锁提醒"
                    className="guide-message-action guide-message-close"
                    type="button"
                    onClick={() => setShowHintUnlockGuide(false)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </article>
            ) : null}
            {showRevealModeToast ? (
              <div
                aria-live="polite"
                className="mode-toast"
                key={revealModeToastKey}
                role="status"
              >
                <CheckCircle2 size={16} />
                已打开揭晓模式
              </div>
            ) : null}
            {entries.length === 0 ? (
              <div className="empty-chat">
                <Sparkles size={22} />
                <p>
                  {isAuthenticated
                    ? '先问一个能用“是 / 不是 / 是也不是 / 无关”回答的问题。'
                    : '阅读汤面后，登录即可开始提问并保存记录。'}
                </p>
              </div>
            ) : (
              entries.map((entry, index) => (
                <ChatBubble entry={entry} entryIndex={index} key={entry.id} />
              ))
            )}
          </div>
          {showScrollLatestButton && !isReturningToLatest ? (
            <button
              aria-label="返回最新聊天历史"
              className="scroll-latest-button"
              type="button"
              onClick={() => scrollToLatestChat('smooth')}
            >
              <ArrowDown size={16} />
              最新
            </button>
          ) : null}
        </div>

        {hintItems.length > 0 ? (
          <HintShelf
            hints={hintItems}
            isCompactOpen={isHintTrayOpen}
            isDisabled={isLoading || showTruth}
            limit={hintSettings.questionLimit}
            revealedIndexes={revealedHintIndexes}
            used={usedQuestionBudget}
            onRevealHint={requestRevealHint}
            onToggleCompact={() => setIsHintTrayOpen((current) => !current)}
            promptActions={
              showQuestionPrompts ? (
                <QuestionPromptStrip
                  isDisabled={isLoading || !isAuthenticated}
                  prompts={activeQuestionPrompts}
                  onClose={() => setShowQuestionPrompts(false)}
                  onInsertPrompt={insertQuestionPrompt}
                  onRefresh={showNextQuestionPromptGroup}
                />
              ) : null
            }
          />
        ) : null}

        <form className="ask-form" onSubmit={handleSubmit}>
          <div className={askInputClassName}>
            <textarea
              aria-label="输入你的问题"
              disabled={isLoading || !isAuthenticated}
              maxLength={160}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleQuestionKeyDown}
              placeholder={
                !isAuthenticated
                  ? '登录后开始提问'
                  : revealMode
                    ? '输入你还原出的完整真相'
                    : '例如：这个男人认识死者吗？'
              }
              ref={questionInputRef}
              rows={1}
              value={question}
            />
            {hintItems.length > 0 ? (
              <UnlockProgressBar percent={unlockProgressPercent} />
            ) : null}
          </div>
          <button disabled={isLoading} type="submit">
            {isLoading ? (
              <RefreshCw className="spin" size={18} />
            ) : !isAuthenticated ? (
              <LogIn size={18} />
            ) : (
              <Send size={18} />
            )}
            {isAuthenticated ? '发送' : '登录后提问'}
          </button>
        </form>
        {error ? <p className="error-text">{error}</p> : null}
      </section>

      <section className={showTruth ? 'truth-panel revealed' : 'truth-panel'}>
        <div>
          <h2>汤底</h2>
          <p>
            {showTruth ? story.truth : '答案已隐藏。确认想看完整真相时再打开。'}
          </p>
        </div>
        {!showTruth ? (
          <button
            className="secondary-button"
            type="button"
            onClick={handleRevealTruth}
          >
            <Eye size={18} />
            查看汤底
          </button>
        ) : null}
      </section>

      {showTruth ? <SourcePanel source={story.source} /> : null}

      <div className="story-action-row">
        <button
          className="reset-button"
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              requireLoginForPlay()
              return
            }

            onProgressClear(story.id)
            setEntries([])
            setShowTruth(false)
            setRevealedHintIndexes([])
            setChargedHintIndexes([])
            setHasSeenHintUnlockGuide(false)
            setShowHintUnlockGuide(false)
            setHasAcceptedLimitOverrun(false)
            setTruthDialogMode(null)
            setPendingHintIndex(null)
            setIsHintTrayOpen(false)
            setHintEnabled(true)
            setRevealMode(false)
            setError('')
          }}
        >
          <RefreshCw size={18} />
          重新开始
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={openRandomStory}
        >
          <Shuffle size={18} />
          随机一题
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={openNextStory}
        >
          <ArrowRight size={18} />
          下一题
        </button>
      </div>

      <SiteFooter />
      {truthDialogMode ? (
        <TruthRevealDialog
          mode={truthDialogMode}
          story={story}
          hintCost={hintSettings.hintCost}
          questionLimit={hintSettings.questionLimit}
          onClose={() => {
            setTruthDialogMode(null)
            setPendingHintIndex(null)
          }}
          onContinue={continueAfterQuestionLimit}
          onConfirm={confirmRevealTruth}
          onConfirmHint={confirmRevealHint}
          onRevealAfterLimit={revealTruthAfterQuestionLimit}
        />
      ) : null}
    </main>
  )
}

function MissingStory() {
  return (
    <main className="app-shell centered-state">
      <Home size={34} />
      <h1>没有找到这个汤题。</h1>
      <a className="icon-button" href="#">
        返回首页
      </a>
    </main>
  )
}

export default App
