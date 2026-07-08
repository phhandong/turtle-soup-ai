const HINT_AUTO_REVEAL_SIMILARITY_THRESHOLD = 0.68

export function mergeHintIndexes(
  currentIndexes: number[],
  nextIndexes: number[],
  hintCount = 3,
) {
  return Array.from(
    new Set(
      [...currentIndexes, ...nextIndexes].filter(
        (index) => Number.isInteger(index) && index >= 0 && index < hintCount,
      ),
    ),
  ).sort((left, right) => left - right)
}

export function getAutoRevealHintIndexes(
  aiHint: string | undefined,
  hints: string[],
  revealedIndexes: number[],
  question: string,
) {
  if (!aiHint?.trim()) {
    return []
  }

  return hints
    .map((hint, index) => ({
      index,
      similarity: getHintTextSimilarity(aiHint, hint),
    }))
    .filter(
      ({ index, similarity }) =>
        !revealedIndexes.includes(index) &&
        similarity >= HINT_AUTO_REVEAL_SIMILARITY_THRESHOLD &&
        isHintUnlockQuestionRelevant(question, hints[index]),
    )
    .map(({ index }) => index)
}

function isHintUnlockQuestionRelevant(question: string, hint: string) {
  const questionCoreTokens = getCoreHintTokens(question)
  const hintCoreTokens = getCoreHintTokens(hint)

  if (hasSharedHintToken(questionCoreTokens, hintCoreTokens)) {
    return true
  }

  if (
    !isExclusionHint(hint) &&
    hasSharedSpecificShortHintToken(
      getShortHintTokens(question),
      getShortHintTokens(hint),
    )
  ) {
    return true
  }

  return false
}

function hasSharedHintToken(leftTokens: Set<string>, rightTokens: Set<string>) {
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      return true
    }
  }

  return false
}

function hasSharedSpecificShortHintToken(
  leftTokens: Set<string>,
  rightTokens: Set<string>,
) {
  const genericTokens = new Set([
    '不是',
    '是否',
    '有没有',
    '没有',
    '有关',
    '关系',
    '问题',
    '原因',
    '这个',
    '那个',
    '有人',
    '东西',
    '地方',
    '时候',
    '重要',
  ])

  for (const token of leftTokens) {
    if (!genericTokens.has(token) && rightTokens.has(token)) {
      return true
    }
  }

  return false
}

function isExclusionHint(value: string) {
  return /不在|不是|并非|无关|没有|没/.test(value)
}

function getHintTextSimilarity(left: string, right: string) {
  const normalizedLeft = normalizeHintText(left)
  const normalizedRight = normalizeHintText(right)

  if (!normalizedLeft || !normalizedRight) {
    return 0
  }

  const shorterLength = Math.min(normalizedLeft.length, normalizedRight.length)
  if (
    shorterLength >= 6 &&
    (normalizedLeft.includes(normalizedRight) ||
      normalizedRight.includes(normalizedLeft))
  ) {
    return 1
  }

  const leftTokens = getHintSimilarityTokens(normalizedLeft)
  const rightTokens = getHintSimilarityTokens(normalizedRight)
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0
  }

  let overlapCount = 0
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlapCount += 1
    }
  }

  return overlapCount / Math.min(leftTokens.size, rightTokens.size)
}

function normalizeHintText(value: string) {
  return value
    .toLowerCase()
    .replace(/[，。！？、；：“”‘’（）()[\]{}<>《》.,!?;:'"`~@#$%^&*_+=|\\/\\-]/g, '')
    .replace(/\s+/g, '')
    .trim()
}

function getHintSimilarityTokens(value: string) {
  const tokens = new Set<string>()

  for (const token of value.match(/[a-z0-9]+/g) || []) {
    if (token.length >= 3) {
      tokens.add(token)
    }
  }

  for (const token of value.match(/[\u4e00-\u9fff]{2,}/g) || []) {
    tokens.add(token)
    for (let size = 2; size <= Math.min(4, token.length); size += 1) {
      for (let index = 0; index <= token.length - size; index += 1) {
        tokens.add(token.slice(index, index + size))
      }
    }
  }

  return tokens
}

function getCoreHintTokens(value: string) {
  const normalized = normalizeHintText(value)
  const tokens = new Set<string>()

  for (const token of normalized.match(/[a-z0-9]+/g) || []) {
    if (token.length >= 4) {
      tokens.add(token)
    }
  }

  for (const token of normalized.match(/[\u4e00-\u9fff]{2,}/g) || []) {
    if (token.length <= 3) {
      tokens.add(token)
      continue
    }

    for (let size = 3; size <= Math.min(5, token.length); size += 1) {
      for (let index = 0; index <= token.length - size; index += 1) {
        tokens.add(token.slice(index, index + size))
      }
    }
  }

  return tokens
}

function getShortHintTokens(value: string) {
  const normalized = normalizeHintText(value)
  const tokens = new Set<string>()

  for (const token of normalized.match(/[a-z0-9]+/g) || []) {
    if (token.length >= 3) {
      tokens.add(token)
    }
  }

  for (const token of normalized.match(/[\u4e00-\u9fff]{2,}/g) || []) {
    for (let index = 0; index <= token.length - 2; index += 1) {
      tokens.add(token.slice(index, index + 2))
    }
  }

  return tokens
}

export function getUnlockProgressPercent(
  revealedCount: number,
  hintCount: number,
  showTruth: boolean,
) {
  if (showTruth) {
    return 100
  }

  if (hintCount <= 0) {
    return 0
  }

  return Math.min(99, revealedCount * 33)
}
