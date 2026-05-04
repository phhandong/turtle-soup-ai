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

复制 `.env.example` 为 `.env.local`，配置你的 API 地址：

```bash
VITE_AI_API_URL=https://your-api.example.com/ask
```

前端不会保存大模型 API Key。请在你的 API 网关或 Serverless 函数中保存密钥。
