const MIMO_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";

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
    "你每次只根据本次输入的汤底和问题作答。",
    "不要使用历史对话、其他题目、常见题型或外部补全剧情。",
    "你的任务是判断用户问题与汤底事实之间的关系。",
    "用户问题必须是在询问故事中的人物、物品、地点、事件或因果关系，才可以回答“是”、“不是”或“是也不是”。",
    "用户问题可能很短或省略上下文；只要它提到或明显指向汤面/汤底中的人物、属性、物品、地点、事件或原因，就按故事问题判断，不要因为问法不完整就回答“无关”。",
    "如果问题包含“故事中”、“这个故事”、“这题”、“汤里”、“汤底里”等说法，它就是在指向当前故事；即使使用“有人”、“某人”、“东西”、“地方”等泛指，也必须根据汤底判断“是”、“不是”或“是也不是”。",
    "如果用户问题是在骂人、闲聊、命令你、问你本人、问用户本人、问用户亲属，或没有指向故事内容，必须回答“无关”。",
    "问题里的“你”、“我”、“你妈”、“我妈”、“他妈”、“她妈”等日常指代，默认不是故事角色；除非问题明确说明这些指代属于故事人物，否则回答“无关”。",
    "只能回答“是”、“不是”、“是也不是”、“无关”四种之一。",
    "如果汤底能明确支持用户问题，回答“是”。",
    "如果汤底能明确否定用户问题，回答“不是”。",
    "如果用户提出某个原因、动机或解释，但汤底给出了不同原因，回答“不是”，不要因为它是猜测就回答“无关”。",
    "如果用户明确询问“故事中是否存在某事实”，而汤底没有这个事实，回答“不是”，不要回答“无关”。",
    "如果用户问题部分正确、部分错误，或需要拆成多个判断，回答“是也不是”。",
    "如果用户问题和汤底事实没有关系，或汤底无法判断，回答“无关”。",
    "不要泄露汤底，不要解释完整真相。",
    "例：如果问题是“你妈死了”或“你是不是傻”，这不是关于故事的问题，必须回答“无关”。",
    "例：如果汤底说有人自杀或有人已经死去，问题是“故事中有人死亡吗”，这是在询问故事事件，且汤底支持，必须回答“是”。",
    "例：如果汤底说男人因为意识到当年的肉不是海龟肉而自杀，问题是“因为男人不喜欢喝汤吗”，这是在猜故事原因，汤底给出了不同原因，必须回答“不是”。",
    "例：如果汤底说男人个子很矮、够不到电梯按钮，问题是“男人身高不够吗”，这是在询问故事人物属性，且汤底支持，必须回答“是”。",
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
    `问题：${payload.question}`,
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
  const normalized = String(content || "").replace(/\s+/g, "");
  if (normalized.includes("是也不是")) return "是也不是";
  if (normalized.includes("\"answer\":\"不是\"") || normalized.includes("答案:不是")) return "不是";
  if (normalized.includes("\"answer\":\"无关\"") || normalized.includes("答案:无关")) return "无关";
  if (normalized.includes("\"answer\":\"是\"") || normalized.includes("答案:是")) return "是";
  if (normalized.includes("不是")) return "不是";
  if (normalized.includes("无关")) return "无关";
  if (normalized.includes("是")) return "是";
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
