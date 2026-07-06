# 海龟汤问答

一个在线海龟汤推理游戏网站。

## 玩法说明

1. 在首页选择一道题目。
2. 阅读汤面后，输入凯撒偏移量解锁 API。
3. 输入你的问题并发送。
4. 根据回答继续追问，逐步接近真相。
5. 需要时可开启提示模式。
6. 想揭晓答案时，点击“查看汤底”。

## 页面功能

- 题目标签筛选
- 问答记录展示
- 题目来源信息
- 复制当前题目链接
- 一键重开当前题目
- 本地保存 API 解锁偏移量

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

## 静态部署

`main` 分支用于 GitHub Pages，站点必须是纯静态产物。浏览器不再请求同域 `/api/ai`，也不依赖 Node 服务或 FC 中转；前端会在用户输入正确凯撒偏移量后，解出 API key 并直接请求 OpenAI-compatible 源站 `/chat/completions`。

构建：

```bash
npm run build
```

部署到 `gh-pages` 分支：

```bash
npm run deploy
```

GitHub Pages workflow 会读取以下 Actions Variables：

```text
VITE_AI_API_BASE_URL
VITE_ENCRYPTED_API_KEY
VITE_ENCRYPTED_API_KEYS
VITE_ENCRYPTED_AGNES_API_KEY
VITE_ENCRYPTED_DEEPSEEK_API_KEY
VITE_ENCRYPTED_UNITY_API_KEY
```

如果所有模型共用同一个 OpenAI-compatible 源站，可以只设置 `VITE_AI_API_BASE_URL` 和 `VITE_ENCRYPTED_API_KEY`。如果不同模型使用不同 key，可以设置 `VITE_ENCRYPTED_API_KEYS`：

```json
{
  "deepseek-v4-flash": "encrypted-key",
  "claude-opus-4-8": "encrypted-key"
}
```

也可以分别设置 `VITE_ENCRYPTED_AGNES_API_KEY`、`VITE_ENCRYPTED_DEEPSEEK_API_KEY`、`VITE_ENCRYPTED_UNITY_API_KEY`。

用户输入的凯撒偏移量会保存到浏览器 `localStorage`。密文生成方式是先把 API key 做 base64 编码，再只对编码结果里的英文字母做凯撒偏移；数字、`+`、`/`、`=` 不偏移。解锁时只要求至少一个已配置 key 能被当前偏移量解开；发送请求时会按所选模型解对应 key。前端包里仍会包含加密后的 key，这只能作为使用门槛，不能等同于服务端密钥保护。

## API 代理

仓库仍保留 `api-proxy/` 作为历史代理实现和测试参考；GitHub Pages 静态站不会使用它。验证代理代码可运行：

```powershell
npm run check:api
npm run test:api
```

## 验证

```powershell
npm run check:api
npm run test:api
npm run build
```

## 赞助者

感谢 [MengAnXiang](https://github.com/MengAnXiang) 和 [Wan-LR](https://github.com/Wan-LR) 对本网站的赞助。

<a href="https://github.com/MengAnXiang">
  <img src="https://github.com/MengAnXiang.png?size=128" width="64" height="64" alt="MengAnXiang 的 GitHub 头像">
</a>
<a href="https://github.com/Wan-LR">
  <img src="https://github.com/Wan-LR.png?size=128" width="64" height="64" alt="Wan-LR 的 GitHub 头像">
</a>
