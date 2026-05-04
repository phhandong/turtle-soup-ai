# 海龟汤 AI

一个可以部署到 GitHub Pages 的海龟汤 AI 问答网站。

核心设定：

- 玩家选择题目后查看汤面。
- AI 知道汤面和汤底。
- 每次提问都是单轮请求，不携带历史问答。
- 默认只返回“是 / 不是 / 是也不是 / 无关”。
- 用户开启提示模式后，AI 才可以额外返回一句提示。

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## API 配置

复制 `.env.example` 为 `.env.local`，只填你的 API 网关地址：

```bash
VITE_AI_API_URL=
```

前端不会保存大模型 API Key。请在你的 API 网关或 Serverless 函数中保存密钥。

## MiMo API 接入

你提供的 MiMo Base URL 兼容 OpenAI API 协议：

```text
https://token-plan-cn.xiaomimimo.com/v1
```

不要把 Dedicated API Key 写进前端或 `.env.local`。GitHub Pages 是静态站点，前端环境变量会被打包进公开代码。

推荐做法：

1. 进入 `api-proxy`，复制 `.dev.vars.example` 为 `.dev.vars`，只填写：
   - `MIMO_API_KEY=你的 Dedicated API Key`
   - `MIMO_MODEL` 默认已配好，可按需改
2. 使用 `wrangler` 部署 `api-proxy/cloudflare-worker.js`。
3. Worker 部署后，把 Worker URL 写进本地 `.env.local`：

```bash
VITE_AI_API_URL=https://your-worker.your-subdomain.workers.dev
```

前端每次请求只会发送当前题目的 `storyId`、`surface`、`truth`、`question`、`hintEnabled`，不会发送历史问答。
