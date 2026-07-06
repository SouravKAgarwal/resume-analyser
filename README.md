# AI Resume Analyzer

AI-powered resume analysis: honest ATS scoring, a 10-dimension deep review, job-description matching, and recruiter-grade AI rewrites — with the reasoning behind every recommendation.

Built with **Next.js 16 (App Router, Turbopack)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Prisma 7 + PostgreSQL (Neon)**, **Better Auth**, **UploadThing**, **Redis (Upstash)**, and any **OpenAI-compatible** LLM (configured here for NVIDIA NIM).

## Features

- **Upload** — PDF or DOCX (drag & drop), text extracted with `unpdf` / `mammoth`.
- **Parse** — AI structures the resume into typed sections (personal info, experience, projects, skills, education, …).
- **Analyze** — overall ATS score plus 10 scored dimensions (ATS, formatting, grammar, readability, keywords, experience, projects, skills, impact, professionalism), each with strengths, weaknesses, and concrete fixes.
- **Match** — paste a job description to get a match score, matched/missing skills, missing keywords, recommendations, and a tailored summary.
- **Rewrite** — regenerate the summary, experience, projects, skills, or the whole resume in 9 style presets (ATS Optimized, Frontend, Backend, Full Stack, SWE, Startup, Enterprise, Internship, Senior).
- **Track** — every analysis and match is stored per resume version so you can watch scores improve.

## Architecture

Server-first throughout:

- **Server Components** for all pages and data fetching (`src/features/resumes/queries.ts`).
- **Server Actions** for every mutation (`src/features/resumes/actions.ts`), each returning a typed `{ ok, data | error }` result and validated with Zod.
- **Client Components** only where interactivity is required (uploader, forms, buttons).
- **AI layer** (`src/lib/ai/`) is provider-agnostic via an OpenAI-compatible client with defensive JSON parsing + one automatic repair retry, and **Redis read-through caching** so identical inputs are never re-billed.
- **Auth** via Better Auth (`src/lib/auth.ts`) with an optimistic cookie check in `src/proxy.ts` and real validation in `requireUser()`.

```
src/
  app/
    (auth)/            sign-in, sign-up
    (app)/             dashboard, resumes, analyses, matches  (auth-gated)
    api/auth, api/uploadthing
  components/          ui (shadcn), scores, resumes, layout, auth
  features/resumes/    actions.ts (mutations), queries.ts (reads)
  lib/
    ai/                client.ts (LLM), resume-ai.ts (prompts + cache)
    parsing/           extract-text.ts (pdf/docx)
    schemas/           resume.ts (Zod: parsed resume, analysis, match, rewrite)
    auth.ts, session.ts, db.ts, redis.ts, uploadthing.ts
  generated/prisma/    Prisma 7 generated client (gitignored)
```

## Getting started

### Prerequisites

- Node.js 20+ (developed on 24)
- pnpm
- A PostgreSQL database (Neon), an UploadThing app, a Redis instance (Upstash), and an OpenAI-compatible API key.

### Setup

```bash
pnpm install
cp .env.example .env      # fill in your credentials
pnpm prisma generate      # generate the typed client
pnpm prisma db push       # sync the schema to your database
pnpm dev                  # http://localhost:3000
```

### Environment variables

See `.env.example`. Key notes:

- `OPENAI_BASE_URL` + `OPENAI_MODEL` let you point at any OpenAI-compatible provider. `nvapi-*` keys default to NVIDIA's endpoint automatically.
- Google OAuth is optional — auth falls back to email/password when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are unset.
- Redis is used as a best-effort cache; a Redis outage degrades gracefully (loaders still run).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |

## Notes

- This project targets **Next.js 16**, which renames `middleware.ts` → **`proxy.ts`** and moves the Prisma datasource URL into `prisma.config.ts`. Both are reflected in the codebase.
- MVP scope per the product brief: auth, upload, parse, analyze, ATS scoring, JD matching, rewriting. Analytics dashboards, recruiter portals, and collaboration are future enhancements.
