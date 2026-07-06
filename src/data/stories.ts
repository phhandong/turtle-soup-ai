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
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '这碗汤不是起点。',
        '味道连接一段旧事。',
        '关键在旧说法真假。',
      ],
    },
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
    hints: {
      questionLimit: 30,
      hintCost: 10,
      items: [
        '问题不在电梯坏了。',
        '注意他能碰到什么。',
        '雨具改变了触及范围。',
      ],
    },
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
    hints: {
      questionLimit: 30,
      hintCost: 10,
      items: [
        '别只看当前天气。',
        '这些东西曾属于整体。',
        '关键是形态改变。',
      ],
    },
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
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '田野不是起点。',
        '包裹未必是邮包。',
        '从高处想这个场景。',
      ],
    },
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
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '别默认房间一直如此。',
        '那摊水曾有用途。',
        '关键物体会消失。',
      ],
    },
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
    hints: {
      questionLimit: 30,
      hintCost: 10,
      items: [
        '酒保不是想伤人。',
        '男人要水有别的目的。',
        '惊吓解决了症状。',
      ],
    },
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
    hints: {
      questionLimit: 30,
      hintCost: 10,
      items: [
        '先别默认他们是人。',
        '名字在制造错觉。',
        '水和玻璃更重要。',
      ],
    },
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
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '邮包是承诺的一部分。',
        '检查是在确认身份。',
        '关键发生在绝境之后。',
      ],
    },
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
    hints: {
      questionLimit: 30,
      hintCost: 10,
      items: [
        '车不一定能上路。',
        '旅馆也许是规则。',
        '破产发生在游戏里。',
      ],
    },
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
    hints: {
      questionLimit: 30,
      hintCost: 10,
      items: [
        '两个人不是全部。',
        '诚实不代表矛盾。',
        '考虑更大的出生组合。',
      ],
    },
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
    hints: {
      questionLimit: 30,
      hintCost: 10,
      items: [
        '识别靠身体细节。',
        '他们的来源很特殊。',
        '注意出生方式差异。',
      ],
    },
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
    hints: {
      questionLimit: 30,
      hintCost: 10,
      items: [
        '别急着设定光线。',
        '关键在发生时段。',
        '黑色不等于看不见。',
      ],
    },
    tags: ['雨夜车祸', '时间错觉', '日常怪谈'],
    summary: '典型的默认假设陷阱，答案依赖题目没有明说的时间条件。',
    source: {
      platform: 'CSUN Science Ref',
      authorName: 'Unknown Author',
      originalUrl:
        'https://www.csun.edu/science/ref/questions/lateral_thinking/index.htm',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-05-04',
      note: '经典 Black Clothes / Black Car 横向思维题中文改写版；来源页标注 Classic Lateral Thinking Exercises，作者未知。',
    },
  },
  {
    id: 'rental-room-ceiling',
    title: '出租房',
    surface:
      '我搬进一间便宜的新房，天花板里常有类似老鼠爬动的声音。后来房东交了女朋友，声音突然消失，安静反而让我再也睡不安稳。为什么？',
    truth:
      '我早就知道房东在天花板上偷窥我，但被注视会给我安全感，所以我一直默许。房东交女朋友后不再偷窥，天花板安静下来，我反而失眠。后来我趁房东来修电路时杀了他，把他藏进天花板里。透过那个小洞，我假装他仍在看着我，于是又能安心入睡。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '声音带来的是安心。',
        '房东的变化很关键。',
        '天花板后来仍有意义。',
      ],
    },
    tags: ['血色密室', '日常怪谈', '陌生来客'],
    summary: '日常租房场景下的反向安全感谜题，适合从异常心理和声音来源入手。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'living-exhibits-newlyweds',
    title: '新人',
    surface:
      '一对新人被立在展台上，台下众人笑开了颜。他们近在咫尺，却无法相拥，旁人看了又忍不住落泪。发生了什么？',
    truth:
      '故事发生在流行畸形展览的年代。这对出国蜜月的新婚夫妻被人残忍切去四肢，分别装进两个花瓶里，作为“新鲜出炉”的人彘展出。他们的头相隔很近，却永远无法拥抱，甚至可能被不同买家拍走，从此再也见不到彼此。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '展台不是婚礼现场。',
        '近在咫尺也可能无能为力。',
        '身体状态被刻意改变。',
      ],
    },
    tags: ['身体代价', '人偶误认', '血色密室'],
    summary: '看似婚礼喜庆的画面，实际需要重新理解“新人”和“立台”的含义。',
    source: {
      platform: '知乎',
      authorName: '帅到逆天的大帅哥',
      originalUrl: 'https://zhuanlan.zhihu.com/p/1922286890003969721',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的知乎文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'christmas-ward-patient',
    title: '平安夜',
    surface:
      '我常年住在病房里。平安夜那天，爸爸妈妈接我回家，妈妈照顾我，爸爸做了火鸡和烤肉。护工来接我回去时和妈妈扭打起来，最后我吃饱后在温暖中睡去，第二天幸福地死了。为什么？',
    truth:
      '我患有严重精神分裂。那天我其实从医院跑到雪地里的公园，护工追了出来。我的保护性人格“妈妈”杀死护工，并从他身上找到打火机；随后我又分裂出“爸爸”，在雪地里把护工当作“火鸡”，把自己的胳膊当作“烤肉”。我吃完后在雪地里睡着，最终冻死。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '家的场景未必真实。',
        '人物称呼需要重看。',
        '食物来自可怕错认。',
      ],
    },
    tags: ['医院诡事', '时间错觉', '身体代价'],
    summary: '平安夜家庭团聚的表象下，隐藏着地点、人物和食物的多重错认。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'blind-man-dog',
    title: '盲人',
    surface:
      '我是一个盲人，最近家里像是进了贼。我先听到奇怪的舔舐声和咀嚼声，几天后又听到窗户被打开、有人扭打，随后舔舐声和咀嚼声再次响起。发生了什么？',
    truth:
      '我早已在家中意外摔倒并因失血过多死亡。几天后，导盲犬饿了，先舔地上的血充饥，后来开始啃食我的尸体。又过了一段时间，小偷从窗户翻进来，被已经吃过人肉的导盲犬袭击并吃掉，所以我“听到”的后续声音其实来自死后的叙述视角。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '叙述者状态要先判断。',
        '声音不是普通入室。',
        '后续感知并不正常。',
      ],
    },
    tags: ['血色密室', '陌生来客', '身体代价'],
    summary: '需要先判断叙述者状态，再解释家中连续出现的异常声音。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'perfect-underworld-painting',
    title: '最完美的作品',
    surface:
      '我是一个落魄画家，妻子陪我去乡下写生。车坏后，一个牵马的牧民把我们带到村里借宿。夜里妻子说又热又渴，出去后站在几口井中间，目光呆滞地跳进其中一口井。我害怕又兴奋，立刻把这一幕画了下来。为什么？',
    truth:
      '我痴迷画出完美作品。其实我们在山路上车祸坠崖并被烧死，只是起初没有意识到。牵马牧民是引路人，身后跟着牛头马面。妻子说热渴，是因为我们死于火中；她出去“喝水”其实是去喝孟婆汤。几口井象征六道轮回，她喝汤后目光呆滞并跳井投胎。我终于意识到这里是阴间，既恐惧又认为眼前景象是绝佳题材，于是画下这一幕。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '村子不像普通村子。',
        '热和渴指向来处。',
        '那几口井不是水井。',
      ],
    },
    tags: ['童话黑箱', '时间错觉', '雨夜车祸'],
    summary: '写生旅途中的异常村落谜题，关键在于重新判断人物是否还活着。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'human-train-carriage',
    title: '火车',
    surface:
      '这是一辆正在行驶的火车。我刚上车不久，坐在最后一节车厢里，车厢里流了很多血。我知道自己快活不久了。为什么？',
    truth:
      '所谓火车并不是真正的列车，而是一条由人通过手术首尾衔接组成的“人形火车”。我是刚被接到最后的“车厢”，但衔接手术失败，我流了很多血，还听见别人说这节车厢接失败了，准备换掉。于是我意识到自己很快就会死。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '车厢未必是物件。',
        '火车可以是比喻。',
        '失败的是连接方式。',
      ],
    },
    tags: ['身体代价', '文字陷阱', '人偶误认'],
    summary: '题目把“火车”和“车厢”换成了另一种含义，需要突破字面场景。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'slaughterhouse-santa',
    title: '圣诞老人',
    surface:
      '圣诞节到了，我又去完成孩子们的梦想。第一个孩子想唱歌，他做到了；第二个孩子想旅行，我送他环游世界；第三个孩子喜欢躲猫猫，我帮他藏到连警察都找不到，明年他自己就会出现。为什么？',
    truth:
      '我是患有精神疾病的肉联厂工人，常年穿着血红色衣服，把自己幻想成圣诞老人。第一个孩子是哑巴，我把他的皮做成鼓敲响，让他“唱歌”。第二个孩子想环球旅行，我把他搅碎做成罐头发往世界各地。第三个孩子喜欢躲猫猫，我把他做成雪人，警察暂时找不到，等春天雪化后尸体就会出现。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '愿望被字面实现。',
        '红衣身份不必温柔。',
        '藏起来会随季节暴露。',
      ],
    },
    tags: ['童话黑箱', '身体代价', '血色密室'],
    summary: '童话式愿望清单被逐条扭曲成恐怖现实，适合从双关愿望入手。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'parasite-pregnancy',
    title: '怀孕',
    surface:
      '爱人怀孕好几个月了，我听着孩子的胎动兴奋不已。虽然爱人一天天消瘦，但他现在应该能理解我了。为什么？',
    truth:
      '叙述者曾怀孕，却因为爱人背叛而在悲痛中失去孩子。她为了报复，让对方体验“怀孕”的痛苦，偷偷喂他大量蛔虫卵，并把他绑在床上持续提供虫子所需的养分。他肚子隆起并出现“胎动”，其实是寄生虫在体内繁殖，身体也因此逐渐消瘦。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '胎动不一定来自孩子。',
        '爱人正在被报复。',
        '身体里的东西在增多。',
      ],
    },
    tags: ['医院诡事', '身体代价', '绝境誓言'],
    summary: '围绕“怀孕”和“胎动”的身体错认谜题，真相带有强烈报复色彩。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'medical-school-promise',
    title: '男孩的承诺',
    surface:
      '女孩给男孩提了一个条件，只要男孩做到就做他的女朋友。后来男孩真的做到了，女孩却疯了。为什么？',
    truth:
      '女孩和男孩约定考进同一所医学院，但男孩成绩很差。为了“进入”那所医学院并证明自己爱她，男孩自杀并把遗体捐给医学院做解剖实验。女孩上解剖课时看到了男孩的头颅，受到巨大刺激后疯了。',
    difficulty: 'medium',
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '承诺被极端履行。',
        '进入不一定指入学。',
        '课堂上看见了证明。',
      ],
    },
    tags: ['医院诡事', '绝境誓言', '文字陷阱'],
    summary: '围绕“做到约定”的极端解释展开，适合从承诺的字面含义推理。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'candle-ghost-rule',
    title: '吹蜡烛',
    surface:
      '我家闹鬼，请来的大师留下三条保命规则：驱邪蜡烛不能吹灭；任何人喊我名字都不能回应；以后晚上不能关灯。那晚我平安度过，却在几个月后死了。为什么？',
    truth:
      '大师的方法本来有效，但那晚我接到电话，鬼在电话里叫了我的名字，我下意识回应，触犯第二条规则并陷入幻觉。我误以为自己平安过夜，并一直不敢在夜里关灯。几个月后生日宴是白天，我放松警惕关灯吹蜡烛；睁眼后才发现自己回到了闹鬼那晚，关掉的是房间灯，吹灭的是大师点燃的驱邪蜡烛，鬼已经来到面前。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '规则曾被误触发。',
        '平安夜可能是假象。',
        '生日动作重合了禁忌。',
      ],
    },
    tags: ['童话黑箱', '时间错觉', '文字陷阱'],
    summary: '规则怪谈式海龟汤，需要追踪规则触发、幻觉和时间回返。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'voyeur-across-window',
    title: '偷窥',
    surface:
      '小区新来一个女孩，我一直在偷窥她。今天她突然藏了起来，好像发现了我，尖叫后跑回屋里。随后她家传来一声怒吼：“我要杀了你！”发生了什么？',
    truth:
      '女孩是男主人的情人。女主人出差时，男主人把她带回家，没想到女主人提前回来，女孩只好赤身藏在窗帘后。她躲藏时向外张望，无意中看见对楼上吊自杀的“我”的尸体，惊叫着跑回房间，因此被女主人发现。女主人的怒吼是对情人说的，不是对偷窥者说的。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '尖叫不是因为偷窥。',
        '女孩也在向外看。',
        '怒吼指向屋里的人。',
      ],
    },
    tags: ['血色密室', '陌生来客', '人偶误认'],
    summary: '偷窥视角制造误导，重点在于判断尖叫和怒吼分别指向谁。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'xiaoleiyin-trapped-brother',
    title: '被困的大哥',
    surface:
      '三兄弟和别人打架，大哥被关了起来。三弟手足无措，二哥叫来一群社会上的朋友救出大哥。随后他们又和对面打起来，直到对面的大哥来了，双方才和解。到底是什么故事？',
    truth:
      '这是《西游记》小雷音寺一难的现代化误述。大哥是孙悟空，被黄眉大王困在金铙中；三弟是沙僧，吓得手足无措；二哥是猪八戒，上天庭请来二十八星宿帮忙。亢金龙钻孔救出孙悟空后，孙悟空又与黄眉大王大战，最后“对面的大哥”弥勒佛赶到，制服黄眉大王，师徒继续西行。',
    difficulty: 'medium',
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '现代说法藏着古故事。',
        '兄弟身份要换套语境。',
        '对面大哥能收场。',
      ],
    },
    tags: ['童话黑箱', '文字陷阱', '游戏陷阱'],
    summary: '把神魔故事包装成街头冲突，需要识别角色对应关系。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'blind-masseur-alibi',
    title: '按摩师',
    surface:
      '我是按摩师，今天去客户家按摩。客户很健谈，按摩时手却总是“不老实”。屋里饭香四溢，浴室有逐渐变小的水流声，另一个房间还传来阴森的“妈妈”声。第二天新闻说他们一家三口都死了。发生了什么？',
    truth:
      '我是盲人按摩师。客户一家早被食人魔杀害，凶手发现我是盲人后，将计就计让我给男主人的尸体按摩，并假装成男主人和我聊天。尸体刚死不久，神经抽动让我误以为他手不老实。锅里炖的是孩子，浴室水声是妻子被吊起来放血，另一个房间的“妈妈”声是鹦鹉在叫。我无意中在杀人现场帮凶手制造了不在场证明。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '按摩师少了一种判断。',
        '触感会误导活死。',
        '他被用来制造证明。',
      ],
    },
    tags: ['血色密室', '餐桌谜案', '身体代价'],
    summary: '盲人视角下的犯罪现场谜题，需要把气味、声音和触感重新解释。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'adopted-sister-secret',
    title: '妹妹的秘密',
    surface:
      '只有妹妹陪我过十岁生日。妈妈还躺着，却胖了许多；爸爸一脸惊恐地看着“爸爸”。妹妹摸着我的脸说：“等你成年了就要娶我哦。”为什么？',
    truth:
      '所谓妹妹其实是患有侏儒症的成年女人，她伪装成八九岁的孩子被一对夫妇收养。她爱上了与自己实际同龄的“爸爸”，趁爸爸出差时把“妈妈”淹死在浴缸里。后来爸爸发现她的秘密，想杀她为妻子报仇，她用鱼线机关割掉了爸爸的头。她看到“哥哥”后产生畸形想法：等他成年后也许会长得像爸爸，可以成为替代品。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '称谓和年龄不匹配。',
        '另一个爸爸不是父亲。',
        '妹妹想要替代品。',
      ],
    },
    tags: ['人偶误认', '血色密室', '日常怪谈'],
    summary: '家庭称谓制造错位，关键在于判断“妹妹”的真实年龄和身份。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'brain-swap-village',
    title: '村庄',
    surface:
      '男孩第一次去女朋友家拜访，村里人都用异样眼光看着他。他在女友家住了一夜，第二天醒来发现女朋友的父亲死了，而自己成了女友的老公。为什么？',
    truth:
      '这个村子有换脑秘术，能把年老者的大脑换进年轻人的身体里。女朋友其实是一个活了上千年的老妇人，近期刚换进年轻女孩身体；她所谓的“父亲”其实是她丈夫，也需要更换身体。她把男孩骗进村，当晚完成换脑手术，让丈夫占据男孩的身体。村民异样的目光，是一群同样活了很久的人在渴望年轻身体。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '村民在看他的身体。',
        '年龄不等于外貌。',
        '丈夫换了载体。',
      ],
    },
    tags: ['人偶误认', '医院诡事', '童话黑箱'],
    summary: '拜访女友家的普通开场，背后是身份、年龄和身体归属的整体反转。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'mermaid-reservoir',
    title: '美人鱼',
    surface:
      '小美人鱼生活在自己的宫殿里。一天，人类王子落入水中，被一条粉色水蛇咬死。宫殿里没有别的食物，她只好把水蛇和王子都吃掉。后来她肚子越来越大，最后被撑死在水面上，水面浮起红花。为什么？',
    truth:
      '男人发现妻子出轨并怀上情夫的孩子，怒而把妻子的双腿缝在一起，丢进深蓄水池，看起来像一条“不会劈腿”的人鱼。随后他杀死情夫也丢进去，情夫裸露的肠子看起来像粉色水蛇。池中没有食物，妻子吃掉情夫尸体求生，但因双腿被缝无法生产，最终难产死去，血浮在水面上。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '童话称呼要还原现实。',
        '水蛇不是生物。',
        '宫殿是封闭水域。',
      ],
    },
    tags: ['童话黑箱', '身体代价', '血色密室'],
    summary: '童话意象被改写成现实惨案，需要逐一还原美人鱼、王子和水蛇。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'five-brothers-corpse-puzzle',
    title: '五兄弟',
    surface:
      '废弃教堂里刚发生惨案。高老爷子躺在棺中，他的五个儿子死在祭坛上，每具尸体都缺少不同部位。老三的儿子害怕地说，他们想复活爷爷，却召唤出恶魔杀了所有人。真相是什么？',
    truth:
      '高老大为了独占遗产，先杀死高老三的儿子并整容成他的样子，随后在高老爷子死后杀害几个兄弟。为了伪造自己也死亡、并制造恶魔分尸的假象，他把四具尸体切割平移，拼成看似五具尸体的现场。所谓五兄弟各缺不同部位，是因为身体部件被错位组合，现场那个“老三的儿子”其实就是高老大。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '尸体数量可能造假。',
        '缺失部位不是随机。',
        '目击者身份很可疑。',
      ],
    },
    tags: ['血色密室', '身体代价', '人偶误认'],
    summary: '祭坛分尸现场看似灵异，实际是用尸体错位制造人数假象。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'coffin-tapping-code',
    title: '奇怪的声音',
    surface:
      '之前的支教走了，我被派去山里支教，借宿在村长家。他家门口贴着奇怪黄纸，每晚都有有规律的沉闷咚咚声。我记下数字 96924482622454。三天后声音消失，我也明白那五个字是什么了。发生了什么？',
    truth:
      '村长两个未婚儿子死了，他想按封建习俗给他们配阴婚，便把前一位女支教绑来，和大儿子的尸体一起关进棺材。她手脚被捆、嘴被堵，只能用头撞棺材求救，并按手机九宫格数字敲出“我在棺材里”。三天后她死了，声音消失。随后村长又把刚来的我和二儿子的尸体关进另一口棺材。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '声音有固定信息。',
        '数字不是普通编号。',
        '黄纸指向旧俗。',
      ],
    },
    tags: ['荒野遗物', '文字陷阱', '绝境誓言'],
    summary: '山村夜声谜题，关键是把数字节奏解读成求救信息。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'elevator-opera-call',
    title: '唱戏的女人',
    surface:
      '这几天邻居总说晚上能听到女人唱戏，声音很凄惨。今晚我回家时也听到了，吓得跑回家。没多久，楼上传来凄厉惨叫，我终于知道那声音是什么了。为什么？',
    truth:
      '小区电梯维修时，一个女人玩手机没注意，从高处坠落，死在停在一楼的电梯轿厢顶上。电梯修好后，工人不知道尸体存在，正常运行电梯。她丈夫一直找不到她，晚上大家听见的“唱戏声”其实是他给妻子打电话时，手机铃声从电梯井里传来。那晚丈夫坐电梯时拨通电话，终于发现妻子尸体并惨叫。',
    difficulty: 'medium',
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '唱声来自设备。',
        '失踪者离大家很近。',
        '电梯运行暴露位置。',
      ],
    },
    tags: ['时间错觉', '日常怪谈', '血色密室'],
    summary: '夜晚怪声并非灵异，需要从电梯结构和手机铃声解释来源。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'cave-balloon-rescue',
    title: '气球',
    surface:
      '天好黑，还好爸爸带了蜡烛，哥哥带了食物，妈妈最伟大，用气球救了我。发生了什么？',
    truth:
      '一家四口露营时遇到山体塌方，被困在山洞里，其余家人当场死亡。为了撑到救援，叙述者把爸爸的脂肪制成尸蜡当“蜡烛”，吃哥哥的尸体充饥，并堵住妈妈尸体的各处排气口。夏天尸体腐败膨胀，像气球一样。听到地面上有救援动静后，叙述者刺破妈妈尸体，让气体和气味引起救援队注意，最终获救。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '家人带来的都变形了。',
        '气球不是玩具。',
        '气味成为求救信号。',
      ],
    },
    tags: ['荒野遗物', '身体代价', '绝境誓言'],
    summary: '求生语境下的黑暗童言谜题，每个家人“带来”的东西都另有所指。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'sister-grave-room',
    title: '妹妹的房间',
    surface:
      '妹妹的房间里传来许多球鞋摩擦地板的声音。房门虚掩着，我开门看了一眼，妹妹空洞的眼神正望着我。我急忙去叫保安，结果我死了。为什么？',
    truth:
      '这里的“房间”其实是妹妹的坟墓。妹妹头七时，我去扫墓，听到棺材里有运动鞋摩擦地板的声音，挖开后发现棺盖被人打开过，里面爬满老鼠，妹妹尸体被啃得面目全非。保安有恋尸癖，曾打开妹妹棺材作案后没盖好，老鼠才钻进去。保安担心我发现真相，便杀了我灭口。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '房间不在家里。',
        '鞋声来自封闭空间。',
        '保安害怕秘密暴露。',
      ],
    },
    tags: ['血色密室', '文字陷阱', '身体代价'],
    summary: '“房间”一词制造空间误导，关键在于判断声音真正来自哪里。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'snow-mountain-dormitory',
    title: '宿舍',
    surface:
      '天气很热，老大在宿舍门口吃冰棍，老三刚吃完饭，在远处探头看着我们。封寝后我准备睡觉，朦胧中听到老五一声惨叫。发生了什么？',
    truth:
      '这不是普通宿舍，而是一座诡异雪山上的帐篷。“我”是挑战雪山的登山客，发现帐篷外有两具自己的尸体：一具被山巅落下的冰锥贯穿喉咙，像在吃冰棍；另一具陷在雪流沙里，只露出头，嘴角有进食痕迹，说明曾吃掉另一个“我”。我逃不出这座雪山，最终失温死在帐篷里。弥留时听见新来的“老五”看到这些尸体后惨叫，循环又开始了。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '宿舍只是表层叫法。',
        '老大老三像前车之鉴。',
        '老五意味着循环继续。',
      ],
    },
    tags: ['荒野遗物', '时间错觉', '身体代价'],
    summary: '宿舍日常被映射到雪山循环，需要重解“老大老三老五”的身份。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'cannibal-secret-wife',
    title: '秘密',
    surface:
      '我最近胃肠感冒，一夜没睡，无意中发现了哥哥和嫂子的秘密。我大惊失色，于是杀死了妻子。为什么？',
    truth:
      '叙述关系被人格分裂混淆。真正的叙述者是男人的正常人格，他的另一人格有吃人癖，并和同样有吃人癖的女友在一起。女友为了接近他，假装自己也有双重人格。男人胃肠感冒呕吐时发现人的指甲，晚上假装切换成吃人癖人格，发现女友和另一人格吃人的秘密，也知道自己被欺骗，于是杀死了女友，也就是题面里的“妻子”。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '亲属称谓不可靠。',
        '胃病暴露了身体秘密。',
        '人格切换藏着试探。',
      ],
    },
    tags: ['人偶误认', '身体代价', '文字陷阱'],
    summary: '亲属称谓与人格切换交织，重点是理清叙述者真正身份。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'christmas-gift-knock',
    title: '圣诞礼物',
    surface:
      '爸爸让我早点睡。深夜我听到敲门声，推门去看，以为圣诞礼物准备好了：客厅有红色圣诞树，餐桌上有没填料的火鸡，绿色圣诞老人藏在壁炉里。这时门外又响起敲门声。为什么？',
    truth:
      '叙述者是红绿色盲。平安夜爸爸谎称加班，实际在家准备圣诞礼物；妈妈误以为爸爸不在，把陌生男人带回家。藏在家里的爸爸崩溃，杀死陌生男人，剥下他的皮扔进壁炉，所以“绿色圣诞老人”其实是尸体。爸爸掏空妈妈肚子摆在餐桌上，掏出的内脏挂在树上。最后爸爸在门外屋檐上吊自杀，风吹动尸体撞门，发出敲门声。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '颜色判断要小心。',
        '礼物都是现场错认。',
        '敲门声来自门外上方。',
      ],
    },
    tags: ['童话黑箱', '血色密室', '身体代价'],
    summary: '圣诞装饰逐一对应犯罪现场物品，需要注意叙述者的颜色感知。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'missing-nanny-water-tank',
    title: '保姆',
    surface:
      '保姆已经一周没来了，但我发现家里好像有人。因为害怕，我每天都觉得自己掉头发、口臭。几天后，警方发现了我和保姆的尸体。发生了什么？',
    truth:
      '我是梦游症患者，曾在梦游时杀死保姆，并把尸体扔进别墅水箱。尸体在水箱里腐烂，头发顺着水管流出，所以我洗头时以为自己掉头发；吃饭喝水用的也是被污染的水，所以觉得口臭。几天后我又在梦游中走到水箱旁，失足掉进去死了，警方最终发现两具尸体。',
    difficulty: 'medium',
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '异味来自日常入口。',
        '保姆并未离开太远。',
        '梦游解释了两次死亡。',
      ],
    },
    tags: ['日常怪谈', '血色密室', '时间错觉'],
    summary: '家中异味与掉发并非心理作用，需要从水源和梦游解释。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'time-loop-letter',
    title: '信',
    surface:
      '2000 年我出生，爷爷说以后会见到父母。2009 年爷爷被蒙面人杀死，临死前给我一封信，要我 27 岁生日打开。2023 年我怀孕，医生说我身体特殊，男友随后消失。2024 年孩子被偷。2027 年车祸手术后，男友又出现了。我打开信，终于知道父母是谁。真相是什么？',
    truth:
      '我出生时是双性人，后来因车祸手术彻底变成男性，并发现自己就是曾经消失的男友。信里说明我的人生会在特定时间点穿越，男友、爷爷、孩子其实都是不同时间的我。男性的我必须回到 2023 年与女性的自己相恋，让自己出生；又回到 2009 年杀死“爷爷”，保证年幼的自己被收养；再在 2024 年偷走刚出生的自己，带回 2000 年抚养长大。最后作为爷爷，在被蒙面的自己杀死前，把信交给年幼的自己，完成时间闭环。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '亲属关系要按时间重排。',
        '男友消失不是离开。',
        '每个关键人都可能同源。',
      ],
    },
    tags: ['时间错觉', '人偶误认', '医院诡事'],
    summary: '跨年份时间闭环谜题，需要把亲属、恋人和孩子全部重新对应。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'streamer-siblings-under-bed',
    title: '兄妹',
    surface:
      '我家楼上住着一对兄妹，哥哥开朗，妹妹沉默寡言却是知名主播。我每天看她直播，很喜欢她。终于有一天她注意到我了，我喊了四个字。从此她每天除了直播都会陪着我。为什么？',
    truth:
      '我是变态偷窥者，潜入女主播家藏在床底，每天偷看直播。其实直播的人一直是她的双胞胎哥哥：哥哥喜欢妹妹，把妹妹囚禁起来，并在生活和直播中扮演她。一天妹妹挣扎时被哥哥失手杀死，头垂到床下，正好和我对视。我吓得喊出“哎呀我艹”，被哥哥发现。哥哥杀了我，并把我和妹妹尸体埋在一起，所以“她”之后一直陪着我。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '直播身份先别相信。',
        '床底视角很关键。',
        '陪伴发生在死亡之后。',
      ],
    },
    tags: ['人偶误认', '血色密室', '日常怪谈'],
    summary: '直播、兄妹和床底视角共同误导，关键在于谁才是主播。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'pen-spirit-family-secret',
    title: '笔仙',
    surface:
      '三个人请笔仙。忧郁男人问：“她是不是不爱我了？”笔落在“是”上，他松了口气。华贵老妇问：“我是不是真的永远不会变老了？”笔也答“是”。美丽少妇问：“是不是有人知道我的秘密了？”笔答“是”，又自己写出：“你们知道，我是谁吗？”笔仙是谁？',
    truth:
      '三人是一家人：男人、妻子和丈母娘。妻子出轨怀了情人的孩子，偷偷打掉胎儿；男人也和同一个情人出轨，因情人疏远他而杀了情人；丈母娘听信吃婴儿能变年轻的谣言，发现妻子打胎后偷偷带走还有气息的胎儿并吃掉。笔仙就是那个胎儿。它回答老妇不会变老，是因为它已经准备杀死这几个最亲近的恶人。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '三个问题互相牵连。',
        '秘密都围绕同一关系。',
        '回答者来自被伤害者。',
      ],
    },
    tags: ['童话黑箱', '身体代价', '血色密室'],
    summary: '笔仙问答表面都在实现愿望，背后串起一家人的秘密和报复。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'last-human-jump',
    title: '跳楼的女人',
    surface:
      '女人对世界感到绝望，决定跳楼。没想到跳下去的瞬间电话响了，她立刻后悔，却已经来不及了。为什么？',
    truth:
      '丧尸病毒爆发后，女人身边的人都变成丧尸，她误以为自己是世界上仅存的人类，因此绝望跳楼。就在她跳下去的瞬间，电话响了，说明世界上还有其他幸存者正在联系她。她意识到自己并非孤身一人，却已经无法挽回。',
    difficulty: 'easy',
    hints: {
      questionLimit: 30,
      hintCost: 10,
      items: [
        '电话改变了她的判断。',
        '绝望源于错误孤立感。',
        '铃声代表仍有联系。',
      ],
    },
    tags: ['时间错觉', '日常怪谈', '文字陷阱'],
    summary: '末日背景下的瞬间反转，关键在电话铃声代表的生还信息。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'familiar-song-drinking',
    title: '歌声',
    surface:
      '男人和女人正在喝酒，突然听到熟悉的歌声。不久后，两个人都死了。为什么？',
    truth:
      '男人和女人是项羽与虞姬。项羽在帐中与虞姬饮酒时，听到包围他的军队唱起楚地民歌，意识到楚地已经沦陷，军心尽失。这就是“四面楚歌”。随后虞姬自刎，项羽突围到江边后也自刎而死。',
    difficulty: 'medium',
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '熟悉歌声不是娱乐。',
        '场景可能来自典故。',
        '歌声意味着大势已去。',
      ],
    },
    tags: ['文字陷阱', '时间错觉', '绝境誓言'],
    summary: '历史典故被压缩成日常饮酒场景，需要识别熟悉歌声的含义。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'ghost-classmate-exam',
    title: '期末考试',
    surface:
      '转学后的一个月里，所有同学都觉得我精神不正常并排挤我，只有老师似乎不这么想。期末考试成绩出来后，我才明白自己真的不正常。为什么？',
    truth:
      '我天生有阴阳眼却不知道。转学后，有个同桌一直对我很好，但其他同学看不到他，所以觉得我精神异常。老师刚来学校时听说过这个死去学生的传闻，也知道楼里有灵异事件，所以没有把我当普通精神病。期末成绩公布时，我发现榜单上没有同桌名字，结合大家的反应，终于明白自己能看见鬼。',
    difficulty: 'medium',
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '同桌存在感不一致。',
        '老师知道旧传闻。',
        '榜单缺少关键名字。',
      ],
    },
    tags: ['医院诡事', '日常怪谈', '人偶误认'],
    summary: '校园日常里的灵异错位，关键在于谁能看见同桌。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'magic-pasture-mother',
    title: '牧场',
    surface:
      '妈妈去世后留给我一座荒废牧场。第二天牧场里多了一只鸡，第三天多了一头牛，第四天多了一只羊。一个月后我明白了规律，于是做了一个疯狂决定。第二天牧场里出现一个年轻女人，我看到后疯了。为什么？',
    truth:
      '这座牧场有魔力：只要我前一晚吃下某种动物的肉，第二天牧场里就会出现那种动物。发现规律后，我想复活妈妈，于是吃下妈妈的骨灰。第二天牧场里出现的不是妈妈，而是一个和我长得一模一样的年轻女人。我这才明白，自己其实是妈妈曾经用同样方式制造出的复制人，她想以另一种形式延续生命。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '规律和吃有关。',
        '复活想法太字面。',
        '出现的人指向自身来源。',
      ],
    },
    tags: ['童话黑箱', '人偶误认', '时间错觉'],
    summary: '魔法牧场的规律看似简单，真正反转在于叙述者自身来源。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'child-in-wardrobe-parallel',
    title: '柜中的孩子',
    surface:
      '深夜，我家衣柜传来窸窣声。我打开柜门，里面有个孩子笑着说：“妈妈，你找到我啦。”我从几年前流产后就不能生育，也早已离婚，可他长得像我前夫，还说自己有个双胞胎弟弟，并叫出了我和前夫的名字。为什么？',
    truth:
      '八年前，地球轨迹偏移，两个平行世界短暂交错。一个孕妇腹中的胎儿被转移到平行世界同位体腹中：这个世界的她误以为流产并家庭破裂，另一个世界的她则以为生下双胞胎。八年后，某种力量开始校正偏移，让两个世界重新平行。哥哥被送回原本世界，于是出现在衣柜里；另一个世界的弟弟则逐渐失去哥哥存在过的痕迹，所有人都不再记得哥哥，只有他还残留记忆并被认为患有臆想症。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '孩子不是凭空出现。',
        '双胞胎记忆不对称。',
        '两个家庭曾短暂错位。',
      ],
    },
    tags: ['时间错觉', '童话黑箱', '人偶误认'],
    summary: '衣柜里的陌生孩子牵出平行世界错位，需要同时理解两个家庭的记忆差异。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'bell-farewell-heroes',
    title: '送别',
    surface:
      '明天有一个重要仪式，所以我睡得很早。午夜时，我朦胧中听到清脆的金属碰撞声，又听到一前一后两个脚步声。早上醒来，家门口围满人，地上有五具尸体。查明真相后，我把他们送到了该去的地方。发生了什么？',
    truth:
      '战争胜利后，有残余敌军临死反扑，小槐村遭袭。三名本已踏上归途的战士为保护村民牺牲，同时杀死敌人，所以地上共有五具尸体。村民想把三名英雄送去都城参加半个月后的告别仪式，但路途一千三百多公里，尸体无法久存。村里一对赶尸父子站出来，父亲摇铃，儿子用竹竿整理英骸，准备以赶尸方式连夜送他们去该去的地方。叙述者听到的金属声是赶尸铃，两个脚步声是一对父子。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '铃声属于送行方式。',
        '尸体数量分成两边。',
        '脚步声是一老一少。',
      ],
    },
    tags: ['绝境誓言', '荒野遗物', '童话黑箱'],
    summary: '战争 aftermath 与民俗送别结合，关键在于理解铃声和脚步声的身份。',
    source: {
      platform: '抖音',
      authorName: '许二木',
      originalUrl:
        'https://www.douyin.com/user/MS4wLjABAAAAKurkOY2XLWE80yoCF6NagcyeE-FneMrIYo8oc1vMMVU',
      license: '公开网页资料改写，原始版权归来源站点',
      collectedAt: '2026-06-28',
      note: '根据用户收集的许二木海龟汤文本整理改写为 AI 问答版本。',
    },
  },
  {
    id: 'cow-grazing-door',
    title: '牛吃草',
    surface:
      '深夜，小明被隔壁夫妻吵架声吵醒，随后听到摔东西、斧子劈砍和像牛吃草一样的声音。不久又有人敲门，但他太困没有理会。第二天警察说，邻居家的妻子死在小明门前。发生了什么？',
    truth:
      '隔壁夫妻争吵后，丈夫用斧头砍断妻子的舌头和四肢后逃走。妻子痛晕后醒来，无法正常呼救或行走，只能用嘴咬住草地上的草，一点点拖动身体爬向小明家门口，所以小明听到像牛吃草的声音。她最后用头撞门求救，但小明没有开门，她因失血过多死在门前。',
    difficulty: 'hard',
    hints: {
      questionLimit: 60,
      hintCost: 20,
      items: [
        '声音不是来自牲口。',
        '敲门也是求救。',
        '受害者失去正常方式。',
      ],
    },
    tags: ['日常怪谈', '身体代价', '血色密室'],
    summary: '邻里夜声谜题，需要把“牛吃草”和敲门声还原成人的求救。',
    source: {
      platform: 'User Provided',
      authorName: 'Unknown Author',
      license: '用户提供内容，待确认授权',
      collectedAt: '2026-06-28',
      note: '由用户提供原始题面与汤底，本站整理为 AI 问答版本。',
    },
  },
  {
    id: 'midnight-takeaway-intruder',
    title: '外卖',
    surface:
      '女子深夜独自在家点了一份外卖。外卖员敲门后说：“你好，你的外卖到了。”门口随即传来一句：“好的，谢谢。”关门声响起后，女子却惊恐万分。为什么？',
    truth:
      '女子独居，等外卖时睡着了。半夜她被敲门声吵醒，正准备下床取餐，却听见门口有人替她接过外卖并说了“谢谢”。她意识到家里除了自己还有另一个人，只能闭眼装睡。没过多久，那个人来到她身边，在她耳边低声说：“我知道你没睡着。”',
    difficulty: 'medium',
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '回应不是女子说的。',
        '门口有人代她取餐。',
        '危险已经在屋里。',
      ],
    },
    tags: ['陌生来客', '日常怪谈', '文字陷阱'],
    summary: '独居外卖场景的低成本惊悚题，关键在于门口那句回应是谁说的。',
    source: {
      platform: 'User Provided',
      authorName: 'Unknown Author',
      license: '用户提供内容，待确认授权',
      collectedAt: '2026-06-28',
      note: '由用户提供原始题面与汤底，本站整理为 AI 问答版本。',
    },
  },
  {
    id: 'three-brothers-bed',
    title: '三兄弟',
    surface:
      '我有两个哥哥，我们三兄弟从小睡在同一张床上。后来二哥生病死了，不久后我把大哥也杀了。为什么？',
    truth:
      '大哥和二哥是双胞胎，我们三兄弟感情很好，从小睡在同一张床。二哥死后，床的右边空了，我非常不习惯。于是我产生扭曲想法：把大哥砍成两半，一半放在左边，一半放在右边，就能恢复以前三个人一起睡的感觉。那晚我又睡得很香。',
    difficulty: 'medium',
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '床位空缺很重要。',
        '他追求原来的排列。',
        '大哥被分成位置。',
      ],
    },
    tags: ['身体代价', '日常怪谈', '血色密室'],
    summary: '家庭亲情题面下藏着畸形执念，关键是理解“床位空了”的影响。',
    source: {
      platform: 'User Provided',
      authorName: 'Unknown Author',
      license: '用户提供内容，待确认授权',
      collectedAt: '2026-06-28',
      note: '由用户提供原始题面与汤底，本站整理为 AI 问答版本。',
    },
  },
  {
    id: 'thunder-night-flash',
    title: '打闪',
    surface:
      '昨晚窗外一直在打闪，还有滴滴答答的雨声。第二天邻居死了，我的手机收到一条消息后，知道自己也离死不远了。为什么？',
    truth:
      '昨晚并没有打雷下雨。窗外的“闪光”其实是有人用闪光灯偷拍我；“雨声”是邻居被杀后血滴落的声音。第二天邻居死亡，我手机收到昨晚自己被偷拍的照片，说明凶手已经盯上了我，很可能下一个目标就是我。',
    difficulty: 'medium',
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '天气判断可能错了。',
        '闪光来自人为动作。',
        '消息证明她被盯上。',
      ],
    },
    tags: ['雨夜车祸', '日常怪谈', '时间错觉'],
    summary: '夜晚天气声响造成误导，真实线索来自闪光和滴答声的来源。',
    source: {
      platform: 'User Provided',
      authorName: 'Unknown Author',
      license: '用户提供内容，待确认授权',
      collectedAt: '2026-06-28',
      note: '由用户提供原始题面与汤底，本站整理为 AI 问答版本。',
    },
  },
  {
    id: 'restroom-cleaner-corpse',
    title: '清洁工',
    surface:
      '一名女子晚上进入昏暗公厕，看见里面还有一个人，便打了声招呼后匆忙进隔间。第二天警察因同一时间厕所发生杀人案找到她，质问她为什么当时没有报警。为什么她没发现异常？',
    truth:
      '凶手刚在厕所杀完人，听见有人进来，为了不暴露自己，伪装成正在拖地的清洁工。因为灯光昏暗，女子以为看到的是清洁工拖地；实际上凶手倒立着死者，用死者的头发在地上拖动，造成拖把拖地的假象。',
    difficulty: 'medium',
    hints: {
      questionLimit: 45,
      hintCost: 15,
      items: [
        '拖地画面要重看。',
        '昏暗掩盖了姿势。',
        '清洁工具不是工具。',
      ],
    },
    tags: ['血色密室', '日常怪谈', '人偶误认'],
    summary: '公厕目击谜题，重点在于重新理解“清洁工”和“拖地”的画面。',
    source: {
      platform: 'User Provided',
      authorName: 'Unknown Author',
      license: '用户提供内容，待确认授权',
      collectedAt: '2026-06-28',
      note: '由用户提供原始题面与汤底，本站整理为 AI 问答版本。',
    },
  },
]

export function getStoryById(id: string): Story | undefined {
  return stories.find((story) => story.id === id)
}
