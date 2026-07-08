import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  Lightbulb,
  RefreshCw,
  X,
} from 'lucide-react'
import { modelOptions } from '../config/appOptions'
import type { AiModelId, ChatEntry, Story } from '../types/story'

export function SourcePanel({ source }: { source: Story['source'] }) {
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

export function ModelPicker({
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

export function ChatBubble({
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

export function HintShelf({
  hints,
  isCompactOpen,
  isDisabled,
  limit,
  promptActions,
  revealedIndexes,
  used,
  onRevealHint,
  onToggleCompact,
}: {
  hints: readonly string[]
  isCompactOpen: boolean
  isDisabled: boolean
  limit: number
  promptActions?: ReactNode
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
      {promptActions ? (
        <div className="hint-prompt-actions">{promptActions}</div>
      ) : null}
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

export function QuestionPromptStrip({
  isDisabled,
  prompts,
  onClose,
  onInsertPrompt,
  onRefresh,
}: {
  isDisabled: boolean
  prompts: readonly string[]
  onClose: () => void
  onInsertPrompt: (prompt: string) => void
  onRefresh: () => void
}) {
  const stripRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visiblePromptCount, setVisiblePromptCount] = useState(prompts.length)
  const visiblePrompts = prompts.slice(0, visiblePromptCount)

  const updateVisiblePromptCount = useCallback(() => {
    const strip = stripRef.current
    const measure = measureRef.current

    if (!strip || !measure) {
      setVisiblePromptCount(prompts.length)
      return
    }

    const measureButtons = Array.from(
      measure.querySelectorAll<HTMLButtonElement>('.question-prompt-chip'),
    )
    const measureActions = measure.querySelector<HTMLDivElement>(
      '.question-prompt-actions',
    )

    if (measureButtons.length === 0 || !measureActions) {
      setVisiblePromptCount(prompts.length)
      return
    }

    const style = window.getComputedStyle(strip)
    const gap = Number.parseFloat(style.columnGap || style.gap) || 0
    const inlinePadding =
      Number.parseFloat(style.paddingLeft) +
      Number.parseFloat(style.paddingRight)
    const availableWidth =
      strip.clientWidth - inlinePadding - measureActions.offsetWidth
    let usedWidth = 0
    let nextVisibleCount = 0

    for (const button of measureButtons) {
      const nextWidth =
        usedWidth + (nextVisibleCount > 0 ? gap : 0) + button.offsetWidth
      const actionGap = nextVisibleCount >= 0 ? gap : 0

      if (nextWidth + actionGap > availableWidth) {
        break
      }

      usedWidth = nextWidth
      nextVisibleCount += 1
    }

    setVisiblePromptCount(Math.max(0, nextVisibleCount))
  }, [prompts])

  useLayoutEffect(() => {
    updateVisiblePromptCount()
  }, [prompts, updateVisiblePromptCount])

  useEffect(() => {
    const strip = stripRef.current

    if (!strip) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      updateVisiblePromptCount()
    })

    resizeObserver.observe(strip)
    return () => resizeObserver.disconnect()
  }, [updateVisiblePromptCount])

  return (
    <div
      className="question-prompt-strip"
      aria-label="可选提问词"
      ref={stripRef}
    >
      {visiblePrompts.map((prompt) => (
        <button
          className="question-prompt-chip"
          disabled={isDisabled}
          key={prompt}
          type="button"
          onClick={() => onInsertPrompt(prompt)}
        >
          {prompt}
        </button>
      ))}
      <div className="question-prompt-actions">
        <button
          aria-label="切换提问词"
          className="question-prompt-refresh"
          disabled={isDisabled}
          title="切换提问词"
          type="button"
          onClick={onRefresh}
        >
          <RefreshCw size={15} />
        </button>
        <button
          aria-label="关闭提问词"
          className="question-prompt-close"
          title="关闭提问词"
          type="button"
          onClick={onClose}
        >
          <X size={15} />
        </button>
      </div>
      <div className="question-prompt-measure" aria-hidden="true" ref={measureRef}>
        {prompts.map((prompt) => (
          <button className="question-prompt-chip" key={prompt} type="button">
            {prompt}
          </button>
        ))}
        <div className="question-prompt-actions">
          <button className="question-prompt-refresh" type="button">
            <RefreshCw size={15} />
          </button>
          <button className="question-prompt-close" type="button">
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function UnlockProgressBar({ percent }: { percent: number }) {
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
