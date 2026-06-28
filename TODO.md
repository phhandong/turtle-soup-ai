结论：要 scale 题库，先改“数据层 + AI 判题边界”。现在题库在前端 TS 里，少量题舒服；上千题会变成首屏包、搜索、版权、剧透、安全一起炸锅。

当前证据：

- [stories.ts](/e:/Python_Project/turtle-soup-ai/src/data/stories.ts:21)：全部题硬编码进 `stories: Story[]`
- [App.tsx](/e:/Python_Project/turtle-soup-ai/src/App.tsx:13)：首页直接 import 全量题库
- [App.tsx](/e:/Python_Project/turtle-soup-ai/src/App.tsx:85)：筛选是前端 `stories.filter`
- [App.tsx](/e:/Python_Project/turtle-soup-ai/src/App.tsx:294)：前端把 `truth` 发给 AI
- [aiClient.ts](/e:/Python_Project/turtle-soup-ai/src/services/aiClient.ts:6)：API key 硬编码，必须轮换
- [cloudflare-worker.js](/e:/Python_Project/turtle-soup-ai/api-proxy/cloudflare-worker.js:234)：Worker 信任客户端传来的 `truth`

建议改法，按优先级：

1. 题库从前端 bundle 搬走

   做 `stories index` + `story detail`：
   - 首页只拿：`id/title/surface/summary/tags/difficulty/source`
   - 汤底 `truth` 不进前端 bundle
   - 题库放 DB/CMS/JSON 静态分片皆可

   小规模 100-300 题：`public/stories/index.json` + 按 id lazy load。  
   大规模 1000+：Cloudflare D1 / Supabase / Postgres / CMS。

2. AI 判题改成服务端取汤底

   现在客户端能看到汤底，也能篡改汤底请求。应改成：

   ```ts
   POST / api / ask
   {
     ;(storyId, question, hintEnabled, revealMode, model)
   }
   ```

   Worker 根据 `storyId` 查 DB 里的 `truth`，再组 prompt。客户端永远不碰 `truth`，除非用户点“查看汤底”时请求公开接口。

3. 首页加分页、搜索、索引

   现在 `stories.filter` 没问题，但上千题会卡、难搜索。加：
   - `GET /api/stories?tag=&difficulty=&q=&cursor=`
   - 服务端分页
   - tags/difficulty 建索引
   - 全文搜索可后加 Meilisearch / SQLite FTS / Postgres tsvector

4. 内容管理独立出来

   现在加题 = 改 TS = 重新部署。题库大后会痛。需要：
   - `story.schema.ts` 或 Zod schema
   - 唯一 id 校验
   - tag 白名单校验
   - source/license 必填校验
   - 批量导入脚本
   - 重复题检测
   - 内容状态：`draft/published/archived`

5. Story schema 扩展，不只 `truth`

   大题库后，AI 主持质量靠结构化字段。建议加：

   ```ts
   hostFacts: string[]
   redHerrings: string[]
   clueLevels: string[]
   solveCriteria: string[]
   aliases: string[]
   spoilerLevel: number
   ```

   这样提示、结局判定、模糊问法更稳。

6. 本地进度别按全题库扫描

   [App.tsx](/e:/Python_Project/turtle-soup-ai/src/App.tsx:96) 现在首页遍历全部 stories 查 localStorage 完成状态。上千题后不优。改成单独存：

   ```ts
   turtle-soup-completed-ids = string[]
   ```

   聊天记录可继续按 storyId 存，但要限长。更大规模用 IndexedDB 或账号后端同步。

7. Prompt 逻辑去重

   `aiClient.ts` 和 Worker 里有一份很像的 prompt 构造。scale 后会分叉。建议只保留 Worker 版本，前端只请求 API。

8. 密钥必须处理

   当前 Agnes key 出现在前端和 Worker 源码里。这个不是 scale 问题，是上线安全硬伤。应：
   - 轮换已暴露 key
   - 前端删除直连 Agnes fallback
   - Worker 只读环境变量 secret
   - 加 rate limit / abuse guard

最小迁移路线：

- 第一步：保留 UI，拆 `stories.ts` 为 public metadata + private truth。
- 第二步：改 `/api/ask`，只传 `storyId/question`。
- 第三步：首页改 API 分页。
- 第四步：加内容 schema + 导入脚本。
- 第五步：需要运营后台时再接 CMS。

架构目标：前端管展示，Worker 管判题和密钥，DB/CMS 管题库。题库变大后，这条边界最值钱。
