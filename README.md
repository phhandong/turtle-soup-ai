# 海龟汤问答

一个在线海龟汤推理游戏网站。

## 玩法说明

1. 在首页选择一道题目。
2. 阅读汤面后，输入你的问题并发送。
3. 根据回答继续追问，逐步接近真相。
4. 需要时可开启提示模式。
5. 想揭晓答案时，点击“查看汤底”。

## 页面功能

- 题目标签筛选
- 问答记录展示
- 题目来源信息
- 复制当前题目链接
- 一键重开当前题目

## 本地运行

```bash
npm install
npm run dev
```

后台启动本地服务：

```bash
npm run dev:start
```

停止后台本地服务：

```bash
npm run dev:stop
```

## 构建

```bash
npm run build
```

## Cloudflare Worker API key

Worker 会从 Cloudflare 环境变量读取模型 API key。Unity2 通道使用：

```bash
cd api-proxy
npx wrangler secret put UNITY_API_KEY
```

`api-proxy/wrangler.toml` 已配置：

- `UNITY_BASE_URL=https://api.unity2.ai`
- `UNITY_MODEL=claude-opus-4-8`
