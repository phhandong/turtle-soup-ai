export type Difficulty = "easy" | "medium" | "hard";

export type StorySource = {
  platform: string;
  authorName: string;
  authorUrl?: string;
  originalUrl?: string;
  license?: string;
  collectedAt?: string;
  note?: string;
};

export type StoryHints = {
  questionLimit: number;
  hintCost: number;
  items: [string, string, string];
};

export type Story = {
  id: string;
  title: string;
  surface: string;
  truth: string;
  difficulty: Difficulty;
  hints?: StoryHints;
  tags: string[];
  summary?: string;
  source: StorySource;
};

export type AnswerLabel = "yes" | "no" | "both" | "irrelevant" | "solved";

export type AiAnswerText = "是" | "不是" | "是也不是" | "无关" | "还原正确";

export type AiModelId =
  | "agnes-2.0-flash"
  | "deepseek-v4-flash"
  | "claude-opus-4-8";

export type AiRequest = {
  storyId: string;
  surface: string;
  truth: string;
  question: string;
  hintEnabled: boolean;
  revealMode: boolean;
  model: AiModelId;
  mode: "single_turn_lateral_thinking_host";
};

export type AiResponse = {
  answer: AiAnswerText;
  label: AnswerLabel;
  hint?: string;
};

export type ChatEntry = {
  id: string;
  question: string;
  answer: AiResponse;
  askedAt: string;
};
