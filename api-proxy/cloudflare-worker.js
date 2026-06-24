const MIMO_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";
const AGNES_BASE_URL = "https://apihub.agnes-ai.com/v1";
const AGNES_API_KEY = "sk-zhafY2pJ10V6owwddeI2Cp6OTECk91z81WwJfXrlZl9lmnI9";
const AGNES_DEFAULT_MODEL = "agnes-2.0-flash";
const AGNES_MODELS = new Set([AGNES_DEFAULT_MODEL, "agnes-1.5-flash"]);
const SUPPORTED_MODELS = new Set([MIMO_MODEL, ...AGNES_MODELS]);
const DEBUG_TIMING_QUERY = "debugTiming";
const DEBUG_TIMING_HEADER = "x-debug-timing";

const answerMap = {
  "是": "yes",
  "不是": "no",
  "是也不是": "both",
  "无关": "irrelevant",
};

export default {
  async fetch(request, env) {
    const timings = createTimingCollector();
    const debugTiming = wantsDebugTiming(request);
    const respond = (body, status, meta) =>
      withCors(withDebugTiming(body, timings, debugTiming, meta), status, timings.toHeaders());

    if (request.method === "OPTIONS") {
      return respond(null, 204);
    }

    if (request.method !== "POST") {
      return respond({ error: "Method not allowed" }, 405);
    }

    let payload;
    try {
      const startedAt = performance.now();
      payload = await request.json();
      timings.add("request_json", startedAt);
    } catch {
      return respond({ error: "Invalid JSON body" }, 400);
    }

    const validateStartedAt = performance.now();
    const validationError = validatePayload(payload);
    timings.add("validate", validateStartedAt);
    if (validationError) {
      return respond({ error: validationError }, 400);
    }

    const promptStartedAt = performance.now();
    const prompt = buildPrompt(payload);
    timings.add("build_prompt", promptStartedAt);

    const requestedModel = getRequestedModel(payload);
    const upstreamResult = await fetchUpstream(buildChannels(env, requestedModel), prompt, timings, debugTiming);
    if (!upstreamResult.ok) {
      return respond({ error: "AI upstream request failed" }, 502, {
        upstreamAttempts: upstreamResult.attempts,
      });
    }

    const { channel, data, response } = upstreamResult;
    const content = data?.choices?.[0]?.message?.content ?? "";

    const parseStartedAt = performance.now();
    const parsed = parseModelOutput(content, payload.hintEnabled);
    timings.add("parse_model_output", parseStartedAt);

    return respond(parsed, 200, {
      upstreamChannel: channel.name,
      upstreamStatus: response.status,
      model: channel.model,
      fallbackUsed: channel.name !== "mimo",
    });
  },
};

function buildChannels(env, requestedModel) {
  if (isAgnesModel(requestedModel)) {
    return [buildAgnesChannel(env, requestedModel)];
  }

  const channels = [];
  if (env.MIMO_API_KEY) {
    channels.push({
      name: "mimo",
      baseUrl: MIMO_BASE_URL,
      apiKey: env.MIMO_API_KEY,
      model: env.MIMO_MODEL || MIMO_MODEL,
    });
  }

  channels.push(buildAgnesChannel(env, env.AGNES_MODEL || AGNES_DEFAULT_MODEL));

  return channels;
}

function buildAgnesChannel(env, model) {
  return {
    name: "agnes-free",
    baseUrl: env.AGNES_BASE_URL || AGNES_BASE_URL,
    apiKey: env.AGNES_API_KEY || AGNES_API_KEY,
    model,
  };
}

async function fetchUpstream(channels, prompt, timings, debugTiming) {
  const attempts = [];

  for (const channel of channels) {
    const timingKey = channel.name.replace(/[^a-z0-9_]/gi, "_");
    let response;

    try {
      const upstreamStartedAt = performance.now();
      response = await fetch(`${trimTrailingSlash(channel.baseUrl)}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${channel.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: channel.model,
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
      timings.add(`upstream_fetch_${timingKey}`, upstreamStartedAt);
    } catch (error) {
      attempts.push({
        channel: channel.name,
        error: getErrorMessage(error),
      });
      continue;
    }

    if (!response.ok) {
      const attempt = {
        channel: channel.name,
        status: response.status,
        statusText: response.statusText,
      };

      if (debugTiming) {
        const upstreamErrorStartedAt = performance.now();
        const upstreamBody = await response.text();
        timings.add(`upstream_error_body_${timingKey}`, upstreamErrorStartedAt);
        attempt.body = upstreamBody.slice(0, 500);
      }

      attempts.push(attempt);
      continue;
    }

    try {
      const upstreamJsonStartedAt = performance.now();
      const data = await response.json();
      timings.add(`upstream_json_${timingKey}`, upstreamJsonStartedAt);
      return { ok: true, channel, data, response, attempts };
    } catch (error) {
      attempts.push({
        channel: channel.name,
        status: response.status,
        statusText: response.statusText,
        error: getErrorMessage(error),
      });
    }
  }

  return { ok: false, attempts };
}

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200);
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") return "Missing payload";
  if (!payload.storyId || typeof payload.storyId !== "string") return "Missing storyId";
  if (!payload.surface || typeof payload.surface !== "string") return "Missing surface";
  if (!payload.truth || typeof payload.truth !== "string") return "Missing truth";
  if (!payload.question || typeof payload.question !== "string") return "Missing question";
  if (payload.question.length > 160) return "Question is too long";
  if (payload.model !== undefined && (typeof payload.model !== "string" || !SUPPORTED_MODELS.has(payload.model))) {
    return "Invalid model";
  }
  return "";
}

function getRequestedModel(payload) {
  return SUPPORTED_MODELS.has(payload.model) ? payload.model : MIMO_MODEL;
}

function isAgnesModel(model) {
  return AGNES_MODELS.has(model);
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

function wantsDebugTiming(request) {
  const url = new URL(request.url);
  return url.searchParams.get(DEBUG_TIMING_QUERY) === "1" || request.headers.get(DEBUG_TIMING_HEADER) === "1";
}

function createTimingCollector() {
  const startedAt = performance.now();
  const entries = [];

  return {
    add(name, stepStartedAt) {
      entries.push({
        name,
        dur: performance.now() - stepStartedAt,
      });
    },
    snapshot() {
      const total = performance.now() - startedAt;
      return Object.fromEntries([...entries, { name: "total", dur: total }].map(({ name, dur }) => [name, roundMs(dur)]));
    },
    toHeaders() {
      return {
        "Server-Timing": [...entries, { name: "total", dur: performance.now() - startedAt }]
          .map(({ name, dur }) => `${name};dur=${roundMs(dur)}`)
          .join(", "),
      };
    },
  };
}

function withDebugTiming(body, timings, enabled, meta = {}) {
  if (!enabled || !body || typeof body !== "object") return body;

  return {
    ...body,
    debug: {
      timingsMs: timings.snapshot(),
      ...meta,
    },
  };
}

function roundMs(value) {
  return Math.round(value * 10) / 10;
}

function withCors(body, status, extraHeaders = {}) {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Debug-Timing",
      "Access-Control-Expose-Headers": "Server-Timing",
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}
