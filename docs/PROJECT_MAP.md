# Project Map

This document gives a quick map of the repository so a new AI conversation can
be productive without a full repo tour.

## Top-Level Layout

```text
.
|-- src/                 React app source
|-- server/              Local Node server and shared API core
|-- api/                 Vercel serverless entrypoints
|-- api-proxy/           AI provider proxy and deployment config
|-- scripts/             Windows dev helper scripts
|-- public/              Static assets
|-- dist/                Build output
|-- package.json         Scripts and dependencies
`-- docs/PROJECT_MAP.md  This project map
```

## Frontend

### `src/main.tsx`

React entrypoint. Mounts `App` into the page.

### `src/App.tsx`

Main application file. It currently owns most frontend behavior:

- Home page and story list
- Tag, difficulty, completion, and search filters
- Auth gate, login/register/profile UI
- Story play page
- AI question submission
- Hint reveal state
- Truth reveal flow
- Progress save/reset
- LocalStorage preferences
- Confetti and UI sound effects

Because this file is large, prefer small local edits unless the task clearly
needs extraction.

### `src/styles.css`

Global CSS for the whole app. Use existing class names and visual language when
adding UI.

### `src/data/stories.ts`

Puzzle database. Exports:

- `storyCategoryTags`
- `stories`
- `getStoryById(id)`

This is the main file for content work.

### `src/types/story.ts`

Shared frontend story and AI response types:

- `Story`
- `StorySource`
- `StoryHints`
- `Difficulty`
- `AiRequest`
- `AiResponse`
- `AiModelId`
- `ChatEntry`

Update this file first if a story or API shape changes.

### `src/services/aiClient.ts`

Frontend AI client. Sends `AiRequest` to `VITE_AI_API_URL` or `/api/ai`,
retries transient failures, normalizes AI responses, and maps model output to
the frontend response shape.

### `src/services/authClient.ts`

Frontend auth/progress client. Wraps:

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/profile`
- `/api/progress`

### `src/utils/routes.ts`

Hash-route helpers for story URLs.

## Backend And API

### `server/api-core.mjs`

Main shared API implementation. Handles:

- `/api/ai`
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/auth/profile`
- `/api/progress`

Also owns schema creation, Postgres access, Redis session lookup, auth and AI
rate limits, progress normalization, and optional forwarding to `FC_API_URL`.

### `server/index.mjs`

Production-like local Node server. Serves `dist` static files and forwards
`/api/*` requests into `server/api-core.mjs`.

Default local server:

```text
http://127.0.0.1:4173
```

### `server/start-server.mjs`

Helper entry for starting the server from scripts.

### `server/env-loader.mjs`

Loads local environment files for the Node server.

### `server/auth-utils.mjs`

Auth helpers:

- Input validation
- Email/username normalization
- Password hashing and verification
- Session token creation and hashing
- Cookie construction and parsing

### `server/redis-session-store.mjs`

Redis session and counter helpers. Used for sessions and rate limiting.

### `api/*.js`

Vercel serverless entrypoints. These should stay thin and delegate to the
shared server/API logic where possible.

Notable files:

- `api/[...path].js`
- `api/ai.js`
- `api/progress.js`
- `api/auth/*.js`

## AI Proxy

### `api-proxy/proxy-core.mjs`

Provider-facing AI proxy. It:

- Validates incoming `AiRequest`
- Builds the turtle-soup host prompt
- Selects an upstream model provider
- Calls chat-completions-style APIs
- Parses strict JSON output
- Normalizes labels and matched hint indexes
- Supports optional debug timing

Supported model IDs currently include:

- `agnes-2.0-flash`
- `deepseek-v4-flash`
- `claude-opus-4-8`

### `api-proxy/index.mjs`

Function/serverless entrypoint around `proxy-core.mjs`.

### `api-proxy/s.yaml`

Serverless Devs deployment config for the function-compute proxy.

## Data Flow

### Playing A Story

```text
User selects story
-> src/App.tsx loads story from src/data/stories.ts
-> user asks a question
-> src/services/aiClient.ts posts to /api/ai
-> server/api-core.mjs verifies session and rate limits
-> request goes to FC_API_URL or api-proxy/proxy-core.mjs
-> model response is normalized
-> frontend appends ChatEntry and saves progress
```

### Auth And Progress

```text
Frontend authClient
-> /api/auth/* or /api/progress
-> server/api-core.mjs
-> Neon Postgres users/story_progress
-> Upstash Redis sessions and counters
-> HttpOnly session cookie
```

## Tests And Checks

Use the narrowest useful command first:

```bash
npm run check:api
npm run test:api
npm run test:server
npm run test:auth
npm run build
```

Relevant test files:

- `api-proxy/index.test.mjs`
- `server/index.test.mjs`
- `server/api-core.test.mjs`
- `server/auth-utils.test.mjs`
- `server/redis-session-store.test.mjs`

## Change Guide

- Story/content changes: `src/data/stories.ts`, then `npm run build`.
- Story type changes: `src/types/story.ts`, then update all callers and build.
- AI answer behavior: `api-proxy/proxy-core.mjs`, plus `src/services/aiClient.ts`
  if the response shape changes.
- Login/session/progress changes: `server/api-core.mjs`,
  `server/auth-utils.mjs`, `server/redis-session-store.mjs`, and
  `src/services/authClient.ts`.
- Styling changes: `src/styles.css` and the matching JSX in `src/App.tsx`.
- Deployment/proxy changes: `api-proxy/s.yaml`, `server/index.mjs`, and
  environment variables.

## Known Cautions

- Many user-facing strings are Chinese. Terminal output may display mojibake if
  the shell code page is not UTF-8. Check actual files in the editor before
  doing broad text edits.
- `src/App.tsx` is intentionally dense; avoid unrelated refactors during small
  feature work.
- `dist/` is build output and usually should not be edited by hand.
- Real `.env.local` secrets must not be copied into docs, tests, or frontend
  source.
