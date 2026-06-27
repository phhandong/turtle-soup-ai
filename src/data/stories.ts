import type { Story } from '../types/story'

export const storyCategoryTags = [
  '血色密室',
  '荒野遗物',
  '餐桌谜案',
  '深海求生',
  '医院诡事',
  '雨夜车祸',
  '陌生来客',
  '人偶误认',
  '童话黑箱',
  '游戏陷阱',
  '时间错觉',
  '文字陷阱',
  '身体代价',
  '日常怪谈',
  '绝境誓言',
] as const

export const stories: Story[] = [
  {
    id: 'restaurant-turtle-soup',
    title: '餐厅里的海龟汤',
    surface: '一个男人走进餐厅，点了一碗海龟汤，喝了一口后自杀了。为什么？',
    truth:
      '男人曾在海难中幸存。当时同伴骗他说吃的是海龟肉，实际上他吃下的是已经死去妻子的肉。多年后他在餐厅喝到真正的海龟汤，意识到当年的肉不是海龟肉，于是崩溃自杀。',
    difficulty: 'medium',
    tags: ['餐桌谜案', '深海求生', '身体代价'],
    summary: '经典海龟汤题型，适合体验层层反转的推理过程。',
    source: {
      platform: 'YesNoPuzzle',
      authorName: 'Unknown Author',
      originalUrl:
        'https://www.yesnopuzzle.com/en/blog/origins-turtle-soup-puzzle',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 Turtle Soup/Albatross Soup 类题型版本众多；本站保留海龟汤中文改写版本。',
    },
  },
  {
    id: 'elevator-rainy-day',
    title: '雨天才到家的男人',
    surface:
      '一个男人住在高楼。晴天时，他只能坐电梯到中间楼层再走楼梯回家；雨天时，他却可以直接坐电梯到家。为什么？',
    truth:
      '男人个子很矮，晴天时够不到自己所在楼层的电梯按钮，只能按到较低楼层再走楼梯。雨天时他带着伞，可以用伞尖按到更高的按钮，所以能直接到家。',
    difficulty: 'easy',
    tags: ['日常怪谈', '时间错觉', '文字陷阱'],
    summary: '轻量逻辑题，适合新玩家熟悉问法。',
    source: {
      platform: 'Puzzle Fry',
      authorName: 'ravi / John123',
      originalUrl: 'https://puzzlefry.com/puzzles/the-man-in-the-elevator/',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 The Man in the Elevator 横向思维题中文改写版。',
    },
  },
  {
    id: 'melting-snowman',
    title: '草地上的煤块、胡萝卜和围巾',
    surface:
      '晴天的草地上有几块煤、一根胡萝卜和一条围巾。没有人把它们放在那里。为什么？',
    truth:
      '这些东西原本是雪人的装饰：煤块做眼睛或纽扣，胡萝卜做鼻子，围巾围在雪人身上。天气变暖后雪人融化，只留下这些物品在草地上。',
    difficulty: 'easy',
    tags: ['童话黑箱', '荒野遗物', '时间错觉'],
    summary: '适合新手练习“状态变化”和时间线假设。',
    source: {
      platform: 'Puzzle Fry',
      authorName: 'ravi / John123',
      originalUrl: 'https://puzzlefry.com/puzzles/the-coal-carrot-and-scarf/',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 The Coal, Carrot and Scarf 横向思维题中文改写版。',
    },
  },
  {
    id: 'unopened-package',
    title: '田野里的未打开包裹',
    surface:
      '一个男人死在田野中央，旁边有一个没有打开的包裹。田野里没有其他人或动物。男人是怎么死的？',
    truth:
      '男人从飞机上跳伞，但降落伞没有打开。所谓“没有打开的包裹”就是他的降落伞包；他落向田野时已经知道自己会摔死。',
    difficulty: 'medium',
    tags: ['荒野遗物', '身体代价', '文字陷阱'],
    summary: '需要跳出平面场景，从空中运动和物品含义入手。',
    source: {
      platform: 'Puzzle Fry',
      authorName: 'ravi / John123',
      originalUrl: 'https://puzzlefry.com/puzzles/death-in-a-field/',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 Death in a Field / Unopened Package 横向思维题中文改写版。',
    },
  },
  {
    id: 'puddle-of-water',
    title: '空房间里的一摊水',
    surface:
      '一个男人被发现吊死在没有窗户的空房间里，门从里面锁着。房间里除了他和地上的一摊水，几乎什么也没有。他是怎么做到的？',
    truth:
      '男人站在一大块冰上把自己吊起来。之后冰逐渐融化，留下地上的一摊水，所以房间看起来没有可供他站立的东西。',
    difficulty: 'medium',
    tags: ['血色密室', '时间错觉', '文字陷阱'],
    summary: '经典密室式海龟汤，关键在于物体会随时间改变状态。',
    source: {
      platform: 'Puzzle Prime',
      authorName: 'Unknown Author',
      originalUrl:
        'https://www.puzzleprime.com/puzzles/brain-teasers/lateral/puddle-of-water/',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 Puddle of Water 横向思维题中文改写版；来源页标注作者未知。',
    },
  },
  {
    id: 'bar-water-gun',
    title: '酒吧里的水和枪',
    surface:
      '一个男人走进酒吧，向酒保要一杯水。酒保没有给水，而是拿出一把枪指着他。男人却说了声谢谢，然后离开。为什么？',
    truth:
      '男人打嗝，想靠喝水止住。酒保听出来后用枪吓了他一下，惊吓让打嗝停止了，所以男人不再需要水，并真心感谢酒保。',
    difficulty: 'easy',
    tags: ['日常怪谈', '餐桌谜案', '文字陷阱'],
    summary: '最常见的横向思维入门题之一，适合练习“异常行为背后的正常目的”。',
    source: {
      platform: 'Puzzle Fry',
      authorName: 'ravi / John123',
      originalUrl: 'https://puzzlefry.com/puzzles/the-man-in-the-bar/',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 The Man in the Bar / Glass of Water 横向思维题中文改写版；Psychology Today、Math Is Fun 等站点亦收录相近版本。',
    },
  },
  {
    id: 'anthony-cleopatra-fish',
    title: '安东尼和克莉奥佩特拉之死',
    surface:
      '安东尼和克莉奥佩特拉被发现死在房间地板上，旁边有碎玻璃和一摊水。两者身上没有伤口，也没有中毒。发生了什么？',
    truth:
      '安东尼和克莉奥佩特拉其实是两条金鱼。鱼缸被打碎后，水流到地上，它们离开水后死亡；名字只是误导玩家以为他们是人。',
    difficulty: 'easy',
    tags: ['人偶误认', '血色密室', '文字陷阱'],
    summary: '利用姓名误导身份，是非常典型的海龟汤式假设陷阱。',
    source: {
      platform: 'Wikibooks',
      authorName: 'Puzzles/Lateral puzzles contributors',
      originalUrl: 'https://en.wikibooks.org/wiki/Puzzles/Lateral_puzzles/2',
      license: 'CC BY-SA 署名-相同方式共享，本站中文改写',
      collectedAt: '2026-05-04',
      note: '经典 Anthony and Cleopatra 横向思维题中文改写版；YesNoGame 罗马尼亚语页面亦收录金鱼版本。',
    },
  },
  {
    id: 'arm-in-the-parcel',
    title: '邮包里的手臂',
    surface:
      '一个男人收到邮包，里面仔细包着一条人类手臂。他检查后重新包好，寄给另一个男人。第二个男人也检查了它，然后把它带到树林里埋掉。为什么？',
    truth:
      '多年前三个人被困荒岛，濒临饿死时约定每人都切下一条左臂作为食物。其中一人是医生，先切下另外两人的手臂；获救后，为履行誓言，他后来也切下自己的手臂寄给二人确认。第二个男人确认誓言完成后将手臂埋葬。',
    difficulty: 'hard',
    tags: ['身体代价', '绝境誓言', '深海求生'],
    summary: '高难经典题，适合长轮次提问，关键在荒岛求生、誓言和邮寄对象关系。',
    source: {
      platform: 'Puzzle Fry',
      authorName: 'JamesBond / John123',
      originalUrl:
        'https://puzzlefry.com/puzzles/the-arm-of-the-postal-service/',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 The Arm of the Postal Service / The Arm in the Parcel 横向思维题中文改写版；YesNoGame 按受欢迎度和复杂度收录。',
    },
  },
  {
    id: 'monopoly-hotel-bankrupt',
    title: '推车到旅馆后破产',
    surface:
      '一个男人推着自己的车前进。到了旅馆前，他立刻宣布自己破产。为什么？',
    truth:
      '他不是在现实中推汽车，而是在玩《大富翁》一类棋盘游戏。他移动的是汽车形棋子，落到带旅馆的地产格上，需要支付高额租金，因此破产。',
    difficulty: 'easy',
    tags: ['游戏陷阱', '文字陷阱', '日常怪谈'],
    summary: '通过改变语境解释“车”和“旅馆”，适合练习词义切换。',
    source: {
      platform: 'Puzzle Fry',
      authorName: 'SherlockHolmes / dyj',
      originalUrl:
        'https://puzzlefry.com/puzzles/man-pushes-car-stops-front-hotel-puzzle/',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 Monopoly Hotel Bankruptcy 横向思维题中文改写版；Riddles.com、Michael Muxworthy 等站点亦收录相近版本。',
    },
  },
  {
    id: 'not-twins-triplets',
    title: '同日同刻出生却不是双胞胎',
    surface:
      '两个孩子有同一个母亲和父亲，出生日期、年份甚至出生时间都一样，长得也很像。但他们诚实地说自己不是双胞胎。为什么？',
    truth:
      '他们不是双胞胎，而是三胞胎或更多胞胎中的两个。两个人同日同刻出生并不必然只能是双胞胎。',
    difficulty: 'easy',
    tags: ['医院诡事', '文字陷阱', '日常怪谈'],
    summary: '轻量谜题，关键在于不要把“两个人”自动等同于“双胞胎”。',
    source: {
      platform: 'Puzzle Prime',
      authorName: 'Unknown Author',
      originalUrl:
        'https://www.puzzleprime.com/puzzles/brain-teasers/lateral/not-twins/',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 Not Twins 横向思维题中文改写版；Puzzle Fry 也收录相近的面试版本。',
    },
  },
  {
    id: 'adam-eve-no-navels',
    title: '天堂里认出亚当和夏娃',
    surface:
      '一个人死后来到天堂，看见那里有无数年轻男女。他从未见过亚当和夏娃，却立刻认出了他们。为什么？',
    truth:
      '亚当和夏娃不是由母亲分娩出生的，因此没有脐带，也就没有肚脐。天堂里其他人都有肚脐，他据此认出了他们。',
    difficulty: 'easy',
    tags: ['童话黑箱', '身体代价', '文字陷阱'],
    summary: '经典观察型横向思维题，关键在生理特征和传说设定。',
    source: {
      platform: 'IcebreakerIdeas',
      authorName: 'Susan Box Mann',
      originalUrl: 'https://icebreakerideas.com/lateral-thinking-puzzles/',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 Adam and Eve in Heaven 横向思维题中文改写版；Baamboozle 等课堂游戏平台亦收录。',
    },
  },
  {
    id: 'black-clothes-black-car',
    title: '黑衣人与黑车',
    surface:
      '一个男人全身穿黑，走在没有路灯的小路上。一辆没有开灯的黑色汽车向他驶来，却及时停下，没有撞到他。司机是怎么看到他的？',
    truth:
      '事情发生在白天。虽然男人、汽车和道路条件都让人联想到夜晚，但题目从未说当时是晚上。',
    difficulty: 'easy',
    tags: ['雨夜车祸', '时间错觉', '日常怪谈'],
    summary: '典型的默认假设陷阱，答案依赖题目没有明说的时间条件。',
    source: {
      platform: 'CSUN Science Ref',
      authorName: 'Unknown',
      originalUrl:
        'https://www.csun.edu/science/ref/questions/lateral_thinking/index.htm',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 Black Clothes / Black Car 横向思维题中文改写版；来源页标注 Classic Lateral Thinking Exercises，作者未知。',
    },
  },
]

export function getStoryById(id: string): Story | undefined {
  return stories.find((story) => story.id === id)
}
