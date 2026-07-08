import type { AiModelId, Difficulty } from '../types/story'

export const DEFAULT_AI_MODEL: AiModelId = 'deepseek-v4-flash'

export const modelOptions: Array<{ id: AiModelId; label: string }> = [
  { id: 'agnes-2.0-flash', label: 'Agnes 2.0 Flash' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
]

export const difficultyText: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export const difficultyOptions: Difficulty[] = ['easy', 'medium', 'hard']

export const pageSizeOptions = [10, 20, 50] as const

export const defaultHintSettings: Record<
  Difficulty,
  { questionLimit: number; hintCost: number }
> = {
  easy: { questionLimit: 30, hintCost: 10 },
  medium: { questionLimit: 45, hintCost: 15 },
  hard: { questionLimit: 60, hintCost: 20 },
}
export const questionPromptGroups = [
  [
    '这个人知道真相吗？',
    '死亡是意外吗？',
    '地点重要吗？',
    '有凶手吗？',
    '动机重要吗？',
  ],
  [
    '死者认识凶手吗？',
    '时间顺序重要吗？',
    '有第三人在场吗？',
    '死者自愿这样做吗？',
    '有人在撒谎吗？',
  ],
  [
    '物品被调换了吗？',
    '他说谎了吗？',
    '职业重要吗？',
    '年龄重要吗？',
    '房间布局重要吗？',
  ],
  [
    '原因发生在过去吗？',
    '身份被误认了吗？',
    '这和钱有关吗？',
    '关系亲疏重要吗？',
    '有人提前计划了吗？',
  ],
  [
    '有人故意隐瞒吗？',
    '天气重要吗？',
    '这句话是关键吗？',
    '现场有伪装吗？',
    '结局可以避免吗？',
  ],
] as const
