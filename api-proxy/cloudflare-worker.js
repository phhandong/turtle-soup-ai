const MIMO_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1";
const MIMO_MODEL = "MiMo-V2.5-Pro";

const answerMap = {
  "是": "yes",
  "不是": "no",
  "是也不是": "both",
  "无关": "irrelevant",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return withCors(null, 204);
    }

    if (request.method !== "POST") {
      return withCors({ error: "Method not allowed" }, 405);
    }

    if (!env.MIMO_API_KEY) {
      return withCors({ error: "Missing MIMO_API_KEY" }, 500);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return withCors({ error: "Invalid JSON body" }, 400);
    }

    const validationError = validatePayload(payload);
    if (validationError) {
      return withCors({ error: validationError }, 400);
    }

    const prompt = buildPrompt(payload);
    const upstream = await fetch(`${MIMO_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.MIMO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.MIMO_MODEL || MIMO_MODEL,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: prompt.system,
          },
          {
            role: "user",
            content: prompt.user,
          },
        ],
      }),
    });

    if (!upstream.ok) {
      return withCors({ error: "AI upstream request failed" }, 502);
    }

    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    const parsed = parseModelOutput(content, payload.hintEnabled);

    return withCors(parsed, 200);
  },
};

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") return "Missing payload";
  if (!payload.storyId || typeof payload.storyId !== "string") return "Missing storyId";
  if (!payload.surface || typeof payload.surface !== "string") return "Missing surface";
  if (!payload.truth || typeof payload.truth !== "string") return "Missing truth";
  if (!payload.question || typeof payload.question !== "string") return "Missing question";
  if (payload.question.length > 160) return "Question is too long";
  return "";
}

function buildPrompt(payload) {
  const system = [
    "你是一个海龟汤游戏主持人。",
    "你知道当前题目的汤面和汤底。",
    "你只能根据当前汤面、汤底和用户本次问题回答。",
    "你不能参考任何历史对话。",
    "默认只允许回答“是”、“不是”、“是也不是”、“无关”四种之一。",
    "不要主动泄露汤底。",
    "不要直接解释完整真相。",
    "如果用户的问题与汤底无关，回答“无关”。",
    "如果汤底不足以判断，回答“无关”。",
    "如果用户的问题部分正确、部分错误，或不能简单归为肯定/否定，回答“是也不是”。",
    payload.hintEnabled
      ? "当前已开启提示模式，可以额外给一句非常短的 hint，但不要剧透关键反转。"
      : "当前未开启提示模式，不要输出 hint。",
    "必须输出严格 JSON，不要输出 Markdown。",
    payload.hintEnabled
      ? 'JSON 格式：{"answer":"是|不是|是也不是|无关","hint":"一句非常短的提示"}'
      : 'JSON 格式：{"answer":"是|不是|是也不是|无关"}',
  ].join("\n");

  const user = [
    `汤面：${payload.surface}`,
    `汤底：${payload.truth}`,
    `用户本次问题：${payload.question}`,
  ].join("\n\n");

  return { system, user };
}

function parseModelOutput(content, hintEnabled) {
  const fallbackAnswer = extractAnswer(content);

  try {
    const parsed = JSON.parse(content);
    const answer = normalizeAnswer(parsed.answer || fallbackAnswer);
    const response = {
      answer,
      label: answerMap[answer],
    };

    if (hintEnabled && typeof parsed.hint === "string" && parsed.hint.trim()) {
      response.hint = parsed.hint.trim().slice(0, 80);
    }

    return response;
  } catch {
    const answer = normalizeAnswer(fallbackAnswer);
    return {
      answer,
      label: answerMap[answer],
    };
  }
}

function extractAnswer(content) {
  if (content.includes("是也不是")) return "是也不是";
  if (content.includes("不是")) return "不是";
  if (content.includes("无关")) return "无关";
  if (content.includes("是")) return "是";
  return "无关";
}

function normalizeAnswer(answer) {
  return Object.hasOwn(answerMap, answer) ? answer : "无关";
}

function withCors(body, status) {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
