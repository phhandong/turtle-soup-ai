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

## 用户系统、Neon 数据库与 Upstash Redis

本站需要登录后才能游玩。注册时填写用户名、邮箱和密码；登录支持用户名或邮箱。用户资料和做题记录保存在 Neon Serverless Postgres，会话保存在 Upstash Redis，并通过 HttpOnly Cookie 维持登录状态。

Vercel 环境变量至少需要：

```bash
DATABASE_URL=postgres://...
SESSION_SECRET=至少 32 位随机字符串
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
AGNES_API_KEY=...
DEEPSEEK_API_KEY=...
UNITY_API_KEY=...
VITE_AI_API_URL=/api/ai
```

也可以使用 Neon 自动注入的 `POSTGRES_URL`，代码会在 `DATABASE_URL` 缺失时回退使用它。首次请求 `/api/auth/*` 或 `/api/progress` 时会自动创建 `users` 和 `story_progress` 两张表。旧版本创建过的 `sessions` 表不会被主动删除，但新会话只写入 Redis。

Upstash 还会提供 `KV_URL` 和 `REDIS_URL` Redis 协议连接串；本站的 Vercel Serverless 链路使用 REST API 环境变量，不使用这两个连接串。`KV_REST_API_READ_ONLY_TOKEN` 用于会话读取，登录、登出和刷新会话 TTL 使用 `KV_REST_API_TOKEN`。如果 Redis 凭证曾出现在聊天、日志或公开位置，请先在 Upstash/Vercel 中 rotate 后再用于生产。

### Vercel Functions 直连模型

浏览器仍请求同域 `/api/ai`。Vercel 的 `api/ai.js` 先验证 Redis 会话和限流；未配置 `FC_API_URL` 时，同一函数直接调用 `api-proxy/proxy-core.mjs` 中的模型接口。只在 Vercel 的服务端环境变量中设置实际启用模型对应的 API key，不要使用 `VITE_` 前缀。`VITE_AI_API_URL` 应为 `/api/ai` 或留空，不能指向旧 FC 地址。

迁移时先在 Vercel 项目的 Settings -> Environment Variables 中为 Preview 添加模型密钥，删除 Preview 的 `FC_API_URL`，再创建新的 Preview 部署。登录后逐个测试实际开放的模型、提示和还原答案，并检查 Function 日志中的上游失败与耗时。确认稳定后，对 Production 做相同变更并重新部署。环境变量修改不影响已有部署；阿里云 FC 先保留一段回滚窗口。要回滚，在 Production 恢复 `FC_API_URL` 并重新部署。

本地验证直连模式时，将 `.env.local` 中的 `FC_API_URL` 设为空，并填入服务端模型密钥、数据库和 Redis 变量。在两个终端分别执行 `npm start`（端口 4173）和 `npm run dev`（Vite 默认端口 5173）。Vite 会将 `/api` 转发到本地 Node 服务，完整链路包含登录与限流。有值的 `FC_API_URL` 则保留原有 FC 转发行为；`FC_TIMEOUT_MS` 和 `FC_MAX_ATTEMPTS` 只作用于该路径。

可靠性说明：

- 做题进度保存使用前端序号保护，旧请求晚返回时不会覆盖更新的进度；重开题目也会使旧保存结果失效。
- Cookie 解析会跳过畸形 percent 编码值，避免无效 Cookie 把认证接口打成 500。
- 数据表初始化状态按 SQL 实例隔离，多个数据库连接或测试环境不会共用同一个 schema ready 标记。

## 云服务器 Node 转发服务（旧 FC 模式）

此部署模式仍可用于回滚：浏览器请求当前站点同域 `/api/ai`，Node 服务再转发到阿里云函数计算 `https://api-turtle.handong-joy.xyz`。

```bash
npm run build
npm start
```

默认监听 `4173` 端口，可通过环境变量调整：

```powershell
$env:PORT = "4173"
$env:FC_API_URL = "https://api-turtle.handong-joy.xyz"
$env:FC_TIMEOUT_MS = "30000"
$env:DATABASE_URL = "postgres://..."
$env:SESSION_SECRET = "replace-with-at-least-32-random-characters"
$env:KV_REST_API_URL = "https://..."
$env:KV_REST_API_TOKEN = "..."
$env:KV_REST_API_READ_ONLY_TOKEN = "..."
npm start
```

打开 `http://127.0.0.1:4173` 后，浏览器 Network 中 AI 请求应只出现同域 `/api/ai`。`FC_API_URL` 为空时同一 Node 服务直接调用模型接口。

## 阿里云函数计算 API 代理

浏览器默认不再直接请求阿里云函数，而是请求 Node 转发服务的 `/api/ai`；Node 再请求函数计算。模型 API key 只从函数计算环境变量读取，不打包进前端。函数入口位于 `api-proxy/index.mjs`，业务逻辑位于 `api-proxy/proxy-core.mjs`。

### 部署函数

1. 安装并配置 Serverless Devs：

```powershell
npm install -g @serverless-devs/s
s config add
```

2. 如目标地域不是杭州，修改 `api-proxy/s.yaml` 中的 `vars.region`。然后在当前 PowerShell 会话输入密钥；输入内容不会写入仓库：

```powershell
$env:AGNES_API_KEY = Read-Host 'AGNES_API_KEY'
$env:UNITY_API_KEY = Read-Host 'UNITY_API_KEY'
$env:DEEPSEEK_API_KEY = Read-Host 'DEEPSEEK_API_KEY'
```

3. 部署并获取 HTTP 触发器测试地址：

```powershell
cd api-proxy
s deploy -y
```

函数使用 Node.js 20、320 MB 内存、0.35 vCPU、60 秒超时。CORS 固定返回 `Access-Control-Allow-Origin: *`。首次部署后可请求 `/health`，预期返回 `{"ok":true}`。

### 绑定正式域名

在函数计算控制台选择与函数相同的地域：

1. 添加已接入阿里云备案的自定义域名 `api-turtle.handong-joy.xyz`。
2. 把路由 `/*` 指向 `turtle-soup-ai-proxy` 的 `LATEST` 版本。
3. 按控制台提示添加 CNAME，并启用 HTTPS 证书。
4. 云服务器版本不需要把函数域名暴露给前端；如 GitHub Pages 单独分支需要直连函数，再在 Actions Variables 中设置 `VITE_AI_API_URL=https://api-turtle.handong-joy.xyz`。

`turtle.handong-joy.xyz` 继续用于 GitHub Pages，`api-turtle.handong-joy.xyz` 专用于函数计算，避免同一 DNS 记录冲突。

### 验证

```powershell
npm run check:api
npm run test:api
npm run test:server
npm run test:auth
npm run build
```

旧 Agnes key 曾出现在前端源码和 Git 历史中，迁移后仍必须在供应商后台作废并生成新 key。

## 赞助者

感谢 [MengAnXiang](https://github.com/MengAnXiang) 和 [Wan-LR](https://github.com/Wan-LR) 对本网站的赞助。

<a href="https://github.com/MengAnXiang">
  <img src="https://github.com/MengAnXiang.png?size=128" width="64" height="64" alt="MengAnXiang 的 GitHub 头像">
</a>
<a href="https://github.com/Wan-LR">
  <img src="https://github.com/Wan-LR.png?size=128" width="64" height="64" alt="Wan-LR 的 GitHub 头像">
</a>


