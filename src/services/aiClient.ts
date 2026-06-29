import type { AiAnswerText, AiRequest, AiResponse } from '../types/story'

const defaultApiUrl = 'https://api-turtle.handong-joy.xyz'
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
    throw new AiProxyError(
      `AI API failed with ${response.status}`,
      response.status,
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
