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

## 云服务器 Node 转发服务

生产链路为：浏览器请求当前站点同域 `/api/ai`，Node 服务再转发到阿里云函数计算 `https://api-turtle.handong-joy.xyz`。

```bash
npm run build
npm start
```

默认监听 `4173` 端口，可通过环境变量调整：

```powershell
$env:PORT = "4173"
$env:FC_API_URL = "https://api-turtle.handong-joy.xyz"
$env:FC_TIMEOUT_MS = "30000"
npm start
```

本地完整链路测试也使用这个服务；打开 `http://127.0.0.1:4173` 后，浏览器 Network 中 AI 请求应只出现同域 `/api/ai`。

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


