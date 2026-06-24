import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Home,
  Link2,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import { stories, getStoryById } from "./data/stories";
import { askAi } from "./services/aiClient";
import type { AiModelId, ChatEntry, Difficulty, Story } from "./types/story";
import { getCurrentStoryId, getStoryPath } from "./utils/routes";

const STORY_PROGRESS_STORAGE_PREFIX = "turtle-soup-history:";
const MODEL_STORAGE_KEY = "turtle-soup-model";
const DEFAULT_AI_MODEL: AiModelId = "mimo-v2.5-pro";

const modelOptions: Array<{ id: AiModelId; label: string }> = [
  { id: "mimo-v2.5-pro", label: "MIMO v2.5 Pro" },
  { id: "agnes-2.0-flash", label: "Agnes 2.0 Flash" },
  { id: "agnes-1.5-flash", label: "Agnes 1.5 Flash" },
];

const difficultyText: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

function App() {
  const [storyId, setStoryId] = useState<string | null>(() => getCurrentStoryId());
  const [selectedModel, setSelectedModel] = useState<AiModelId>(() => loadSelectedModel());

  useEffect(() => {
    saveSelectedModel(selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    const handleHashChange = () => setStoryId(getCurrentStoryId());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const story = storyId ? getStoryById(storyId) : undefined;

  if (storyId && !story) {
    return <MissingStory />;
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
  );
}

function HomePage() {
  const [activeTag, setActiveTag] = useState("全部");
  const tags = useMemo(() => ["全部", ...Array.from(new Set(stories.flatMap((story) => story.tags)))], []);
  const filteredStories = activeTag === "全部" ? stories : stories.filter((story) => story.tags.includes(activeTag));

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Turtle Soup</p>
          <h1>海龟汤问答</h1>
        </div>
        <span className="api-pill">开始推理</span>
      </section>

      <section className="intro-band">
        <div className="intro-copy">
          <h2>选择一道汤题，开始提问。</h2>
          <p>用尽量清晰的问题一步步还原真相。</p>
        </div>
      </section>

      <section className="filter-row" aria-label="题目标签筛选">
        {tags.map((tag) => (
          <button
            className={tag === activeTag ? "chip active" : "chip"}
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </section>

      <section className="story-grid" aria-label="海龟汤题目列表">
        {filteredStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </section>
    </main>
  );
}

function StoryCard({ story }: { story: Story }) {
  return (
    <a className="story-card" href={getStoryPath(story.id)}>
      <div className="card-header">
        <span className={`difficulty ${story.difficulty}`}>{difficultyText[story.difficulty]}</span>
        <span className="source-mini">{story.source.platform}</span>
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
  );
}

function StoryPage({
  story,
  selectedModel,
  onSelectedModelChange,
}: {
  story: Story;
  selectedModel: AiModelId;
  onSelectedModelChange: (model: AiModelId) => void;
}) {
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<ChatEntry[]>(() => loadStoryProgress(story.id).entries);
  const [hintEnabled, setHintEnabled] = useState(false);
  const [showTruth, setShowTruth] = useState(() => loadStoryProgress(story.id).showTruth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    saveStoryProgress(story.id, { entries, showTruth });
  }, [entries, showTruth, story.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("请输入一个问题。");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const answer = await askAi({
        storyId: story.id,
        surface: story.surface,
        truth: story.truth,
        question: trimmedQuestion,
        hintEnabled,
        model: selectedModel,
        mode: "single_turn_lateral_thinking_host",
      });

      setEntries((current) => [
        ...current,
        {
          id: `${Date.now()}-${current.length}`,
          question: trimmedQuestion,
          answer,
          askedAt: new Date().toISOString(),
        },
      ]);
      setQuestion("");
    } catch {
      setError("暂时没有回应，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  }

  function handleRevealTruth() {
    const confirmed = window.confirm("确定要查看汤底吗？这会直接剧透答案。");
    if (confirmed) {
      setShowTruth(true);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
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
          <h1>{story.title}</h1>
        </div>
        <span className={`difficulty ${story.difficulty}`}>{difficultyText[story.difficulty]}</span>
      </section>

      <section className="surface-band">
        <h2>汤面</h2>
        <p>{story.surface}</p>
      </section>

      <SourcePanel
        onSelectedModelChange={onSelectedModelChange}
        selectedModel={selectedModel}
        source={story.source}
      />

      <section className="game-panel">
        <div className="panel-toolbar">
          <div>
            <h2>问答</h2>
            <p>先从关键线索入手，再逐步缩小范围。</p>
          </div>
          <label className="switch">
            <input checked={hintEnabled} type="checkbox" onChange={(event) => setHintEnabled(event.target.checked)} />
            <span>提示模式</span>
          </label>
        </div>

        <div className="chat-list" aria-live="polite">
          {entries.length === 0 ? (
            <div className="empty-chat">
              <Sparkles size={22} />
              <p>先问一个能用“是 / 不是 / 是也不是 / 无关”回答的问题。</p>
            </div>
          ) : (
            entries.map((entry) => <ChatBubble entry={entry} key={entry.id} />)
          )}
        </div>

        <form className="ask-form" onSubmit={handleSubmit}>
          <input
            aria-label="输入你的问题"
            disabled={isLoading}
            maxLength={160}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="例如：这个男人认识死者吗？"
            value={question}
          />
          <button disabled={isLoading} type="submit">
            {isLoading ? <RefreshCw className="spin" size={18} /> : <Send size={18} />}
            发送
          </button>
        </form>
        {error ? <p className="error-text">{error}</p> : null}
      </section>

      <section className="truth-panel">
        <div>
          <h2>汤底</h2>
          <p>{showTruth ? story.truth : "答案已隐藏。确认想看完整真相时再打开。"}</p>
        </div>
        {!showTruth ? (
          <button className="secondary-button" type="button" onClick={handleRevealTruth}>
            <Eye size={18} />
            查看汤底
          </button>
        ) : null}
      </section>

      <button
        className="reset-button"
        type="button"
        onClick={() => {
          clearStoryProgress(story.id);
          setEntries([]);
          setShowTruth(false);
          setError("");
        }}
      >
        <RefreshCw size={18} />
        重新开始当前题目
      </button>
    </main>
  );
}

function SourcePanel({
  source,
  selectedModel,
  onSelectedModelChange,
}: {
  source: Story["source"];
  selectedModel: AiModelId;
  onSelectedModelChange: (model: AiModelId) => void;
}) {
  return (
    <section className="source-panel">
      <div>
        <h2>来源</h2>
        <p>
          {source.platform || "来源未知"} · {source.authorName || "发布人未知"}
        </p>
        <p className="source-meta">
          {source.license ? `授权：${source.license}` : "授权：未知"}
          {source.collectedAt ? ` · 收录：${source.collectedAt}` : ""}
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
        <label className="model-select">
          <span>模型</span>
          <select
            aria-label="选择 AI 模型"
            onChange={(event) => {
              const nextModel = event.target.value;
              if (isAiModelId(nextModel)) {
                onSelectedModelChange(nextModel);
              }
            }}
            value={selectedModel}
          >
            {modelOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {source.originalUrl ? (
          <a href={source.originalUrl} rel="noreferrer" target="_blank">
            原始来源
            <ExternalLink size={15} />
          </a>
        ) : null}
      </div>
    </section>
  );
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
  );
}

function getStoryProgressStorageKey(storyId: string) {
  return `${STORY_PROGRESS_STORAGE_PREFIX}${storyId}`;
}

function loadSelectedModel(): AiModelId {
  if (typeof window === "undefined") {
    return DEFAULT_AI_MODEL;
  }

  try {
    const raw = window.localStorage.getItem(MODEL_STORAGE_KEY);
    return isAiModelId(raw) ? raw : DEFAULT_AI_MODEL;
  } catch {
    return DEFAULT_AI_MODEL;
  }
}

function saveSelectedModel(model: AiModelId) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(MODEL_STORAGE_KEY, model);
  } catch {
    // The in-memory selection still applies for this session.
  }
}

function isAiModelId(value: string | null): value is AiModelId {
  return modelOptions.some((option) => option.id === value);
}

function loadStoryProgress(storyId: string): { entries: ChatEntry[]; showTruth: boolean } {
  if (typeof window === "undefined") {
    return { entries: [], showTruth: false };
  }

  try {
    const raw = window.localStorage.getItem(getStoryProgressStorageKey(storyId));
    if (!raw) {
      return { entries: [], showTruth: false };
    }

    const parsed = JSON.parse(raw) as Partial<{ entries: unknown; showTruth: unknown }>;
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries.filter(isChatEntry) : [],
      showTruth: parsed.showTruth === true,
    };
  } catch {
    return { entries: [], showTruth: false };
  }
}

function saveStoryProgress(storyId: string, progress: { entries: ChatEntry[]; showTruth: boolean }) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getStoryProgressStorageKey(storyId),
      JSON.stringify({
        version: 1,
        entries: progress.entries,
        showTruth: progress.showTruth,
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // localStorage can be unavailable in private mode or full storage.
  }
}

function clearStoryProgress(storyId: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(getStoryProgressStorageKey(storyId));
  } catch {
    // Ignore storage failures; the in-memory reset still works.
  }
}

function isChatEntry(value: unknown): value is ChatEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<ChatEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.question === "string" &&
    typeof entry.askedAt === "string" &&
    !!entry.answer &&
    typeof entry.answer === "object" &&
    typeof entry.answer.answer === "string" &&
    typeof entry.answer.label === "string"
  );
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
  );
}

export default App;
