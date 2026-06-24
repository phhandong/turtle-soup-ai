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

export type Story = {
  id: string;
  title: string;
  surface: string;
  truth: string;
  difficulty: Difficulty;
  tags: string[];
  summary?: string;
  source: StorySource;
};

export type AnswerLabel = "yes" | "no" | "both" | "irrelevant";

export type AiAnswerText = "是" | "不是" | "是也不是" | "无关";

export type AiModelId = "mimo-v2.5-pro" | "agnes-2.0-flash" | "agnes-1.5-flash";

export type AiRequest = {
  storyId: string;
  surface: string;
  truth: string;
  question: string;
  hintEnabled: boolean;
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
