# AI Assistant Entry Guide

This file is the first thing an AI assistant should read when starting work on
this repository.

## Project

`turtle-soup-ai` is an online turtle soup / lateral-thinking puzzle game.
Players choose a story, ask yes/no-style questions, use hints, and reveal the
truth when ready. The app has a React frontend, a Node/Vercel API layer, user
accounts, story progress sync, and an AI proxy that talks to model providers.

## Read First

For a new conversation, read these files in order:

1. `AGENTS.md`
2. `docs/PROJECT_MAP.md`
3. `package.json`
4. The specific files related to the requested change

If the request is about stories or puzzle content, also read:

1. `src/types/story.ts`
2. `src/data/stories.ts`

If the request is about AI answers or model behavior, also read:

1. `src/services/aiClient.ts`
2. `api-proxy/proxy-core.mjs`
3. `server/api-core.mjs`

If the request is about login, profile, sessions, or saved progress, also read:

1. `src/services/authClient.ts`
2. `server/api-core.mjs`
3. `server/auth-utils.mjs`
4. `server/redis-session-store.mjs`

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- Styling: plain CSS in `src/styles.css`
- Icons: `lucide-react`
- Backend: Node ESM modules and Vercel-style API handlers
- Database: Neon Serverless Postgres
- Session store and rate limits: Upstash Redis
- AI proxy: `api-proxy/proxy-core.mjs`, with providers such as DeepSeek, Agnes,
  and Unity

## Common Commands

```bash
npm install
npm run dev
npm run build
npm run check:api
npm run test:api
npm run test:server
npm run test:auth
```

On Windows, the project also has helper scripts:

```powershell
npm run dev:start
npm run dev:stop
```

For the production-like local server:

```bash
npm run build
npm start
```

The default server port is `4173`.

## Important Conventions

- Prefer existing patterns in `src/App.tsx`, `src/services/*`, and `server/*`.
- Keep story data consistent with `src/types/story.ts`.
- Do not expose API keys in frontend code.
- Browser AI calls should go through same-origin `/api/ai` unless the task is
  specifically about changing deployment routing.
- Authenticated progress is saved through `/api/progress`; localStorage is still
  used for client-side preferences and fallback state.
- After backend/API changes, run at least the relevant `npm run check:api` and
  test command.
- After frontend or shared type changes, run `npm run build`.

## Story Data Rules

Stories live in `src/data/stories.ts` and should match the `Story` type:

- `id`: stable URL-safe identifier
- `title`: story title
- `surface`: the player-facing puzzle text
- `truth`: the hidden answer
- `difficulty`: `easy`, `medium`, or `hard`
- `hints.items`: exactly three hints when hints are present
- `tags`: strings from or compatible with `storyCategoryTags`
- `source`: attribution and license/source notes

When adding or editing stories:

- Keep the answer concise enough for the AI host to judge reliably.
- Avoid leaking the truth in `surface`, `summary`, or early hints.
- Preserve attribution fields when adapting from public sources.
- Be careful with text encoding. Some Chinese text may appear garbled in a
  terminal that is not displaying UTF-8 correctly; check files in the editor
  before doing broad replacements.

## Environment Variables

Useful variables include:

- `VITE_AI_API_URL`: frontend AI endpoint, usually `/api/ai`
- `FC_API_URL`: optional upstream function-compute proxy URL
- `FC_TIMEOUT_MS`, `FC_MAX_ATTEMPTS`, `FC_RETRY_DELAY_MS`: upstream retry config
- `DATABASE_URL` or `POSTGRES_URL`: Neon Postgres connection
- `SESSION_SECRET`: at least 32 random characters
- `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `KV_REST_API_READ_ONLY_TOKEN`:
  Upstash Redis REST credentials
- `AGNES_API_KEY`, `DEEPSEEK_API_KEY`, `UNITY_API_KEY`: AI provider keys

Do not commit real secrets.

## Working Notes For AI Assistants

- Start with targeted file reads instead of scanning the whole repository.
- If output shows mojibake for Chinese text, do not assume the file is corrupted;
  verify encoding before changing content.
- Keep changes narrow and verify with commands that match the touched area.
- Do not rewrite generated build output in `dist` unless the user explicitly
  asks for it.
