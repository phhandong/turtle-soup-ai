import type { AiRequest, AiResponse } from "../types/story";

const validAnswers = new Set(["是", "不是", "是也不是", "无关"]);
const labelByAnswer = {
  是: "yes",
  不是: "no",
  是也不是: "both",
  无关: "irrelevant",
} as const;

export async function askAi(request: AiRequest): Promise<AiResponse> {
  const apiUrl = import.meta.env.VITE_AI_API_URL as string | undefined;

  if (!apiUrl || apiUrl.includes("your-api.example.com")) {
    return mockAiResponse(request);
  }

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

function mockAiResponse(request: AiRequest): Promise<AiResponse> {
  const question = request.question.toLowerCase();
  let answer: AiResponse["answer"] = answerKnownFact(request) ?? "无关";

  if (question.includes("妻") || question.includes("伞") || question.includes("危险")) {
    answer = "是也不是";
  }

  if (question.includes("矮") || question.includes("报警")) {
    answer = "是";
  }

  if (question.includes("外星") || question.includes("魔法") || question.includes("梦")) {
    answer = "不是";
  }

  const result: AiResponse = {
    answer,
    label: labelByAnswer[answer],
  };

  if (request.hintEnabled) {
    result.hint = "试着换个角度，把问题问得更具体一些。";
  }

  return new Promise<AiResponse>((resolve) => {
    window.setTimeout(() => resolve(result), 450);
  });
}

function answerKnownFact(request: AiRequest): AiResponse["answer"] | undefined {
  if (!asksAboutDeath(request.question)) return undefined;
  return mentionsDeathFact(request.truth) ? "是" : "不是";
}

function asksAboutDeath(question: string): boolean {
  return /死|死亡|自杀|被杀|遇害|丧命|去世|死者/.test(question);
}

function mentionsDeathFact(truth: string): boolean {
  return /死|死亡|自杀|被杀|遇害|丧命|去世|死者/.test(truth);
}
