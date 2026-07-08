import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  SlidersHorizontal,
  Shuffle,
  X,
} from 'lucide-react'
import { AccountMenu, AuthEntryButton } from './auth'
import { SiteFooter } from './layout'
import { stories, getStoryById } from '../data/stories'
import type { AuthUser, ProgressRecord } from '../services/authClient'
import type { Difficulty, Story } from '../types/story'
import {
  difficultyOptions,
  difficultyText,
  pageSizeOptions,
} from '../config/appOptions'
import { getStoryPath } from '../utils/routes'
import { openRandomUnrevealedStory } from '../utils/storyNavigation'

type ProgressByStoryId = Record<string, ProgressRecord>

export function HomePage({
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
  const [isHistoryPanelDismissed, setIsHistoryPanelDismissed] = useState(false)
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
