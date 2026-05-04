import type { Story } from "../types/story";

export const stories: Story[] = [
  {
    id: "restaurant-turtle-soup",
    title: "餐厅里的海龟汤",
    surface: "一个男人走进餐厅，点了一碗海龟汤，喝了一口后自杀了。为什么？",
    truth:
      "男人曾在海难中幸存。当时同伴骗他说吃的是海龟肉，实际上他吃下的是已经死去妻子的肉。多年后他在餐厅喝到真正的海龟汤，意识到当年的肉不是海龟肉，于是崩溃自杀。",
    difficulty: "medium",
    tags: ["经典", "悬疑", "反转"],
    summary: "经典海龟汤题型，适合体验层层反转的推理过程。",
    source: {
      platform: "民间流传",
      authorName: "来源未知",
      license: "未知",
      collectedAt: "2026-05-04",
      note: "经典题目版本众多，如有明确来源可替换为原出处。",
    },
  },
  {
    id: "elevator-rainy-day",
    title: "雨天才到家的男人",
    surface:
      "一个男人住在高楼。晴天时，他只能坐电梯到中间楼层再走楼梯回家；雨天时，他却可以直接坐电梯到家。为什么？",
    truth:
      "男人个子很矮，晴天时够不到自己所在楼层的电梯按钮，只能按到较低楼层再走楼梯。雨天时他带着伞，可以用伞尖按到更高的按钮，所以能直接到家。",
    difficulty: "easy",
    tags: ["日常", "逻辑", "经典"],
    summary: "轻量逻辑题，适合新玩家熟悉问法。",
    source: {
      platform: "民间流传",
      authorName: "来源未知",
      license: "未知",
      collectedAt: "2026-05-04",
      note: "经典谜题改写版。",
    },
  },
  {
    id: "silent-phone-call",
    title: "沉默的电话",
    surface: "女人接到一通电话，对方一句话也没说。她听了几秒后，立刻报警。为什么？",
    truth:
      "女人是接线员或相关值班人员，她知道某个求助者被威胁时不能说话，只能拨通电话并保持沉默。电话中的背景声或约定方式让她判断对方正处于危险中，于是报警。",
    difficulty: "hard",
    tags: ["推理", "危险", "开放式"],
    summary: "需要围绕职业、约定和环境线索提问。",
    source: {
      platform: "本站",
      authorName: "站点维护者",
      license: "原创示例",
      collectedAt: "2026-05-04",
      note: "用于演示题库结构，可替换为真实题目。",
    },
  },
];

export function getStoryById(id: string): Story | undefined {
  return stories.find((story) => story.id === id);
}
