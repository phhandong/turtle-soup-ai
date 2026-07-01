import type { AiAnswerText, AiRequest, AiResponse } from '../types/story'

const defaultApiUrl = '/api/ai'
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

  return askProxy(apiUrl, request)
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

  normalized.matchedHintIndexes = normalizeHintIndexes(data.matchedHintIndexes)

  return normalized
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

async function readErrorDetail(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500)
  } catch {
    return ''
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
