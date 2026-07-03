import type { AiAnswerText, AiRequest, AiResponse } from '../types/story'
import {
  ApiKeyUnlockError,
  getApiKeyForModel,
  hasConfiguredEncryptedApiKey,
  hasUnlockedApiAccess,
} from './apiKeyVault'

const defaultDevApiUrl = '/api/ai'
const defaultDeepSeekFcApiUrl =
  'https://turtle-ai-proxy-opzmtticwv.cn-wulanchabu.fcapp.run'
const retryableStatuses = new Set([502, 503, 504])
const maxAttempts = 2
const retryDelayMs = 600
const defaultDirectBaseUrlByModel: Partial<Record<AiRequest['model'], string>> =
  {
    'agnes-2.0-flash': 'https://apihub.agnes-ai.com/v1',
    'claude-opus-4-8': 'https://api.unity2.ai',
  }
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

type HintCandidate = NonNullable<AiRequest['hintCandidates']>[number]

export async function askAi(request: AiRequest): Promise<AiResponse> {
  if (request.model === 'deepseek-v4-flash') {
    return askProxy(getDeepSeekProxyUrl(), request)
  }

  assertApiGateUnlocked()

  const directBaseUrl = getDirectBaseUrl(request.model)
  if (directBaseUrl) {
    return askOpenAiCompatible(directBaseUrl, request)
  }

  throw new AiConfigurationError(
    `No AI route configured for ${request.model}`,
  )
}

export { ApiKeyUnlockError }

function assertApiGateUnlocked() {
  if (!hasConfiguredEncryptedApiKey()) {
    throw new ApiKeyUnlockError('No encrypted API key configured')
  }

  if (!hasUnlockedApiAccess()) {
    throw new ApiKeyUnlockError('API key is locked')
  }
}

async function askOpenAiCompatible(
  baseUrl: string,
  request: AiRequest,
): Promise<AiResponse> {
  const prompt = buildPrompt(request)
  const response = await fetch(getChatCompletionsUrl(baseUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKeyForModel(request.model)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      temperature: 0.1,
      max_tokens: prompt.maxTokens,
      messages: [
        {
          role: 'system',
          content: prompt.system,
        },
        {
          role: 'user',
          content: prompt.user,
        },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await readErrorDetail(response)
    throw new AiProxyError(
      `AI API failed with ${response.status}`,
      response.status,
      detail,
    )
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return parseModelOutput(
    data.choices?.[0]?.message?.content ?? '',
    request,
  )
}

async function askProxy(
  apiUrl: string,
  request: AiRequest,
): Promise<AiResponse> {
  const body = JSON.stringify(request)
  let response: Response

  for (let attempt = 1; ; attempt += 1) {
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      })
    } catch (error) {
      if (attempt >= maxAttempts) {
        throw error
      }

      await delay(retryDelayMs)
      continue
    }

    if (!retryableStatuses.has(response.status) || attempt >= maxAttempts) {
      break
    }

    await drainResponse(response)
    await delay(retryDelayMs)
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response)
    throw new AiProxyError(
      `AI API failed with ${response.status}`,
      response.status,
      detail,
    )
  }

  const data = (await response.json()) as Partial<AiResponse>
  return normalizeAiResponse(data, request.hintEnabled)
}

function buildPrompt(request: AiRequest) {
  const hintCandidates = normalizeHintCandidates(request.hintCandidates)
  const hintCandidateText =
    hintCandidates.length > 0
      ? hintCandidates
          .map((candidate) => `${candidate.index}: ${candidate.text}`)
          .join('\n')
      : 'none'
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
    '同时比较用户消息和 hintCandidates。只有当用户消息与候选提示中的关键词、关键物品、关键动作或关键因果高度相关时，才把该候选 index 放入 matchedHintIndexes。',
    '不要因为用户问题泛泛接近汤底、只表达宽泛方向、只碰到故事常见背景，就判定提示匹配；没有明确关键词重合或强语义对应时返回空数组。',
    'matchedHintIndexes 只能包含 hintCandidates 中出现的 index。',
    '必须输出严格 JSON，不要输出 Markdown。',
    request.hintEnabled
      ? `JSON 格式：{"answer":"${answerOptions}","hint":"一句非常短的提示","matchedHintIndexes":[0]}`
      : `JSON 格式：{"answer":"${answerOptions}","matchedHintIndexes":[0]}`,
  ].join('\n')

  const user = [
    `汤面：${request.surface}`,
    `汤底：${request.truth}`,
    `${request.revealMode ? '用户还原' : '问题'}：${request.question}`,
    `hintCandidates:\n${hintCandidateText}`,
  ].join('\n\n')

  return {
    system,
    user,
    maxTokens: request.hintEnabled ? 120 : 64,
  }
}

function parseModelOutput(content: string, request: AiRequest): AiResponse {
  const hintCandidates = normalizeHintCandidates(request.hintCandidates)
  const fallbackAnswer = extractAnswer(content)
  const jsonText = extractJsonObject(content)
  const validHintIndexes = new Set(
    hintCandidates.map((candidate) => candidate.index),
  )

  try {
    const parsed = JSON.parse(jsonText) as Partial<{
      answer: unknown
      hint: unknown
      matchedHintIndexes: unknown
    }>
    const answer = normalizeAnswer(
      typeof parsed.answer === 'string' ? parsed.answer : fallbackAnswer,
    )
    const response: AiResponse = {
      answer,
      label: labelByAnswer[answer],
      matchedHintIndexes: normalizeMatchedHintIndexes(
        parsed.matchedHintIndexes,
        validHintIndexes,
        hintCandidates,
        request.question,
      ),
    }

    if (
      request.hintEnabled &&
      typeof parsed.hint === 'string' &&
      parsed.hint.trim()
    ) {
      response.hint = parsed.hint.trim().slice(0, 80)
    }

    return response
  } catch {
    const answer = normalizeAnswer(fallbackAnswer)
    return {
      answer,
      label: labelByAnswer[answer],
      matchedHintIndexes: [],
    }
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
    matchedHintIndexes: normalizeHintIndexes(data.matchedHintIndexes),
  }

  if (hintEnabled && data.hint) {
    normalized.hint = data.hint
  }

  return normalized
}

function normalizeHintCandidates(value: AiRequest['hintCandidates']) {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<number>()
  const candidates: HintCandidate[] = []

  for (const candidate of value) {
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      !Number.isInteger(candidate.index) ||
      candidate.index < 0 ||
      candidate.index >= 3 ||
      typeof candidate.text !== 'string'
    ) {
      continue
    }

    const text = candidate.text.trim()
    if (!text || seen.has(candidate.index)) {
      continue
    }

    seen.add(candidate.index)
    candidates.push({
      index: candidate.index,
      text: text.slice(0, 120),
    })
  }

  return candidates
}

function normalizeHintIndexes(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }

  return Array.from(
    new Set(
      value.filter(
        (index): index is number =>
          typeof index === 'number' &&
          Number.isInteger(index) &&
          index >= 0 &&
          index < 3,
      ),
    ),
  ).sort((left, right) => left - right)
}

function normalizeMatchedHintIndexes(
  value: unknown,
  validHintIndexes: Set<number>,
  hintCandidates: HintCandidate[],
  question: string,
) {
  if (!Array.isArray(value) || validHintIndexes.size === 0) {
    return []
  }

  const candidateByIndex = new Map(
    hintCandidates.map((candidate) => [candidate.index, candidate]),
  )

  return Array.from(
    new Set(
      value.filter((index): index is number => {
        if (!Number.isInteger(index) || !validHintIndexes.has(index)) {
          return false
        }

        const candidate = candidateByIndex.get(index)
        return !!candidate && isKeywordRelevant(question, candidate.text)
      }),
    ),
  ).sort((left, right) => left - right)
}

function isKeywordRelevant(question: string, hintText: string) {
  const questionTokens = getKeywordTokens(question)
  const hintTokens = getKeywordTokens(hintText)

  if (questionTokens.size === 0 || hintTokens.size === 0) {
    return false
  }

  let overlapCount = 0
  for (const token of hintTokens) {
    if (questionTokens.has(token)) {
      overlapCount += 1
    }
  }

  const overlapRatio = overlapCount / hintTokens.size
  if (overlapCount >= 1 && overlapRatio >= 0.25) {
    return true
  }

  for (const hintToken of hintTokens) {
    if (hintToken.length < 2) {
      continue
    }

    for (const questionToken of questionTokens) {
      if (
        questionToken.length >= 2 &&
        (questionToken.includes(hintToken) || hintToken.includes(questionToken))
      ) {
        return true
      }
    }
  }

  return false
}

function getKeywordTokens(value: string) {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/[，。！？、；：“”‘’（）()[\]{}<>《》.,!?;:'"`~@#$%^&*_+=|\\/\\-]/g, ' ')
  const tokens = new Set<string>()

  for (const token of normalized.match(/[a-z0-9]+/g) || []) {
    if (token.length >= 3) {
      tokens.add(token)
    }
  }

  for (const token of normalized.match(/[\u4e00-\u9fff]{2,}/g) || []) {
    tokens.add(token)
    for (let size = 2; size <= Math.min(4, token.length); size += 1) {
      for (let index = 0; index <= token.length - size; index += 1) {
        tokens.add(token.slice(index, index + size))
      }
    }
  }

  return tokens
}

function getDeepSeekProxyUrl() {
  const configuredDeepSeekProxyUrl = getConfiguredAbsoluteEnvUrl(
    import.meta.env.VITE_DEEPSEEK_FC_API_URL,
  )
  if (configuredDeepSeekProxyUrl) {
    return configuredDeepSeekProxyUrl
  }

  const configuredProxyUrl = getConfiguredEnvUrl(import.meta.env.VITE_AI_API_URL)
  if (configuredProxyUrl) {
    if (isAbsoluteUrl(configuredProxyUrl) || import.meta.env.DEV) {
      return configuredProxyUrl
    }
  }

  return import.meta.env.DEV ? defaultDevApiUrl : defaultDeepSeekFcApiUrl
}

function getDirectBaseUrl(model: AiRequest['model']) {
  const configuredUrl = getConfiguredAbsoluteEnvUrl(getDirectBaseEnvValue(model))
  if (configuredUrl) {
    return configuredUrl
  }

  return defaultDirectBaseUrlByModel[model] ?? ''
}

function getDirectBaseEnvValue(model: AiRequest['model']) {
  if (model === 'agnes-2.0-flash') {
    return import.meta.env.VITE_AGNES_API_BASE_URL as string | undefined
  }

  if (model === 'claude-opus-4-8') {
    return import.meta.env.VITE_UNITY_API_BASE_URL as string | undefined
  }

  return undefined
}

function getConfiguredAbsoluteEnvUrl(value: string | undefined) {
  const configuredUrl = getConfiguredEnvUrl(value)
  return configuredUrl && isAbsoluteUrl(configuredUrl) ? configuredUrl : ''
}

function getConfiguredEnvUrl(value: string | undefined) {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.includes('your-')) {
    return ''
  }

  return trimmed
}

function getChatCompletionsUrl(baseUrl: string) {
  const trimmed = trimTrailingSlash(baseUrl)
  return trimmed.endsWith('/chat/completions')
    ? trimmed
    : `${trimmed}/chat/completions`
}

function isAbsoluteUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function drainResponse(response: Response): Promise<void> {
  try {
    await response.text()
  } catch {
    // Ignore retry body read failures.
  }
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500)
  } catch {
    return ''
  }
}

class AiConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AiConfigurationError'
  }
}

class AiProxyError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: string,
  ) {
    super(message)
  }
}
