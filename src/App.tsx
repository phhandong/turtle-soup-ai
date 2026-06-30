import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Eye,
  Lightbulb,
  PartyPopper,
  X,
  Home,
  Link2,
  RefreshCw,
  Send,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Shuffle,
} from 'lucide-react'
import { stories, getStoryById } from './data/stories'
import { askAi } from './services/aiClient'
import type { AiModelId, ChatEntry, Difficulty, Story } from './types/story'
import { getCurrentStoryId, getStoryPath } from './utils/routes'

const STORY_PROGRESS_STORAGE_PREFIX = 'turtle-soup-history:'
const MODEL_STORAGE_KEY = 'turtle-soup-model'
const GUIDE_MESSAGE_STORAGE_KEY = 'turtle-soup-guide-message'
const DEFAULT_AI_MODEL: AiModelId = 'agnes-2.0-flash'

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
  const [selectedModel, setSelectedModel] = useState<AiModelId>(() =>
    loadSelectedModel(),
  )

  useEffect(() => {
    saveSelectedModel(selectedModel)
  }, [selectedModel])

  useEffect(() => {
    const handleHashChange = () => setStoryId(getCurrentStoryId())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [storyId])

  const story = storyId ? getStoryById(storyId) : undefined

  if (storyId && !story) {
    return <MissingStory />
  }

  return story ? (
    <StoryPage
      key={story.id}
      onSelectedModelChange={setSelectedModel}
      selectedModel={selectedModel}
      story={story}
    />
  ) : (
    <HomePage />
  )
}

function HomePage() {
  const [activeTag, setActiveTag] = useState('全部')
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty | '全部'>(
    '全部',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [showUncompleted, setShowUncompleted] = useState(false)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
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
        stories
          .filter((story) => isStoryCompleted(story.id))
          .map((story) => story.id),
      ),
    [],
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

  function openRandomStory() {
    const availableStories = stories.filter(
      (story) => !completedStoryIds.has(story.id),
    )
    const candidateStories =
      availableStories.length > 0 ? availableStories : stories
    const randomStory =
      candidateStories[Math.floor(Math.random() * candidateStories.length)]

    window.location.href = getStoryPath(randomStory.id)
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
        <button className="api-pill" type="button" onClick={openRandomStory}>
          <Shuffle size={18} />
          随机做一题
        </button>
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
                className={
                  activeDifficulty === '全部' ? 'chip active' : 'chip'
                }
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
          {paginatedStories.map((story) => (
            <StoryCard
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

function StoryCard({ completed, story }: { completed: boolean; story: Story }) {
  return (
    <a
      className={completed ? 'story-card completed' : 'story-card'}
      href={getStoryPath(story.id)}
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
}: {
  story: Story
  selectedModel: AiModelId
  onSelectedModelChange: (model: AiModelId) => void
}) {
  const [question, setQuestion] = useState('')
  const [entries, setEntries] = useState<ChatEntry[]>(
    () => loadStoryProgress(story.id).entries,
  )
  const [hintEnabled, setHintEnabled] = useState(false)
  const [revealedHintIndexes, setRevealedHintIndexes] = useState<number[]>(
    () => loadStoryProgress(story.id).revealedHintIndexes,
  )
  const [hasAcceptedLimitOverrun, setHasAcceptedLimitOverrun] = useState(
    () => loadStoryProgress(story.id).hasAcceptedLimitOverrun,
  )
  const [revealMode, setRevealMode] = useState(false)
  const [showTruth, setShowTruth] = useState(
    () => loadStoryProgress(story.id).showTruth,
  )
  const [truthDialogMode, setTruthDialogMode] =
    useState<TruthDialogMode | null>(null)
  const [pendingHintIndex, setPendingHintIndex] = useState<number | null>(null)
  const [isHintTrayOpen, setIsHintTrayOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showGuideMessage, setShowGuideMessage] = useState(
    loadGuideMessagePreference,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const questionInputRef = useRef<HTMLTextAreaElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const hintSettings = story.hints ?? defaultHintSettings[story.difficulty]
  const hintItems = story.hints?.items ?? []
  const usedQuestionBudget =
    entries.length + revealedHintIndexes.length * hintSettings.hintCost
  const isQuestionBudgetExhausted =
    usedQuestionBudget >= hintSettings.questionLimit ||
    (hintItems.length > 0 && revealedHintIndexes.length >= hintItems.length)

  useEffect(() => {
    saveStoryProgress(story.id, {
      entries,
      hasAcceptedLimitOverrun,
      revealedHintIndexes,
      showTruth,
    })
  }, [
    entries,
    hasAcceptedLimitOverrun,
    revealedHintIndexes,
    showTruth,
    story.id,
  ])

  useEffect(() => {
    resizeQuestionInput()
  }, [question])

  useEffect(() => {
    saveGuideMessagePreference(showGuideMessage)
  }, [showGuideMessage])

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

  function requestRevealHint(hintIndex: number) {
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

    const nextRevealedHintIndexes = [
      ...revealedHintIndexes,
      pendingHintIndex,
    ].sort(
      (left, right) => left - right,
    )

    setRevealedHintIndexes(nextRevealedHintIndexes)
    setPendingHintIndex(null)

    if (
      !hasAcceptedLimitOverrun &&
      (entries.length + nextRevealedHintIndexes.length * hintSettings.hintCost >=
        hintSettings.questionLimit ||
        nextRevealedHintIndexes.length >= hintItems.length)
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

    try {
      const answer = await askAi({
        storyId: story.id,
        surface: story.surface,
        truth: story.truth,
        question: trimmedQuestion,
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
      if (revealMode && answer.answer === '还原正确') {
        setShowTruth(true)
        setTruthDialogMode('revealed')
      } else if (
        !hasAcceptedLimitOverrun &&
        nextEntries.length +
          revealedHintIndexes.length * hintSettings.hintCost >=
          hintSettings.questionLimit
      ) {
        setTruthDialogMode('limit')
      }
    } catch {
      setError('暂时没有回应，请稍后再试。')
    } finally {
      setIsLoading(false)
    }
  }

  function handleRevealTruth() {
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

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href)
  }

  function openRandomStory() {
    const otherStories = stories.filter((candidate) => candidate.id !== story.id)
    const candidateStories = otherStories.length > 0 ? otherStories : stories
    const randomStory =
      candidateStories[Math.floor(Math.random() * candidateStories.length)]

    window.location.href = getStoryPath(randomStory.id)
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
        <a className="icon-button" href="#">
          <ArrowLeft size={18} />
          返回
        </a>
        <button className="icon-button" type="button" onClick={copyLink}>
          <Link2 size={18} />
          复制链接
        </button>
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
                    onChange={(event) => setHintEnabled(event.target.checked)}
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
              </div>
            ) : null}
          </div>
        </div>

        <div className="chat-list" aria-live="polite">
          {showGuideMessage ? (
            <article className="guide-message">
              <div>
                <span>玩法说明</span>
                <div className="guide-message-copy">
                  <p>
                    右上角设置可切换
                    模型和游玩模式
                  </p>
                  <p>
                    <strong>提示模式：</strong>回答会附带
                    方向提示
                  </p>
                  <p>
                    <strong>揭晓模式：</strong>用于提交
                    完整真相
                  </p>
                  <p>
                    <strong>提示：</strong>可查看提示，消耗提问次数
                  </p>
                </div>
              </div>
              <button
                aria-label="关闭玩法说明"
                type="button"
                onClick={() => setShowGuideMessage(false)}
              >
                <X size={16} />
              </button>
            </article>
          ) : null}
          {entries.length === 0 ? (
            <div className="empty-chat">
              <Sparkles size={22} />
              <p>先问一个能用“是 / 不是 / 是也不是 / 无关”回答的问题。</p>
            </div>
          ) : (
            entries.map((entry) => <ChatBubble entry={entry} key={entry.id} />)
          )}
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
          <textarea
            aria-label="输入你的问题"
            disabled={isLoading}
            maxLength={160}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleQuestionKeyDown}
            placeholder={
              revealMode
                ? '输入你还原出的完整真相'
                : '例如：这个男人认识死者吗？'
            }
            ref={questionInputRef}
            rows={1}
            value={question}
          />
          <button disabled={isLoading} type="submit">
            {isLoading ? (
              <RefreshCw className="spin" size={18} />
            ) : (
              <Send size={18} />
            )}
            发送
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
            clearStoryProgress(story.id)
            setEntries([])
            setShowTruth(false)
            setRevealedHintIndexes([])
            setHasAcceptedLimitOverrun(false)
            setTruthDialogMode(null)
            setPendingHintIndex(null)
            setIsHintTrayOpen(false)
            setHintEnabled(false)
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

function ChatBubble({ entry }: { entry: ChatEntry }) {
  return (
    <article className="chat-entry">
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
        <span>提问额度</span>
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
              {isRevealed ? <strong>{hint}</strong> : null}
            </button>
          )
        })}
      </div>
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
      {shouldShowConfetti ? (
        <CanvasConfetti />
      ) : null}
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

  return <canvas aria-hidden="true" className="confetti-canvas" ref={canvasRef} />
}

function getStoryProgressStorageKey(storyId: string) {
  return `${STORY_PROGRESS_STORAGE_PREFIX}${storyId}`
}

function loadSelectedModel(): AiModelId {
  if (typeof window === 'undefined') {
    return DEFAULT_AI_MODEL
  }

  try {
    const raw = window.localStorage.getItem(MODEL_STORAGE_KEY)
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

function isAiModelId(value: string | null): value is AiModelId {
  return modelOptions.some((option) => option.id === value)
}

function loadStoryProgress(storyId: string): {
  entries: ChatEntry[]
  hasAcceptedLimitOverrun: boolean
  revealedHintIndexes: number[]
  showTruth: boolean
} {
  if (typeof window === 'undefined') {
    return {
      entries: [],
      hasAcceptedLimitOverrun: false,
      revealedHintIndexes: [],
      showTruth: false,
    }
  }

  try {
    const raw = window.localStorage.getItem(getStoryProgressStorageKey(storyId))
    if (!raw) {
      return {
        entries: [],
        hasAcceptedLimitOverrun: false,
        revealedHintIndexes: [],
        showTruth: false,
      }
    }

    const parsed = JSON.parse(raw) as Partial<{
      entries: unknown
      hasAcceptedLimitOverrun: unknown
      revealedHintIndexes: unknown
      showTruth: unknown
    }>
    return {
      entries: Array.isArray(parsed.entries)
        ? parsed.entries.filter(isChatEntry)
        : [],
      hasAcceptedLimitOverrun: parsed.hasAcceptedLimitOverrun === true,
      revealedHintIndexes: Array.isArray(parsed.revealedHintIndexes)
        ? parsed.revealedHintIndexes.filter(isHintIndex)
        : [],
      showTruth: parsed.showTruth === true,
    }
  } catch {
    return {
      entries: [],
      hasAcceptedLimitOverrun: false,
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
    entries: ChatEntry[]
    hasAcceptedLimitOverrun: boolean
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
        version: 2,
        entries: progress.entries,
        hasAcceptedLimitOverrun: progress.hasAcceptedLimitOverrun,
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
        <a
          href="https://beian.miit.gov.cn/"
          rel="noreferrer"
          target="_blank"
        >
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
