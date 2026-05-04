import type { AiRequest, AiResponse } from "../types/story";

const defaultApiUrl = "https://turtle-soup-ai-proxy.ai-turtle-soup.workers.dev";
const validAnswers = new Set(["是", "不是", "是也不是", "无关"]);
const labelByAnswer = {
  是: "yes",
  不是: "no",
  是也不是: "both",
  无关: "irrelevant",
} as const;

export async function askAi(request: AiRequest): Promise<AiResponse> {
  const configuredApiUrl = import.meta.env.VITE_AI_API_URL as string | undefined;
  const apiUrl =
    configuredApiUrl && !configuredApiUrl.includes("your-api.example.com") ? configuredApiUrl : defaultApiUrl;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`AI API failed with ${response.status}`);
  }

  const data = (await response.json()) as Partial<AiResponse>;
  return normalizeAiResponse(data, request.hintEnabled);
}

function normalizeAiResponse(data: Partial<AiResponse>, hintEnabled: boolean): AiResponse {
  const answer = validAnswers.has(data.answer ?? "") ? data.answer! : "无关";
  const normalized: AiResponse = {
    answer,
    label: data.label ?? labelByAnswer[answer],
  };

  if (hintEnabled && data.hint) {
    normalized.hint = data.hint;
  }

  return normalized;
}
