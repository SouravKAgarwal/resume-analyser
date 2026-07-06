<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Resume Analyzer — project notes

## Stack
Next.js 16 (App Router, Turbopack), React 19, TS, Tailwind v4, shadcn/ui, Prisma 7 + Neon Postgres, Better Auth, UploadThing, Redis (Upstash), OpenAI-compatible LLM (NVIDIA NIM).

## Next.js 16 breaking changes in use
- **`src/proxy.ts`** is the middleware file (formerly `middleware.ts`). Exports a `proxy` function + `config.matcher`.
- **Prisma 7**: the datasource `url` lives in `prisma.config.ts` (`datasource.url`), NOT in `schema.prisma`. The client is generated to `src/generated/prisma/` and instantiated with the Neon adapter (`src/lib/db.ts`).

## Conventions
- **Server-first.** Pages are Server Components. All reads go through `src/features/resumes/queries.ts` (import `server-only`). All mutations are Server Actions in `src/features/resumes/actions.ts`, Zod-validated, returning `{ ok: true, data } | { ok: false, error }`.
- **Auth.** `requireUser()` (`src/lib/session.ts`) gates every app page and action; `proxy.ts` is only an optimistic redirect. Ownership is always re-checked in queries/actions via `userId`.
- **AI.** Add prompts in `src/lib/ai/resume-ai.ts`; every call goes through `generateJSON` (defensive parse + one repair retry) and is wrapped in `cached()` (Redis, keyed by input hash). Schemas live in `src/lib/schemas/resume.ts`.
- **Scores.** Reusable server-rendered `ScoreRing` / `ScoreBar` in `src/components/scores/score.tsx`. Color thresholds: ≥80 emerald, ≥60 amber, else red.

## Commands
`pnpm dev` · `pnpm build` · `pnpm lint` · `pnpm prisma db push` · `pnpm prisma generate`

