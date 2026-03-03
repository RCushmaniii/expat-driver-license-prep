# CLAUDE.md — ExpatDrive

## Project Overview

ExpatDrive is a bilingual study companion for English-speaking expats preparing for foreign driver's license exams. Phase 1 targets the Jalisco, Mexico written exam with 103 official questions. The app provides practice exams, flashcards with spaced repetition, vocabulary drills, and a process guide. Pre-development — content preparation and app scaffold are the immediate next steps.

## Tech Stack

- Astro (static site framework with islands architecture)
- React (interactive components — quiz, flashcards, progress tracking)
- TypeScript
- Tailwind CSS
- SM-2 spaced repetition algorithm (client-side)
- localStorage (Phase 1 persistence) → Supabase (Phase 2)
- Vercel or Netlify (deployment)

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
└── public/                   # Static assets (sign images, favicon)
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
- **Islands architecture**: Static Astro pages with React islands for interactive features (exam, flashcards, progress)
- **SM-2 spaced repetition**: Modified SM-2 algorithm with 3-tier rating (Got it / Not sure / Missed it)
- **Multi-region scaling**: Adding a new country/state requires only content files — no code changes
- **localStorage wrapper**: `progress-store.ts` abstracts storage to enable future Supabase migration

## Content Schema

Questions follow a structured JSON format with fields: `id`, `country`, `region`, `category`, `difficulty`, `question_original` (Spanish), `question_translated` (English), `options` array with bilingual text and `is_correct` flag, `explanation_en`, `explanation_es`, `vocabulary` array, and `source` attribution.

Region metadata in `meta.json` captures exam parameters (questions per exam, passing score, time limit, answer format).

## Current Focus

Sprint 1 — Content preparation: parsing 103 Jalisco questions into structured JSON, generating quality English translations, writing explanations, extracting vocabulary, and compiling the process guide.

## Known Issues

- Pre-development; no code exists yet
- ~15-20 questions reference road sign images that need to be sourced or created as SVGs
- Government English translations exist but are rough — improved translations needed

## Environment Setup

No environment variables required for Phase 1 (fully static, localStorage-based). Phase 2 will require Supabase credentials.
