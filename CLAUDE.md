# CLAUDE.md — ExpatDrive

## Project Overview

ExpatDrive is a bilingual study companion for English-speaking expats preparing for foreign driver's license exams. Phase 1 targets the Jalisco, Mexico written exam with 103 official questions. The app provides practice exams, flashcards with spaced repetition, vocabulary drills, process guide, insurance/rental guides, and AI-powered study coaching. Live at https://getexpatdrive.com

## Tech Stack

- Astro (static site framework with islands architecture)
- React (interactive components — quiz, flashcards, progress tracking)
- TypeScript
- Tailwind CSS
- SM-2 spaced repetition algorithm (client-side)
- Claude API (Haiku) for AI study coaching (readiness analysis, question explanations)
- localStorage (Phase 1 persistence) → Supabase (Phase 2)
- Vercel (deployment — static output with server-rendered API routes via @astrojs/vercel adapter)

## Project Structure

```
expatdrive/
├── src/
│   ├── layouts/              # Astro layouts
│   ├── pages/                # Astro pages (country/region routing)
│   │   ├── countries/mexico/jalisco/
│   │   └── api/ai/           # Server-rendered API routes (readiness, explain)
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

Sprint 3 complete — Self-hosted fonts, new favicon/OG image, BreadcrumbList JSON-LD, 15 road sign SVGs, insurance + rental guides, and Claude AI integration all deployed. Next: QA, PWA offline mode.

## Known Issues

- Vercel production branch is `main`
- Local `pnpm build` may fail on Windows at Vercel adapter symlink step (EPERM) — this is a Windows+pnpm issue only; Vercel CI builds successfully on Linux

## Environment Setup

Required environment variables (set in Vercel dashboard):
- `ANTHROPIC_API_KEY` — Claude API key for AI study features (set in production + preview)

For local development with AI features, create `.env` from `.env.example`:
```
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```
