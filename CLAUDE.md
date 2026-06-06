# CLAUDE.md — ExpatDrive

## Project Overview

ExpatDrive is a bilingual study companion for English-speaking expats preparing for foreign driver's license exams. Phase 1 targets the Jalisco, Mexico written exam with 103 official questions. The app provides practice exams, flashcards with spaced repetition, vocabulary drills, process guide, insurance/rental guides, and AI-powered study coaching. Live at https://getexpatdrive.com

## Tech Stack

- Astro 6 (static site framework with islands architecture)
- React 19 (interactive components — quiz, flashcards, progress tracking)
- TypeScript 5.9
- Tailwind CSS 4
- Vitest (testing — 74 tests covering core business logic and API input validation)
- Sentry (error monitoring via @sentry/astro)
- SM-2 spaced repetition algorithm (client-side)
- Claude API (Haiku) for AI study coaching (readiness analysis, question explanations)
- Upstash Redis rate limiting on all paid API routes (sliding window, fail-open)
- localStorage (Phase 1 persistence) → Supabase (Phase 2)
- Vercel (deployment — static output with server-rendered API routes via @astrojs/vercel adapter)

## Project Structure

```
expatdrive/
├── src/
│   ├── layouts/              # Astro layouts
│   ├── pages/                # Astro pages (country/region routing)
│   │   ├── countries/mexico/jalisco/
│   │   ├── api/ai/           # Server-rendered API routes (readiness, explain)
│   │   └── api/tts/          # Azure Neural TTS proxy (synthesize)
│   ├── components/
│   │   ├── astro/            # Static Astro components
│   │   └── react/            # Interactive React islands
│   ├── lib/                  # Utilities (SR algorithm, question bank, progress store, types)
│   └── styles/               # Tailwind + custom CSS (self-hosted Inter font)
├── content/
│   └── countries/mexico/jalisco/  # Question bank, vocabulary, process guide, insurance/rental guides, metadata
├── public/
│   ├── data/jalisco/             # Client-side JSON (questions.json, vocabulary.json)
│   ├── fonts/                    # Self-hosted Inter WOFF2 (400, 500, 600, 700)
│   ├── signs/                    # Road sign SVGs (15 Mexican NOM-034-SCT-2 signs)
│   ├── favicon.svg               # Navy steering wheel with road motif
│   ├── og-image.png              # 1200x630 social sharing image
│   └── robots.txt
├── scripts/
│   └── generate-og.mjs          # One-time OG image generator (sharp)
├── docs/                         # Brand & design system documentation
```

## Development Commands

```powershell
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check Astro components
pnpm check

# Build for production
pnpm build

# Preview production build
pnpm preview

# Regenerate OG image
node scripts/generate-og.mjs
```

## Key Patterns & Conventions

- **Content-as-data**: Question banks, vocabulary, and metadata stored as JSON in `content/` directory
- **Bilingual-first**: Every user-facing string has both Spanish original and English translation
- **Dual translations**: Improved English as primary display + "Official Test Version" toggle showing government phrasing (what users see on test day)
- **Islands architecture**: Static Astro pages with React islands for interactive features (exam, flashcards, progress)
- **SM-2 spaced repetition**: Modified SM-2 algorithm with 3-tier rating (Got it / Not sure / Missed it)
- **Multi-region scaling**: Adding a new country/state requires only content files — no code changes
- **localStorage wrapper**: `progress-store.ts` abstracts storage to enable future Supabase migration
- **Self-hosted fonts**: Inter served from `/public/fonts/` with `font-display: swap` — no Google Fonts dependency
- **Server routes**: API routes in `src/pages/api/` use `export const prerender = false` for server-side rendering; all other pages remain static
- **BreadcrumbList JSON-LD**: Auto-generated from Breadcrumb component's `items` prop on all pages

## Content Schema

Questions follow a structured JSON format with fields: `id`, `country`, `region`, `category`, `difficulty`, `question_original` (Spanish), `question_translated` (improved English), `question_official_en` (government English translation — what appears on test day), `options` array with bilingual text (`text_original`, `text_translated`, `text_official_en`) and `is_correct` flag, `explanation_en`, `explanation_es`, `vocabulary` array, `has_image`, `image_ref` (path to SVG in `/public/signs/`), and `source` attribution.

Region metadata in `meta.json` captures exam parameters (questions per exam, passing score, time limit, answer format).

## Product Decisions (Locked)

- **Translation strategy**: Improved English as primary + official government English toggle. MVP feature.
- **Simulator section**: Content-only "What to Expect in the Jalisco Simulator Exam" section. MVP feature.
- **PWA/offline**: MVP+ (add immediately after MVP core). Service worker for offline study.
- **AI features (Claude API)**: Implemented — Haiku for readiness analysis and question explanations. Cost: ~$0.001/request.
- **Community features**: Phase 3. Curated "Student Tips" only — no open comments. Manual approval.

## Roadmap

- **MVP**: Improved + official translations, structured explanations, practice quiz engine, simulator expectations section
- **MVP+**: PWA offline mode
- **Phase 2**: Adaptive difficulty, generate similar questions, Supabase multi-user
- **Phase 3**: Curated student tips, premium tier, international expansion

## Current Focus

Sprint 5 complete — standalone SEO guide pages (process/insurance/rental), region waitlist email capture, rate limiting + input bounds on all paid API routes (74 tests), content provenance lines on study pages, docs truth pass. Next: distribution posts (venues list in docs/DISTRIBUTION_VENUES.md), programmatic road-sign SEO pages, PWA offline mode.

## Reference Links

- **Mexican road signs (NOM-034 catalog)**: https://en.wikipedia.org/wiki/Road_signs_in_Mexico
- **Wikimedia Commons sign files**: Named `MX road sign {ID}.svg` — use thumbnail API for PNG renders
- **Wikimedia categories**: `Category:SVG_regulatory_road_signs_of_Mexico` (SR), `Category:SVG_warning_road_signs_of_Mexico` (SP)

## Known Issues

- jalisco-059 is excluded from exams (question-bank.ts isAnswerable): it references a sign image that is missing, and three official sources disagree on the answer. Unresolved until a verified image + answer key is found. See docs/SESSION_LOG.md (2026-05-30).

- Vercel production branch is `main`
- Local `pnpm build` may fail on Windows at Vercel adapter symlink step (EPERM) — this is a Windows+pnpm issue only; Vercel CI builds successfully on Linux
- Vercel free tier: 100 deploys/day limit — can't force CDN cache purge when limit is hit

## Environment Setup

Required environment variables (set in Vercel dashboard):

- `ANTHROPIC_API_KEY` — Claude API key for AI study features (set in production + preview)
- `AZURE_TTS_KEY` / `AZURE_TTS_REGION` — Azure Neural TTS for pronunciation audio
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — rate limiting (auto-injected by the Vercel Upstash integration; limiter fails open if absent)

For local development with AI features, create `.env` from `.env.example`:

```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```


## Session Log

A running log of all working sessions is maintained at `docs/SESSION_LOG.md`.
Always append a new entry at the top of this file before closing a session.
Use the `session-logger` skill to generate the entry.