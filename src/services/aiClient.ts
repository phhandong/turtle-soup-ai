import type { AiAnswerText, AiRequest, AiResponse } from '../types/story'

const defaultApiUrl = 'https://turtle-soup-ai-proxy.ai-turtle-soup.workers.dev'
const agnesChatCompletionsUrl =
  'https://apihub.agnes-ai.com/v1/chat/completions'
const agnesApiKey = 'sk-zhafY2pJ10V6owwddeI2Cp6OTECk91z81WwJfXrlZl9lmnI9'
const agnesDefaultModel = 'agnes-2.0-flash'
const agnesModels = new Set(['agnes-2.0-flash', 'agnes-1.5-flash'])
const validAnswers = new Set<AiAnswerText>([
  '是',
  '不是',
  '是也不是',
  '无关',
  '还原正确',
])
const labelByAnswer = {
  是: 'yes',
  不是: 'no',
  是也不是: 'both',
  无关: 'irrelevant',
  还原正确: 'solved',
} as const

export async function askAi(request: AiRequest): Promise<AiResponse> {
  const configuredApiUrl = import.meta.env.VITE_AI_API_URL as string | undefined
  const apiUrl =
    configuredApiUrl && !configuredApiUrl.includes('your-api.example.com')
      ? configuredApiUrl
      : defaultApiUrl

  try {
    return await askProxy(apiUrl, request)
  } catch (error) {
    if (!shouldUseAgnesFallback(error)) {
      throw error
    }

    return askAgnesDirect(request)
  }
}

async function askProxy(
  apiUrl: string,
  request: AiRequest,
): Promise<AiResponse> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new AiProxyError(
      `AI API failed with ${response.status}`,
      response.status,
    )
  }

  const data = (await response.json()) as Partial<AiResponse>
  return normalizeAiResponse(data, request.hintEnabled)
}

async function askAgnesDirect(request: AiRequest): Promise<AiResponse> {
  const response = await fetch(agnesChatCompletionsUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${agnesApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getAgnesModel(request.model),
      temperature: 0.1,
      messages: buildMessages(request),
    }),
  })

  if (!response.ok) {
    throw new Error(`Agnes API failed with ${response.status}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  return parseModelOutput(
    data.choices?.[0]?.message?.content ?? '',
    request.hintEnabled,
  )
}

function shouldUseAgnesFallback(error: unknown) {
  if (error instanceof AiProxyError) {
    return error.status >= 500
  }

  return true
}

function isAgnesModel(model: AiRequest['model']) {
  return agnesModels.has(model)
}

function getAgnesModel(model: AiRequest['model']) {
  return isAgnesModel(model) ? model : agnesDefaultModel
}

function buildMessages(request: AiRequest) {
  const answerOptions = request.revealMode
    ? '是|不是|是也不是|无关|还原正确'
    : '是|不是|是也不是|无关'
  const judgementRules = request.revealMode
    ? [
        '你的任务是判断用户提交的还原答案是否与汤底核心真相相符。',
        '用户提交的是对完整真相的还原，不是普通提问。',
        '判断时只比较核心人物、事件、因果和关键反转，允许表达方式不同、顺序不同、细节略有省略。',
        '只能回答“是”、“不是”、“是也不是”、“无关”、“还原正确”五种之一。',
        '如果汤底的核心意思能明确支持用户问题，不需要逐字对应，较为宽松的判断标准，回答“还原正确”。',
        '如果用户还原与汤底明显矛盾，或缺少关键因果，回答“不是”。',
        '如果用户还原部分正确、部分错误，或只还原出一部分关键真相，回答“是也不是”。',
        '如果用户提交内容完全不是当前故事的还原，回答“无关”。',
      ]
    : [
        '你的任务是判断用户问题与汤底事实之间的关系。',
        '用户问题必须是在询问故事中的人物、物品、地点、事件或因果关系，才可以回答“是”、“不是”或“是也不是”。',
        '用户问题可能很短或省略上下文；只要它提到或明显指向汤面/汤底中的人物、属性、物品、地点、事件或原因，就按故事问题判断，不要因为问法不完整就回答“无关”。',
        '如果问题包含“故事中”、“这个故事”、“这题”、“汤里”、“汤底里”等说法，它就是在指向当前故事；即使使用“有人”、“某人”、“东西”、“地方”等泛指，也必须根据汤底判断“是”、“不是”或“是也不是”。',
        '如果用户问题是在骂人、闲聊、命令你、问你本人、问用户本人、问用户亲属，或没有指向故事内容，必须回答“无关”。',
        '问题里的“你”、“我”、“你妈”、“我妈”、“他妈”、“她妈”等日常指代，默认不是故事角色；除非问题明确说明这些指代属于故事人物，否则回答“无关”。',
        '只能回答“是”、“不是”、“是也不是”、“无关”四种之一。',
        '如果汤底的核心意思能明确支持用户问题，不需要逐字对应，回答“是”。',
        '如果汤底能明确否定用户问题，回答“不是”。',
        '如果用户提出某个原因、动机或解释，但汤底给出了不同原因，回答“不是”，不要因为它是猜测就回答“无关”。',
        '如果用户明确询问“故事中是否存在某事实”，而汤底的核心意思没有这个事实，回答“不是”，不要回答“无关”。',
        '如果用户问题部分正确、部分错误，或需要拆成多个判断，回答“是也不是”。',
        '如果用户问题和汤底事实没有关系，或汤底无法判断，回答“无关”。',
      ]

  const system = [
    '你是一个海龟汤游戏主持人。',
    '你每次只根据本次输入的汤底和问题作答。',
    '不要使用历史对话、其他题目、常见题型或外部补全剧情。',
    ...judgementRules,
    '不要泄露汤底，不要解释完整真相。',
    request.hintEnabled
      ? '当前已开启提示模式，可以额外给一句非常短的 hint，但不要剧透关键反转。'
      : '当前未开启提示模式，不要输出 hint。',
    '必须输出严格 JSON，不要输出 Markdown。',
    request.hintEnabled
      ? `JSON 格式：{"answer":"${answerOptions}","hint":"一句非常短的提示"}`
      : `JSON 格式：{"answer":"${answerOptions}"}`,
  ].join('\n')

  const user = [
    `汤面：${request.surface}`,
    `汤底：${request.truth}`,
    `${request.revealMode ? '用户还原' : '问题'}：${request.question}`,
  ].join('\n\n')

  return [
    {
      role: 'system',
      content: system,
    },
    {
      role: 'user',
      content: user,
    },
  ]
}

function parseModelOutput(content: string, hintEnabled: boolean): AiResponse {
  const fallbackAnswer = extractAnswer(content)
  const jsonText = extractJsonObject(content)

  try {
    const parsed = JSON.parse(jsonText) as Partial<{
      answer: string
      hint: string
    }>
    return normalizeAiResponse(
      {
        answer: normalizeAnswer(parsed.answer || fallbackAnswer),
        hint:
          typeof parsed.hint === 'string'
            ? parsed.hint.trim().slice(0, 80)
            : undefined,
      },
      hintEnabled,
    )
  } catch {
    return normalizeAiResponse({ answer: fallbackAnswer }, hintEnabled)
  }
}

function extractJsonObject(content: string) {
  const match = content.match(/\{[\s\S]*\}/)
  return match?.[0] ?? content
}

function extractAnswer(content: string): AiAnswerText {
  const normalized = String(content || '').replace(/\s+/g, '')
  if (normalized.includes('还原正确')) return '还原正确'
  if (normalized.includes('是也不是')) return '是也不是'
  if (
    normalized.includes('"answer":"不是"') ||
    normalized.includes('答案:不是')
  )
    return '不是'
  if (
    normalized.includes('"answer":"无关"') ||
    normalized.includes('答案:无关')
  )
    return '无关'
  if (normalized.includes('"answer":"是"') || normalized.includes('答案:是'))
    return '是'
  if (normalized.includes('不是')) return '不是'
  if (normalized.includes('无关')) return '无关'
  if (normalized.includes('是')) return '是'
  return '无关'
}

function normalizeAnswer(answer: string): AiAnswerText {
  return validAnswers.has(answer as AiAnswerText)
    ? (answer as AiAnswerText)
    : '无关'
}

function normalizeAiResponse(
  data: Partial<AiResponse>,
  hintEnabled: boolean,
): AiResponse {
  const answer =
    data.answer && validAnswers.has(data.answer) ? data.answer : '无关'
  const normalized: AiResponse = {
    answer,
    label: data.label ?? labelByAnswer[answer],
  }

  if (hintEnabled && data.hint) {
    normalized.hint = data.hint
  }

  return normalized
}

class AiProxyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}
