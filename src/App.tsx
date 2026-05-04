import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
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
import type { ChatEntry, Difficulty, Story } from "./types/story";
import { getCurrentStoryId, getStoryPath } from "./utils/routes";

const difficultyText: Record<Difficulty, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

function App() {
  const [storyId, setStoryId] = useState<string | null>(() => getCurrentStoryId());

  useEffect(() => {
    const handleHashChange = () => setStoryId(getCurrentStoryId());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const story = storyId ? getStoryById(storyId) : undefined;

  if (storyId && !story) {
    return <MissingStory />;
  }

  return story ? <StoryPage story={story} /> : <HomePage />;
}

function HomePage() {
  const [activeTag, setActiveTag] = useState("全部");
  const tags = useMemo(() => ["全部", ...Array.from(new Set(stories.flatMap((story) => story.tags)))], []);
  const filteredStories = activeTag === "全部" ? stories : stories.filter((story) => story.tags.includes(activeTag));

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Turtle Soup AI</p>
          <h1>海龟汤 AI</h1>
        </div>
        <a className="api-pill" href="#api-note">
          <Bot size={18} />
          单轮问答
        </a>
      </section>

      <section className="intro-band">
        <div className="intro-copy">
          <h2>选择一道汤题，向 AI 主持人提问。</h2>
          <p>
            页面会保留你的问答记录，但每次请求只发送当前汤面、汤底和本次问题，避免历史对话影响判断。
          </p>
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

      <section className="api-note" id="api-note">
        <h2>API 接入说明</h2>
        <p>
          配置 <code>VITE_AI_API_URL</code> 后，前端会向你的接口发送
          <code>storyId</code>、<code>surface</code>、<code>truth</code>、<code>question</code> 和
          <code>hintEnabled</code>。如果未配置接口，网站会使用本地演示回答。
        </p>
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

function StoryPage({ story }: { story: Story }) {
  const [question, setQuestion] = useState("");
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [hintEnabled, setHintEnabled] = useState(false);
  const [showTruth, setShowTruth] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError("AI 暂时没有回应，请稍后再试。");
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

      <SourcePanel source={story.source} />

      <section className="game-panel">
        <div className="panel-toolbar">
          <div>
            <h2>问答</h2>
            <p>历史记录只显示在页面上，不会发送给 AI。</p>
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

function SourcePanel({ source }: { source: Story["source"] }) {
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
        <span>AI 答</span>
        <strong>{entry.answer.answer}</strong>
        {entry.answer.hint ? <p>{entry.answer.hint}</p> : null}
      </div>
    </article>
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
