# ExpatDrive

![Astro](https://img.shields.io/badge/Astro-FF5D01?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)

> Pass your driver's license exam in any country — even if you don't speak the language yet.

## Overview

ExpatDrive is a bilingual study companion for English-speaking expats preparing for foreign driver's license written exams. The app provides verified, state-specific question banks with high-quality translations, practice exams, spaced-repetition flashcards, vocabulary drills, and step-by-step process guides.

Phase 1 targets the Jalisco, Mexico driver's license exam — 103 official questions from the Secretaria de Vialidad y Transporte, presented bilingually in Spanish and English with explanations and driving-specific vocabulary.

Current resources for expats are fragmented across outdated forum posts, shaky TikTok videos, and rough government translations. ExpatDrive consolidates this into a single, reliable destination that teaches both the correct answers and the terminology you'll encounter on test day.

## The Challenge

English-speaking expats face a surprisingly high barrier to getting a driver's license abroad:

- **Government exams use legal and technical terminology** that even intermediate speakers struggle with. Knowing "restaurant Spanish" doesn't prepare you for terms like "prelacion de paso" or "placas sobrepuestas."
- **Existing study resources are scattered and unreliable** — Angelfire pages from 2007, paid PDFs of questionable accuracy, and Spanish-only practice sites that don't help English speakers.
- **Each state has different rules.** Mexico's driving laws vary by state (Jalisco allows left turns on red under specific conditions). Generic "Mexico driving test" resources miss critical state-specific details.
- **Failing means a 15-day wait.** In Jalisco, you can't retake the exam for two weeks — a significant delay for someone who needs to drive.

## The Solution

**Bilingual question bank with quality translations:**
All 103 official Jalisco questions presented in Spanish with polished English translations — not the rough government versions. Each question includes detailed explanations in both languages and extracted vocabulary terms with contextual definitions.

**Multiple study modes for different learning stages:**
Practice exams simulate the real 20-question format with randomized questions and passing score calculation. Flashcards use SM-2 spaced repetition to focus study time on weak areas. Vocabulary drills teach driving-specific terminology outside the question context.

**State-specific process guides:**
Complete walkthroughs covering required documents, step-by-step office procedures, exam format details, cost breakdowns, and tips from fellow expats. Jalisco-specific content includes the new 2025 simulator test requirement.

**Built for expansion:**
The multi-region content architecture means adding a new country or state is a content task, not a code change. JSON question banks, vocabulary files, and Markdown process guides drop into a folder structure that the app picks up automatically.

## Technical Highlights

- **Astro islands architecture** — Static content pages with React islands for interactive features (quiz engine, flashcards, progress tracking), delivering fast page loads with rich interactivity where needed
- **SM-2 spaced repetition** — Modified SuperMemo 2 algorithm with a simplified 3-tier rating system, running entirely client-side with localStorage persistence
- **Content-as-data pattern** — Question banks, vocabulary, and region metadata stored as typed JSON files, enabling content scaling without code changes
- **Bilingual-first design** — Every content interface supports toggling between original language and English translation, with distinct visual treatment for each language
- **Progressive architecture** — Phase 1 runs fully static with localStorage; the storage layer abstracts behind an interface for Phase 2 migration to Supabase with auth and cross-device sync

## Live Demo

**[Try it live](https://getexpatdrive.com)**

- Take a [practice exam](https://getexpatdrive.com/countries/mexico/jalisco/exam) with 20 randomized questions
- Study with [spaced repetition flashcards](https://getexpatdrive.com/countries/mexico/jalisco/study) that adapt to your knowledge
- Drill [driving vocabulary](https://getexpatdrive.com/countries/mexico/jalisco/vocabulary) in Spanish and English

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8

### Installation

```powershell
git clone https://github.com/RCushmaniii/expat-driver-license-prep.git
cd expat-driver-license-prep
pnpm install
pnpm dev
```

The development server starts at `http://localhost:4321`.

### Environment Variables

No environment variables required for Phase 1. The app runs entirely client-side with localStorage.

Phase 2 will require Supabase credentials (documented when that migration happens).

## Project Structure

```
├── src/
│   ├── layouts/                    # Shared Astro layouts
│   ├── pages/
│   │   └── countries/mexico/jalisco/  # Region-specific pages
│   ├── components/
│   │   ├── astro/                  # Static components (header, footer, process guide)
│   │   └── react/                  # Interactive islands (exam, flashcards, vocab, progress)
│   ├── lib/                        # Core utilities (SR algorithm, question bank, progress store)
│   └── styles/                     # Tailwind + theme
├── content/
│   └── countries/mexico/jalisco/   # Question bank, vocabulary, process guide, metadata
└── public/                         # Static assets (road sign images)
```

## Results

**Phase 1 Target (Personal Use):**
- All 103 Jalisco questions translated, explained, and verified by bilingual review
- Consistent 18+/20 scores on practice exams
- Pass the actual Jalisco driving exam on first attempt

**Phase 2 Target (Public Launch):**
- 500 unique visitors/month within 3 months of launch
- Content coverage for 3+ Mexican states (CDMX, Nuevo Leon, Quintana Roo)
- At least one user-reported exam pass using the tool

## Contact

**Robert Cushman**
Business Solution Architect & Full-Stack Developer
Guadalajara, Mexico

🔗 [GitHub](https://github.com/RCushmaniii) • [LinkedIn](https://linkedin.com/in/robertcushman) • [Portfolio](https://cushlabs.ai) • [Contact](https://getexpatdrive.com/contact)

## License

(c) 2026 Robert Cushman. All rights reserved.

---

*Last Updated: 2026-03-03*
