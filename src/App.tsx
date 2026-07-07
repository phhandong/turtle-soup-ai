import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ChevronDown,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Eye,
  ImageUp,
  Lightbulb,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  PartyPopper,
  X,
  Home,
  Link2,
  RefreshCw,
  Save,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Shuffle,
  UserRound,
} from 'lucide-react'
import { stories, getStoryById } from './data/stories'
import { askAi } from './services/aiClient'
import {
  ApiError,
  deleteProgressRecord,
  getCurrentUser,
  getProgressRecords,
  loginUser,
  logoutUser,
  registerUser,
  saveProgressRecord,
  updateProfile,
  type AuthUser,
  type ProgressRecord,
  type StoryProgressData,
} from './services/authClient'
import type { AiModelId, ChatEntry, Difficulty, Story } from './types/story'
import { getCurrentStoryId, getStoryPath } from './utils/routes'

const STORY_PROGRESS_STORAGE_PREFIX = 'turtle-soup-history:'
const MODEL_STORAGE_KEY = 'turtle-soup-model'
const GUIDE_MESSAGE_STORAGE_KEY = 'turtle-soup-guide-message'
const HINT_ENABLED_STORAGE_KEY = 'turtle-soup-hint-enabled'
const SOUND_ENABLED_STORAGE_KEY = 'turtle-soup-sound-enabled'
const AUTH_USER_STORAGE_KEY = 'turtle-soup-auth-user'
const DEFAULT_AI_MODEL: AiModelId = 'deepseek-v4-flash'
type ProgressByStoryId = Record<string, ProgressRecord>

const modelOptions: Array<{ id: AiModelId; label: string }> = [
  { id: 'agnes-2.0-flash', label: 'Agnes 2.0 Flash' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
]

const difficultyText: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

const difficultyOptions: Difficulty[] = ['easy', 'medium', 'hard']
const pageSizeOptions = [10, 20, 50] as const
const defaultHintSettings: Record<
  Difficulty,
  { questionLimit: number; hintCost: number }
> = {
  easy: { questionLimit: 30, hintCost: 10 },
  medium: { questionLimit: 45, hintCost: 15 },
  hard: { questionLimit: 60, hintCost: 20 },
}
type TruthDialogMode =
  | 'confirm'
  | 'hintConfirm'
  | 'revealed'
  | 'limit'
  | 'limitRevealed'

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
      const optimisticRecord = makeProgressRecord(storyId, progress)
      setProgressByStoryId((current) => ({
        ...current,
        [storyId]: optimisticRecord,
      }))
      setProgressSyncError('')

      void saveProgressRecord(storyId, progress)
        .then((record) => {
          setProgressByStoryId((current) => ({
            ...current,
            [storyId]: record,
          }))
        })
        .catch((error) => {
          console.error('Failed to sync story progress', error)
          setProgressSyncError('做题记录暂时没有同步成功。')
        })
    },
    [],
  )

  const handleProgressClear = useCallback((storyId: string) => {
    setProgressByStoryId((current) => {
      const next = { ...current }
      delete next[storyId]
      return next
    })
    setProgressSyncError('')

    void deleteProgressRecord(storyId).catch((error) => {
      console.error('Failed to delete story progress', error)
      setProgressSyncError('重开记录暂时没有同步成功。')
    })
  }, [])

  if (authUser && isAuthVerified && isProgressLoading && storyId) {
    return <LoadingScreen message="正在读取你的做题记录..." />
  }

  if (storyId && !story) {
    return <MissingStory />
  }

  if (!authUser && (authRequestMode || isProfilePage) && !showSessionExpiredDialog) {
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

function AuthGate({
  defaultMode,
  error,
  onAuthenticated,
  onBackHome,
}: {
  defaultMode: 'login' | 'register'
  error: string
  onAuthenticated: (user: AuthUser) => Promise<void>
  onBackHome: () => void
}) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState(error)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFormError(error)
  }, [error])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setFormError('')

    try {
      const user =
        mode === 'register'
          ? await registerUser({ username, email, password })
          : await loginUser({ identity, password })
      await onAuthenticated(user)
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : '请求失败，请稍后再试。',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function switchMode(nextMode: 'login' | 'register') {
    setMode(nextMode)
    setPassword('')
    setFormError('')
  }

  return (
    <main className="app-shell auth-shell">
      <section className="auth-hero">
        <p className="eyebrow">Turtle Soup</p>
        <h1>登录后开始推理。</h1>
        <p>
          题库可以自由浏览；进入一题后，追问、提示和揭晓会保存到你的账号里。
        </p>
      </section>

      <section className="auth-panel" aria-label="用户登录注册">
        <button className="auth-back-button" type="button" onClick={onBackHome}>
          <ArrowLeft size={17} />
          返回题库
        </button>
        <div className="auth-tabs" role="tablist">
          <button
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            type="button"
            onClick={() => switchMode('login')}
          >
            <LogIn size={17} />
            登录
          </button>
          <button
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            type="button"
            onClick={() => switchMode('register')}
          >
            <UserRound size={17} />
            注册
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <>
              <label>
                <span>用户名</span>
                <div className="auth-field">
                  <UserRound size={18} />
                  <input
                    autoComplete="username"
                    maxLength={24}
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>
              </label>
              <label>
                <span>邮箱</span>
                <div className="auth-field">
                  <Mail size={18} />
                  <input
                    autoComplete="email"
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </label>
            </>
          ) : (
            <label>
              <span>用户名或邮箱</span>
              <div className="auth-field">
                <UserRound size={18} />
                <input
                  autoComplete="username"
                  required
                  value={identity}
                  onChange={(event) => setIdentity(event.target.value)}
                />
              </div>
            </label>
          )}

          <label>
            <span>密码</span>
            <div className="auth-field">
              <LockKeyhole size={18} />
              <input
                autoComplete={
                  mode === 'register' ? 'new-password' : 'current-password'
                }
                minLength={8}
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </label>

          {formError ? <p className="error-text">{formError}</p> : null}

          <button className="auth-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <RefreshCw className="spin" size={18} />
            ) : mode === 'register' ? (
              <UserRound size={18} />
            ) : (
              <LogIn size={18} />
            )}
            {mode === 'register' ? '创建账号' : '登录'}
          </button>
          <button
            className="auth-switch-link"
            type="button"
            onClick={() =>
              switchMode(mode === 'register' ? 'login' : 'register')
            }
          >
            {mode === 'register' ? '已有账号？去登录' : '还没有账号？去注册'}
          </button>
        </form>
      </section>
    </main>
  )
}

function makeProgressRecord(
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

function HomePage({
  user,
  progressByStoryId,
  onOpenAuth,
  onLogout,
}: {
  user: AuthUser | null
  progressByStoryId: ProgressByStoryId
  onOpenAuth: (mode: 'login' | 'register') => void
  onLogout: () => void
}) {
  const [activeTag, setActiveTag] = useState('全部')
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | '全部'>(
    '全部',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [showUncompleted, setShowUncompleted] = useState(false)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [isHistoryPanelDismissed, setIsHistoryPanelDismissed] =
    useState(false)
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(10)
  const [currentPage, setCurrentPage] = useState(1)
  const tags = useMemo(
    () => [
      '全部',
      ...Array.from(new Set(stories.flatMap((story) => story.tags))),
    ],
    [],
  )
  const completedStoryIds = useMemo(
    () =>
      new Set(
        Object.values(progressByStoryId)
          .filter((record) => record.completed)
          .map((record) => record.storyId),
      ),
    [progressByStoryId],
  )
  const recentProgressItems = useMemo(
    () =>
      Object.values(progressByStoryId)
        .filter((record) => record.entriesCount > 0 || record.completed)
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() -
            new Date(left.updatedAt).getTime(),
        )
        .slice(0, 5)
        .map((record) => ({
          ...record,
          story: getStoryById(record.storyId),
        }))
        .filter((item) => item.story),
    [progressByStoryId],
  )
  const filteredStories = useMemo(
    () =>
      stories.filter((story) => {
        const completed = completedStoryIds.has(story.id)
        const matchesTag =
          activeTag === '全部' || story.tags.includes(activeTag)
        const matchesDifficulty =
          activeDifficulty === '全部' || story.difficulty === activeDifficulty
        const matchesRevealStatus =
          (!showCompleted && !showUncompleted) ||
          (showCompleted && showUncompleted) ||
          (showCompleted && completed) ||
          (showUncompleted && !completed)
        const matchesSearch = storyMatchesSearch(story, searchQuery)

        return (
          matchesTag &&
          matchesDifficulty &&
          matchesRevealStatus &&
          matchesSearch
        )
      }),
    [
      activeDifficulty,
      activeTag,
      completedStoryIds,
      searchQuery,
      showCompleted,
      showUncompleted,
    ],
  )
  const completedCount = completedStoryIds.size
  const pageCount = Math.max(1, Math.ceil(filteredStories.length / pageSize))
  const visiblePageItems = getVisiblePageItems(currentPage, pageCount)
  const pageStartIndex = (currentPage - 1) * pageSize
  const paginatedStories = filteredStories.slice(
    pageStartIndex,
    pageStartIndex + pageSize,
  )
  const visibleStart = filteredStories.length === 0 ? 0 : pageStartIndex + 1
  const visibleEnd = Math.min(pageStartIndex + pageSize, filteredStories.length)

  useEffect(() => {
    setCurrentPage(1)
  }, [
    activeDifficulty,
    activeTag,
    pageSize,
    searchQuery,
    showCompleted,
    showUncompleted,
  ])

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount)
    }
  }, [currentPage, pageCount])

  useEffect(() => {
    setIsHistoryPanelDismissed(false)
  }, [user?.id])

  function openRandomStory() {
    if (!user) {
      openRandomUnrevealedStory(new Set())
      return
    }

    openRandomUnrevealedStory(completedStoryIds)
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Turtle Soup</p>
          <h1>海龟汤问答</h1>
          <p className="topbar-subtitle">
            像翻案卷一样挑选谜题，向 AI 主持人追问线索。
          </p>
        </div>
        <div className="topbar-actions">
          <button className="api-pill" type="button" onClick={openRandomStory}>
            <Shuffle size={18} />
            随机做一题
          </button>
          {user ? (
            <AccountMenu user={user} onLogout={onLogout} />
          ) : (
            <AuthEntryButton onOpenAuth={onOpenAuth} />
          )}
        </div>
      </section>

      <section className="intro-band">
        <div className="intro-copy">
          <h2>选择一道汤题，开始提问。</h2>
        </div>
        <div className="intro-ledger" aria-label="题库概览">
          <span>
            <strong>{stories.length}</strong>
            汤题
          </span>
          <span>
            <strong>{completedCount}</strong>
            已揭晓
          </span>
        </div>
      </section>

      {user && recentProgressItems.length > 0 && !isHistoryPanelDismissed ? (
        <section className="history-panel" aria-label="最近做题记录">
          <div className="history-panel-heading">
            <h2>最近记录</h2>
            <button
              aria-label="关闭最近记录"
              className="history-close-button"
              type="button"
              onClick={() => setIsHistoryPanelDismissed(true)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="history-list">
            {recentProgressItems.map(({ story, completed }) =>
              story ? (
                <a
                  className={
                    completed ? 'history-item completed' : 'history-item'
                  }
                  href={getStoryPath(story.id)}
                  key={story.id}
                >
                  <span>{story.title}</span>
                  {completed ? (
                    <CheckCircle2
                      aria-label="已揭晓"
                      className="history-completed-icon"
                      size={18}
                    />
                  ) : null}
                </a>
              ) : null,
            )}
          </div>
        </section>
      ) : null}

      <section className="search-panel" aria-label="搜索和显示选项">
        <label className="search-field">
          {/* <span>模糊搜索</span> */}
          <input
            type="search"
            value={searchQuery}
            placeholder="搜标题、汤面、摘要、标签或来源"
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <button
          aria-controls="home-filter-panel"
          aria-expanded={isFilterPanelOpen}
          className={
            isFilterPanelOpen ||
            activeTag !== '全部' ||
            activeDifficulty !== '全部' ||
            showCompleted ||
            showUncompleted
              ? 'filter-toggle active'
              : 'filter-toggle'
          }
          type="button"
          onClick={() => setIsFilterPanelOpen((isOpen) => !isOpen)}
        >
          <SlidersHorizontal size={18} />
          筛选
        </button>

        {isFilterPanelOpen ? (
          <div className="filter-tray" id="home-filter-panel">
            <fieldset className="reveal-filter">
              <label>
                <input
                  checked={showCompleted}
                  type="checkbox"
                  onChange={(event) => setShowCompleted(event.target.checked)}
                />
                已揭晓
              </label>
              <label>
                <input
                  checked={showUncompleted}
                  type="checkbox"
                  onChange={(event) => setShowUncompleted(event.target.checked)}
                />
                未揭晓
              </label>
            </fieldset>

            <div className="filter-row" aria-label="题目标签筛选">
              {tags.map((tag) => (
                <button
                  className={tag === activeTag ? 'chip active' : 'chip'}
                  key={tag}
                  type="button"
                  onClick={() =>
                    setActiveTag((currentTag) =>
                      currentTag === tag ? '全部' : tag,
                    )
                  }
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="filter-row" aria-label="题目难度筛选">
              <button
                className={activeDifficulty === '全部' ? 'chip active' : 'chip'}
                type="button"
                onClick={() => setActiveDifficulty('全部')}
              >
                全部难度
              </button>
              {difficultyOptions.map((difficulty) => (
                <button
                  className={
                    activeDifficulty === difficulty
                      ? `chip difficulty-chip ${difficulty} active`
                      : `chip difficulty-chip ${difficulty}`
                  }
                  key={difficulty}
                  type="button"
                  onClick={() =>
                    setActiveDifficulty((currentDifficulty) =>
                      currentDifficulty === difficulty ? '全部' : difficulty,
                    )
                  }
                >
                  {difficultyText[difficulty]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* <section className="filter-row" aria-label="题目难度筛选">

      </section> */}

      {paginatedStories.length > 0 ? (
        <section className="story-grid" aria-label="海龟汤题目列表">
          {paginatedStories.map((story, index) => (
            <StoryCard
              animationIndex={index}
              completed={completedStoryIds.has(story.id)}
              key={story.id}
              story={story}
            />
          ))}
        </section>
      ) : (
        <section className="empty-results" aria-live="polite">
          <CircleHelp size={24} />
          <p>换个关键词，或清空筛选条件再试。</p>
        </section>
      )}

      <section className="result-toolbar" aria-label="分页信息">
        <div className="result-summary">
          <p>
            {filteredStories.length === 0
              ? '没有找到匹配的汤题。'
              : '显示第 ' +
                visibleStart +
                '-' +
                visibleEnd +
                ' 道，共 ' +
                filteredStories.length +
                ' 道'}
          </p>
          <PageSizePicker pageSize={pageSize} onPageSizeChange={setPageSize} />
        </div>
        <div className="pagination" aria-label="题目分页">
          <button
            className="pagination-button"
            disabled={currentPage === 1}
            type="button"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            上一页
          </button>
          <div className="pagination-pages">
            {visiblePageItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span aria-hidden="true" key={`ellipsis-${index}`}>
                  …
                </span>
              ) : (
                <button
                  aria-current={item === currentPage ? 'page' : undefined}
                  className={
                    item === currentPage
                      ? 'pagination-button active'
                      : 'pagination-button'
                  }
                  key={item}
                  type="button"
                  onClick={() => setCurrentPage(item)}
                >
                  {item}
                </button>
              ),
            )}
          </div>
          <button
            className="pagination-button"
            disabled={currentPage === pageCount}
            type="button"
            onClick={() =>
              setCurrentPage((page) => Math.min(pageCount, page + 1))
            }
          >
            下一页
          </button>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

function AuthEntryButton({
  onOpenAuth,
}: {
  onOpenAuth: (mode: 'login' | 'register') => void
}) {
  return (
    <button
      aria-label="登录或注册"
      className="auth-entry-button"
      type="button"
      onClick={() => onOpenAuth('login')}
    >
      <UserRound size={18} />
      登录/注册
    </button>
  )
}

function AccountMenu({
  user,
  onLogout,
}: {
  user: AuthUser
  onLogout: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="打开个人菜单"
        className="avatar-button"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <UserAvatar user={user} />
      </button>
      {isOpen ? (
        <div className="account-menu-panel" role="menu">
          <p className="account-menu-title">个人详情</p>
          <strong>{user.username}</strong>
          <span>{user.email}</span>
          <a href="#/profile" role="menuitem">
            <UserRound size={16} />
            编辑资料
          </a>
          <button type="button" role="menuitem" onClick={onLogout}>
            <LogOut size={16} />
            退出账号
          </button>
        </div>
      ) : null}
    </div>
  )
}

function ProfilePage({
  user,
  onBackHome,
  onUserChange,
}: {
  user: AuthUser
  onBackHome: () => void
  onUserChange: (user: AuthUser) => void
}) {
  const [username, setUsername] = useState(user.username)
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewUser = { ...user, username, avatarUrl }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setError('')
    setNotice('')
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      setError('头像仅支持 PNG、JPG、WebP 或 GIF。')
      return
    }

    if (file.size > 256 * 1024) {
      setError('头像文件需小于 256 KB。')
      return
    }

    const dataUrl = await readFileAsDataUrl(file)
    setAvatarUrl(dataUrl)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    setNotice('')

    try {
      const updatedUser = await updateProfile({
        username,
        avatarUrl,
      })
      onUserChange(updatedUser)
      setNotice('资料已保存。')
    } catch (error) {
      setError(
        error instanceof ApiError ? error.message : '保存失败，请稍后再试。',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="app-shell profile-shell">
      <nav className="story-nav" aria-label="页面导航">
        <button
          aria-label="返回首页"
          className="nav-round-button"
          title="返回首页"
          type="button"
          onClick={onBackHome}
        >
          <ArrowLeft size={19} />
        </button>
      </nav>

      <section className="profile-panel">
        <div className="profile-heading">
          <div>
            <p className="eyebrow">Profile</p>
            <h1>个人资料</h1>
          </div>
          <UserAvatar className="profile-avatar" user={previewUser} />
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label>
            <span>用户名</span>
            <input
              maxLength={24}
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label>
            <span>邮箱</span>
            <input readOnly value={user.email} />
          </label>

          <div className="profile-upload-row">
            <input
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="visually-hidden"
              ref={fileInputRef}
              type="file"
              onChange={handleAvatarChange}
            />
            <button
              className="secondary-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageUp size={18} />
              上传头像
            </button>
          </div>

          {error ? <p className="error-text">{error}</p> : null}
          {notice ? <p className="success-text">{notice}</p> : null}

          <button className="auth-submit" disabled={isSaving} type="submit">
            {isSaving ? (
              <RefreshCw className="spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            保存资料
          </button>
        </form>
      </section>
    </main>
  )
}

function UserAvatar({
  className = '',
  user,
}: {
  className?: string
  user: Pick<AuthUser, 'avatarKey' | 'avatarUrl' | 'username'>
}) {
  if (user.avatarUrl) {
    return (
      <span className={`avatar-image ${className}`.trim()} aria-hidden="true">
        <img alt="" src={user.avatarUrl} />
      </span>
    )
  }

  const avatarClassName = `avatar-mark ${getAvatarClassName(user.avatarKey)} ${className}`
  return (
    <span className={avatarClassName.trim()} aria-hidden="true">
      <span />
    </span>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function getAvatarClassName(avatarKey: string | undefined) {
  const value =
    avatarKey && /^[a-z]+-[0-5]$/.test(avatarKey) ? avatarKey : 'moss-0'
  return `avatar-${value}`
}

type PageItem = number | 'ellipsis'

function storyMatchesSearch(story: Story, query: string) {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return true
  }

  const searchableText = normalizeSearchText(
    [
      story.id,
      story.title,
      story.surface,
      story.summary,
      story.difficulty,
      difficultyText[story.difficulty],
      story.tags.join(' '),
      story.source.platform,
      story.source.authorName,
      story.source.note,
    ]
      .filter(Boolean)
      .join(' '),
  )
  const tokens = normalizedQuery.split(' ').filter(Boolean)

  return tokens.every(
    (token) =>
      searchableText.includes(token) || isSubsequence(token, searchableText),
  )
}

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function isSubsequence(needle: string, haystack: string) {
  let needleIndex = 0

  for (const character of haystack) {
    if (character === needle[needleIndex]) {
      needleIndex += 1
      if (needleIndex === needle.length) {
        return true
      }
    }
  }

  return needle.length === 0
}

function mergeHintIndexes(
  currentIndexes: number[],
  nextIndexes: number[],
  hintCount = 3,
) {
  return Array.from(
    new Set(
      [...currentIndexes, ...nextIndexes].filter(
        (index) => Number.isInteger(index) && index >= 0 && index < hintCount,
      ),
    ),
  ).sort((left, right) => left - right)
}

function getUnlockProgressPercent(
  revealedCount: number,
  hintCount: number,
  showTruth: boolean,
) {
  if (showTruth) {
    return 100
  }

  if (hintCount <= 0) {
    return 0
  }

  return Math.min(99, revealedCount * 33)
}

function getVisiblePageItems(
  currentPage: number,
  pageCount: number,
): PageItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  const pages = Array.from(
    new Set([1, currentPage - 1, currentPage, currentPage + 1, pageCount]),
  )
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((a, b) => a - b)
  const items: PageItem[] = []
  let previousPage = 0

  for (const page of pages) {
    if (previousPage && page - previousPage > 1) {
      items.push('ellipsis')
    }

    items.push(page)
    previousPage = page
  }

  return items
}

function getUnrevealedStories(
  completedStoryIds: Set<string>,
  excludedStoryId?: string,
) {
  return stories.filter(
    (candidate) =>
      candidate.id !== excludedStoryId && !completedStoryIds.has(candidate.id),
  )
}

function openRandomUnrevealedStory(
  completedStoryIds: Set<string>,
  excludedStoryId?: string,
) {
  const unrevealedStories = getUnrevealedStories(
    completedStoryIds,
    excludedStoryId,
  )
  const fallbackStories = excludedStoryId
    ? stories.filter((candidate) => candidate.id !== excludedStoryId)
    : stories
  const candidateStories =
    unrevealedStories.length > 0 ? unrevealedStories : fallbackStories
  if (candidateStories.length === 0) {
    return
  }

  const randomStory =
    candidateStories[Math.floor(Math.random() * candidateStories.length)]

  window.location.href = getStoryPath(randomStory.id)
}

function StoryCard({
  animationIndex = 0,
  completed,
  story,
}: {
  animationIndex?: number
  completed: boolean
  story: Story
}) {
  return (
    <a
      className={completed ? 'story-card completed' : 'story-card'}
      href={getStoryPath(story.id)}
      style={{ '--card-index': animationIndex } as CSSProperties}
    >
      <div className="card-header">
        <div className="card-badges">
          <span className={`difficulty ${story.difficulty}`}>
            {difficultyText[story.difficulty]}
          </span>
          <span className="source-mini">{story.source.platform}</span>
        </div>
        {completed ? (
          <span className="completed-mark">
            <CheckCircle2 size={15} />
            已揭晓
          </span>
        ) : null}
      </div>
      <h2>{story.title}</h2>
      <p>{story.summary ?? story.surface}</p>
      <div className="tag-row">
        {story.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <div className="source-line">
        <span>{story.source.authorName}</span>
      </div>
    </a>
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
  const [showRevealModeToast, setShowRevealModeToast] = useState(false)
  const [revealModeToastKey, setRevealModeToastKey] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(loadSoundPreference)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showScrollLatestButton, setShowScrollLatestButton] = useState(false)
  const [isReturningToLatest, setIsReturningToLatest] = useState(false)
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
    setIsHintTrayOpen(true)
  }, [hintItems, revealedHintIndexes, showTruth])

  useEffect(() => {
    saveGuideMessagePreference(showGuideMessage)
  }, [showGuideMessage])

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
      const nextRevealedHintIndexes = mergeHintIndexes(
        revealedHintIndexes,
        answer.matchedHintIndexes ?? [],
        hintItems.length,
      )
      const didUnlockHint =
        nextRevealedHintIndexes.length > revealedHintIndexes.length

      if (didUnlockHint) {
        setRevealedHintIndexes(nextRevealedHintIndexes)
        setIsHintTrayOpen(true)
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
    if (unlockedCount === 0 || hasSeenHintUnlockGuide) {
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

function SourcePanel({ source }: { source: Story['source'] }) {
  return (
    <section className="source-panel">
      <div>
        <h2>来源</h2>
        <p>
          {source.platform || '来源未知'} · {source.authorName || '发布人未知'}
        </p>
        <p className="source-meta">
          {source.license ? `授权：${source.license}` : '授权：未知'}
          {source.collectedAt ? ` · 收录：${source.collectedAt}` : ''}
        </p>
        {source.note ? <p className="source-note">{source.note}</p> : null}
      </div>
      <div className="source-actions">
        {source.authorUrl ? (
          <a href={source.authorUrl} rel="noreferrer" target="_blank">
            作者主页
            <ExternalLink size={15} />
          </a>
        ) : null}
        {source.originalUrl ? (
          <a href={source.originalUrl} rel="noreferrer" target="_blank">
            原始来源
            <ExternalLink size={15} />
          </a>
        ) : null}
      </div>
    </section>
  )
}

function PageSizePicker({
  pageSize,
  onPageSizeChange,
}: {
  pageSize: (typeof pageSizeOptions)[number]
  onPageSizeChange: (pageSize: (typeof pageSizeOptions)[number]) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="page-size-picker" ref={pickerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="page-size-select"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>每页展示</span>
        <strong>{pageSize} 道题</strong>
        <ChevronDown
          className={isOpen ? 'select-chevron open' : 'select-chevron'}
          size={17}
        />
      </button>
      {isOpen ? (
        <div className="page-size-menu" role="listbox">
          {pageSizeOptions.map((option) => (
            <button
              aria-selected={option === pageSize}
              className={
                option === pageSize
                  ? 'page-size-option active'
                  : 'page-size-option'
              }
              key={option}
              role="option"
              type="button"
              onClick={() => {
                onPageSizeChange(option)
                setIsOpen(false)
              }}
            >
              <span>{option} 道题</span>
              {option === pageSize ? <CheckCircle2 size={15} /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ModelPicker({
  selectedModel,
  onSelectedModelChange,
}: {
  selectedModel: AiModelId
  onSelectedModelChange: (model: AiModelId) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const selectedOption =
    modelOptions.find((option) => option.id === selectedModel) ??
    modelOptions[0]

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="model-picker" ref={pickerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="model-select"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>模型</span>
        <strong>{selectedOption.label}</strong>
        <ChevronDown
          className={isOpen ? 'select-chevron open' : 'select-chevron'}
          size={18}
        />
      </button>
      {isOpen ? (
        <div className="model-menu" role="listbox">
          {modelOptions.map((option) => (
            <button
              aria-selected={option.id === selectedModel}
              className={
                option.id === selectedModel
                  ? 'model-option active'
                  : 'model-option'
              }
              key={option.id}
              role="option"
              type="button"
              onClick={() => {
                onSelectedModelChange(option.id)
                setIsOpen(false)
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ChatBubble({
  entry,
  entryIndex = 0,
}: {
  entry: ChatEntry
  entryIndex?: number
}) {
  return (
    <article
      className="chat-entry"
      style={{ '--entry-index': entryIndex } as CSSProperties}
    >
      <div className="question-bubble">
        <span>你问</span>
        <p>{entry.question}</p>
      </div>
      <div className={`answer-bubble ${entry.answer.label}`}>
        <span>回答</span>
        <strong>{entry.answer.answer}</strong>
        {entry.answer.hint ? <p>{entry.answer.hint}</p> : null}
      </div>
    </article>
  )
}

function HintShelf({
  hints,
  isCompactOpen,
  isDisabled,
  limit,
  revealedIndexes,
  used,
  onRevealHint,
  onToggleCompact,
}: {
  hints: readonly string[]
  isCompactOpen: boolean
  isDisabled: boolean
  limit: number
  revealedIndexes: number[]
  used: number
  onRevealHint: (hintIndex: number) => void
  onToggleCompact: () => void
}) {
  const revealedCount = revealedIndexes.length

  return (
    <div className="hint-shelf" aria-label="提示栏">
      <div className="hint-meter">
        <span>
          <CircleHelp size={15} />
          提问额度
        </span>
        <strong>
          {used}/{limit}
        </strong>
      </div>
      <button
        aria-expanded={isCompactOpen}
        className="hint-tray-toggle"
        disabled={isDisabled}
        type="button"
        onClick={onToggleCompact}
      >
        <Lightbulb size={15} />
        <span>提示</span>
        <strong>{revealedCount}/3</strong>
      </button>
      <div className="hint-strip">
        {hints.map((hint, index) => {
          const isRevealed = revealedIndexes.includes(index)
          const hintText = hint.replace(/[。．.]/g, '')

          return (
            <button
              aria-expanded={isRevealed}
              className={isRevealed ? 'hint-chip revealed' : 'hint-chip'}
              disabled={isDisabled}
              key={`${hint}-${index}`}
              type="button"
              onClick={() => onRevealHint(index)}
            >
              <span>
                <Lightbulb size={15} />
                提示 {index + 1}
              </span>
              {isRevealed ? <strong>{hintText}</strong> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function UnlockProgressBar({ percent }: { percent: number }) {
  return (
    <div
      aria-label={`提示解锁进度 ${percent}%`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={percent}
      className="unlock-progress"
      role="progressbar"
    >
      <span
        aria-hidden="true"
        className="unlock-progress-track"
        style={{ '--unlock-progress': percent + '%' } as CSSProperties}
      />
    </div>
  )
}

function TruthRevealDialog({
  mode,
  story,
  hintCost,
  questionLimit,
  onClose,
  onContinue,
  onConfirm,
  onConfirmHint,
  onRevealAfterLimit,
}: {
  mode: TruthDialogMode
  story: Story
  hintCost: number
  questionLimit: number
  onClose: () => void
  onContinue: () => void
  onConfirm: () => void
  onConfirmHint: () => void
  onRevealAfterLimit: () => void
}) {
  const isRevealed = mode === 'revealed' || mode === 'limitRevealed'
  const isLimit = mode === 'limit'
  const isHintConfirm = mode === 'hintConfirm'
  const shouldShowConfetti = mode === 'revealed'
  const title = isRevealed
    ? story.title
    : isLimit
      ? '提问次数已用完'
      : isHintConfirm
        ? '打开这条提示？'
        : '确定要查看汤底吗？'
  const body = isRevealed
    ? story.truth
    : isLimit
      ? `本题的 ${questionLimit} 次提问额度已经用完。你可以继续提问自由探索，也可以直接进入结局查看汤底。`
      : isHintConfirm
        ? `打开后会消耗 ${hintCost} 次提问机会。`
        : '这会直接揭开完整真相，并把当前题目标记为已揭晓。'

  return (
    <div
      className="truth-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (!isLimit && event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      {shouldShowConfetti ? <CanvasConfetti /> : null}
      <div
        aria-describedby="truth-dialog-body"
        aria-labelledby="truth-dialog-title"
        aria-modal="true"
        className={
          isRevealed ? 'truth-dialog revealed' : 'truth-dialog confirm'
        }
        role="dialog"
      >
        {!isLimit ? (
          <button
            aria-label={isRevealed ? '关闭汤底' : '取消查看汤底'}
            className="truth-dialog-close"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        ) : null}
        <div className="truth-dialog-icon" aria-hidden="true">
          {isLimit || isHintConfirm ? (
            <CircleHelp size={28} />
          ) : (
            <PartyPopper size={28} />
          )}
        </div>
        <p className="truth-dialog-kicker">
          {isRevealed
            ? '汤底揭晓'
            : isLimit
              ? '额度提醒'
              : isHintConfirm
                ? '提示确认'
                : '剧透确认'}
        </p>
        <h2 id="truth-dialog-title">{title}</h2>
        <p className="truth-dialog-body" id="truth-dialog-body">
          {body}
        </p>
        <div className="truth-dialog-actions">
          {isLimit ? (
            <button
              className="truth-dialog-action secondary"
              type="button"
              onClick={onRevealAfterLimit}
            >
              进入结局
            </button>
          ) : null}
          {!isRevealed && !isLimit ? (
            <button
              className="truth-dialog-action secondary"
              type="button"
              onClick={onClose}
            >
              {isHintConfirm ? '取消' : '先不看'}
            </button>
          ) : null}
          <button
            className="truth-dialog-action"
            type="button"
            onClick={
              isRevealed
                ? onClose
                : isLimit
                  ? onContinue
                  : isHintConfirm
                    ? onConfirmHint
                    : onConfirm
            }
          >
            {isRevealed
              ? '收下真相'
              : isLimit
                ? '继续提问'
                : isHintConfirm
                  ? '继续打开提示'
                  : '查看汤底'}
          </button>
        </div>
      </div>
    </div>
  )
}

type ConfettiPiece = {
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  color: string
  rotation: number
  spin: number
  gravity: number
  drag: number
  life: number
  ttl: number
  shape: 'circle' | 'rect'
}

function CanvasConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const confettiCanvas = canvas
    const confettiContext = context

    let frameId = 0
    let lastTime = performance.now()
    let isRunning = true
    const colors = ['#c9851e', '#9d382c', '#2f6f62', '#5aa7a6', '#f1c84c']
    const pieces: ConfettiPiece[] = []
    const timers: number[] = []

    function resizeCanvas() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      confettiCanvas.width = Math.floor(window.innerWidth * ratio)
      confettiCanvas.height = Math.floor(window.innerHeight * ratio)
      confettiCanvas.style.width = window.innerWidth + 'px'
      confettiCanvas.style.height = window.innerHeight + 'px'
      confettiContext.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    function addBurst(originX: number, originY: number, count: number) {
      for (let index = 0; index < count; index += 1) {
        const angle = -Math.PI + Math.random() * Math.PI
        const speed = 8 + Math.random() * 13
        const size = 7 + Math.random() * 10

        pieces.push({
          x: originX + (Math.random() - 0.5) * 26,
          y: originY + (Math.random() - 0.5) * 18,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3.5,
          width: size * (0.7 + Math.random() * 0.7),
          height: size * (1.4 + Math.random() * 1.4),
          color: colors[index % colors.length],
          rotation: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.42,
          gravity: 0.26 + Math.random() * 0.11,
          drag: 0.986 + Math.random() * 0.007,
          life: 0,
          ttl: 165 + Math.random() * 72,
          shape: Math.random() > 0.78 ? 'circle' : 'rect',
        })
      }
    }

    function drawPiece(piece: ConfettiPiece) {
      const opacity = Math.max(0, 1 - piece.life / piece.ttl)
      confettiContext.save()
      confettiContext.globalAlpha = opacity
      confettiContext.translate(piece.x, piece.y)
      confettiContext.rotate(piece.rotation)
      confettiContext.fillStyle = piece.color

      if (piece.shape === 'circle') {
        confettiContext.beginPath()
        confettiContext.ellipse(
          0,
          0,
          piece.width * 0.55,
          piece.width * 0.55,
          0,
          0,
          Math.PI * 2,
        )
        confettiContext.fill()
      } else {
        confettiContext.fillRect(
          -piece.width / 2,
          -piece.height / 2,
          piece.width,
          piece.height,
        )
      }

      confettiContext.globalAlpha = opacity * 0.32
      confettiContext.strokeStyle = '#fffdf7'
      confettiContext.lineWidth = 1
      if (piece.shape === 'rect') {
        confettiContext.strokeRect(
          -piece.width / 2,
          -piece.height / 2,
          piece.width,
          piece.height,
        )
      }

      confettiContext.restore()
    }

    function animate(now: number) {
      if (!isRunning) {
        return
      }

      const step = Math.min((now - lastTime) / 16.67, 2)
      lastTime = now
      confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (let index = pieces.length - 1; index >= 0; index -= 1) {
        const piece = pieces[index]
        piece.life += step
        piece.vx *= piece.drag
        piece.vy = piece.vy * piece.drag + piece.gravity * step
        piece.x += piece.vx * step
        piece.y += piece.vy * step
        piece.rotation += piece.spin * step
        drawPiece(piece)

        if (
          piece.life >= piece.ttl ||
          piece.y > window.innerHeight + 80 ||
          piece.x < -80 ||
          piece.x > window.innerWidth + 80
        ) {
          pieces.splice(index, 1)
        }
      }

      if (pieces.length > 0) {
        frameId = window.requestAnimationFrame(animate)
      }
    }

    resizeCanvas()
    addBurst(window.innerWidth * 0.5, window.innerHeight * 0.22, 150)
    addBurst(window.innerWidth * 0.3, window.innerHeight * 0.28, 44)
    addBurst(window.innerWidth * 0.7, window.innerHeight * 0.28, 44)
    timers.push(
      window.setTimeout(() => {
        addBurst(window.innerWidth * 0.42, window.innerHeight * 0.2, 76)
        frameId = window.requestAnimationFrame(animate)
      }, 220),
      window.setTimeout(() => {
        addBurst(window.innerWidth * 0.58, window.innerHeight * 0.22, 76)
        frameId = window.requestAnimationFrame(animate)
      }, 520),
    )
    frameId = window.requestAnimationFrame(animate)
    window.addEventListener('resize', resizeCanvas)

    return () => {
      isRunning = false
      window.cancelAnimationFrame(frameId)
      timers.forEach((timer) => window.clearTimeout(timer))
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas aria-hidden="true" className="confetti-canvas" ref={canvasRef} />
  )
}

function getStoryProgressStorageKey(storyId: string) {
  return `${STORY_PROGRESS_STORAGE_PREFIX}${storyId}`
}

function normalizeStoryProgress(progress?: Partial<StoryProgressData>): {
  chargedHintIndexes: number[]
  entries: ChatEntry[]
  hasAcceptedLimitOverrun: boolean
  hasSeenHintUnlockGuide: boolean
  revealedHintIndexes: number[]
  showTruth: boolean
} {
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

function loadCachedAuthUser(): AuthUser | null {
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

function saveCachedAuthUser(user: AuthUser | null) {
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

function loadSelectedModel(): AiModelId {
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

function saveSelectedModel(model: AiModelId) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(MODEL_STORAGE_KEY, model)
  } catch {
    // The in-memory selection still applies for this session.
  }
}

function loadGuideMessagePreference() {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    return window.localStorage.getItem(GUIDE_MESSAGE_STORAGE_KEY) !== 'hidden'
  } catch {
    return true
  }
}

function saveGuideMessagePreference(isVisible: boolean) {
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

function loadHintPreference() {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    return window.localStorage.getItem(HINT_ENABLED_STORAGE_KEY) !== 'disabled'
  } catch {
    return true
  }
}

function saveHintPreference(isEnabled: boolean) {
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

function loadSoundPreference() {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    return window.localStorage.getItem(SOUND_ENABLED_STORAGE_KEY) !== 'muted'
  } catch {
    return true
  }
}

function saveSoundPreference(isEnabled: boolean) {
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

type UiSound = 'send' | 'reply' | 'celebrate'
type AudioWindow = Window &
  typeof globalThis & {
    turtleSoupAudioContext?: AudioContext
    webkitAudioContext?: typeof AudioContext
  }

function playUiSound(sound: UiSound, isEnabled: boolean) {
  if (!isEnabled || typeof window === 'undefined') {
    return
  }

  const audioWindow = window as AudioWindow
  const AudioContextCtor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext

  if (!AudioContextCtor) {
    return
  }

  try {
    const context = getUiAudioContext(AudioContextCtor)
    const now = context.currentTime

    if (sound === 'send') {
      playTone(context, {
        frequency: 560,
        startTime: now,
        duration: 0.09,
        gain: 0.048,
        type: 'triangle',
      })
      playTone(context, {
        frequency: 840,
        startTime: now + 0.045,
        duration: 0.11,
        gain: 0.036,
        type: 'sine',
      })
      return
    }

    if (sound === 'reply') {
      playTone(context, {
        frequency: 740,
        startTime: now,
        duration: 0.12,
        gain: 0.039,
        type: 'sine',
      })
      playTone(context, {
        frequency: 990,
        startTime: now + 0.075,
        duration: 0.16,
        gain: 0.03,
        type: 'triangle',
      })
      return
    }

    playTone(context, {
      frequency: 740,
      startTime: now,
      duration: 0.14,
      gain: 0.051,
      type: 'sine',
    })
    playTone(context, {
      frequency: 980,
      startTime: now + 0.09,
      duration: 0.17,
      gain: 0.045,
      type: 'triangle',
    })
    playTone(context, {
      frequency: 1318,
      startTime: now + 0.19,
      duration: 0.22,
      gain: 0.039,
      type: 'triangle',
    })
  } catch {
    // Audio feedback is decorative; never block the game flow.
  }
}

function getUiAudioContext(
  AudioContextCtor: typeof AudioContext,
): AudioContext {
  const audioWindow = window as AudioWindow

  if (!audioWindow.turtleSoupAudioContext) {
    audioWindow.turtleSoupAudioContext = new AudioContextCtor()
  }

  const context = audioWindow.turtleSoupAudioContext

  if (context.state === 'suspended') {
    void context.resume()
  }

  return context
}

function playTone(
  context: AudioContext,
  {
    duration,
    frequency,
    gain,
    startTime,
    type,
  }: {
    duration: number
    frequency: number
    gain: number
    startTime: number
    type: OscillatorType
  },
) {
  const oscillator = context.createOscillator()
  const envelope = context.createGain()
  const filter = context.createBiquadFilter()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  oscillator.frequency.exponentialRampToValueAtTime(
    frequency * 1.08,
    startTime + duration,
  )
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2400, startTime)
  envelope.gain.setValueAtTime(0.0001, startTime)
  envelope.gain.exponentialRampToValueAtTime(gain, startTime + 0.015)
  envelope.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(filter)
  filter.connect(envelope)
  envelope.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.03)
}

function isAiModelId(value: string | null): value is AiModelId {
  return modelOptions.some((option) => option.id === value)
}

function loadStoryProgress(storyId: string): {
  chargedHintIndexes: number[]
  entries: ChatEntry[]
  hasAcceptedLimitOverrun: boolean
  hasSeenHintUnlockGuide: boolean
  revealedHintIndexes: number[]
  showTruth: boolean
} {
  if (typeof window === 'undefined') {
    return {
      chargedHintIndexes: [],
      entries: [],
      hasAcceptedLimitOverrun: false,
      hasSeenHintUnlockGuide: false,
      revealedHintIndexes: [],
      showTruth: false,
    }
  }

  try {
    const raw = window.localStorage.getItem(getStoryProgressStorageKey(storyId))
    if (!raw) {
      return {
        chargedHintIndexes: [],
        entries: [],
        hasAcceptedLimitOverrun: false,
        hasSeenHintUnlockGuide: false,
        revealedHintIndexes: [],
        showTruth: false,
      }
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
    return {
      chargedHintIndexes: [],
      entries: [],
      hasAcceptedLimitOverrun: false,
      hasSeenHintUnlockGuide: false,
      revealedHintIndexes: [],
      showTruth: false,
    }
  }
}

function isStoryCompleted(storyId: string) {
  return loadStoryProgress(storyId).showTruth
}

function saveStoryProgress(
  storyId: string,
  progress: {
    chargedHintIndexes: number[]
    entries: ChatEntry[]
    hasAcceptedLimitOverrun: boolean
    hasSeenHintUnlockGuide: boolean
    revealedHintIndexes: number[]
    showTruth: boolean
  },
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

function clearStoryProgress(storyId: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(getStoryProgressStorageKey(storyId))
  } catch {
    // Ignore storage failures; the in-memory reset still works.
  }
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

function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>
        本站代码以{' '}
        <a
          href="https://github.com/phhandong/turtle-soup-ai/blob/main/LICENSE"
          rel="noreferrer"
          target="_blank"
        >
          GNU GPL v3
        </a>
        <a
          href="https://github.com/phhandong/turtle-soup-ai"
          rel="noreferrer"
          target="_blank"
        >
          源码仓库
        </a>
        <a href="https://beian.miit.gov.cn/" rel="noreferrer" target="_blank">
          浙ICP备2024119220号
        </a>
      </p>
      <p className="footer-note">
        汤题内容改写自各来源站点，版权归原站点所有；开源协议仅适用于本站代码。
      </p>
      <div className="footer-sponsors" aria-label="本站赞助者">
        <span>感谢赞助</span>
        <a
          className="footer-sponsor"
          href="https://github.com/MengAnXiang"
          rel="noreferrer"
          target="_blank"
        >
          <img
            src="https://github.com/MengAnXiang.png?size=96"
            alt="MengAnXiang 的 GitHub 头像"
          />
          <span>MengAnXiang</span>
        </a>
        <a
          className="footer-sponsor"
          href="https://github.com/Wan-LR"
          rel="noreferrer"
          target="_blank"
        >
          <img
            src="https://github.com/Wan-LR.png?size=96"
            alt="Wan-LR 的 GitHub 头像"
          />
          <span>Wan-LR</span>
        </a>
      </div>
    </footer>
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
