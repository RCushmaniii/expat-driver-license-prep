# CLAUDE.md — ExpatDrive

## Project Overview

ExpatDrive is a bilingual study companion for English-speaking expats preparing for foreign driver's license exams. Phase 1 targets the Jalisco, Mexico written exam with 103 official questions. The app provides practice exams, flashcards with spaced repetition, vocabulary drills, and a process guide. Live at https://expat-driver-license-prep.vercel.app

## Tech Stack

- Astro (static site framework with islands architecture)
- React (interactive components — quiz, flashcards, progress tracking)
- TypeScript
- Tailwind CSS
- SM-2 spaced repetition algorithm (client-side)
- localStorage (Phase 1 persistence) → Supabase (Phase 2)
- Vercel (deployment — static output with @astrojs/vercel adapter)

## Project Structure

```
expatdrive/
├── src/
│   ├── layouts/              # Astro layouts
│   ├── pages/                # Astro pages (country/region routing)
│   │   └── countries/mexico/jalisco/
│   ├── components/
│   │   ├── astro/            # Static Astro components
│   │   └── react/            # Interactive React islands
│   ├── lib/                  # Utilities (SR algorithm, question bank, progress store, types)
│   └── styles/               # Tailwind + custom CSS
├── content/
│   └── countries/mexico/jalisco/  # Question bank, vocabulary, process guide, metadata
├── public/
│   ├── data/jalisco/             # Client-side JSON (questions.json, vocabulary.json)
│   ├── favicon.svg               # Navy steering wheel icon
│   └── robots.txt
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
```

## Key Patterns & Conventions

- **Content-as-data**: Question banks, vocabulary, and metadata stored as JSON in `content/` directory
- **Bilingual-first**: Every user-facing string has both Spanish original and English translation
- **Dual translations**: Improved English as primary display + "Official Test Version" toggle showing government phrasing (what users see on test day)
- **Islands architecture**: Static Astro pages with React islands for interactive features (exam, flashcards, progress)
- **SM-2 spaced repetition**: Modified SM-2 algorithm with 3-tier rating (Got it / Not sure / Missed it)
- **Multi-region scaling**: Adding a new country/state requires only content files — no code changes
- **localStorage wrapper**: `progress-store.ts` abstracts storage to enable future Supabase migration

## Content Schema

Questions follow a structured JSON format with fields: `id`, `country`, `region`, `category`, `difficulty`, `question_original` (Spanish), `question_translated` (improved English), `question_official_en` (government English translation — what appears on test day), `options` array with bilingual text (`text_original`, `text_translated`, `text_official_en`) and `is_correct` flag, `explanation_en`, `explanation_es`, `vocabulary` array, and `source` attribution.

Region metadata in `meta.json` captures exam parameters (questions per exam, passing score, time limit, answer format).

## Product Decisions (Locked)

- **Translation strategy**: Improved English as primary + official government English toggle. MVP feature.
- **Simulator section**: Content-only "What to Expect in the Jalisco Simulator Exam" section. MVP feature.
- **PWA/offline**: MVP+ (add immediately after MVP core). Service worker for offline study.
- **AI features (Claude API)**: Phase 2. Wait for user data on confusion points before adding.
- **Community features**: Phase 3. Curated "Student Tips" only — no open comments. Manual approval.

## Roadmap

- **MVP**: Improved + official translations, structured explanations, practice quiz engine, simulator expectations section
- **MVP+**: PWA offline mode
- **Phase 2**: AI explanations, adaptive difficulty, generate similar questions, Supabase multi-user
- **Phase 3**: Curated student tips, premium tier, international expansion

## Current Focus

Sprint 2 complete — Full Astro app scaffold with brand system deployed. Next: QA, PWA offline mode, and sign image creation.

## Known Issues

- ~15-20 questions reference road sign images that need to be sourced or created as SVGs
- Vercel production branch updated to `main` (renamed from `master`)

## Environment Setup

No environment variables required for Phase 1 (fully static, localStorage-based). Phase 2 will require Supabase credentials.
