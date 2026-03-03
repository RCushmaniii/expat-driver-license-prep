---
# =============================================================================
# PORTFOLIO.MD — ExpatDrive
# =============================================================================
portfolio_enabled: true
portfolio_priority: 4
portfolio_featured: false
portfolio_last_reviewed: "2026-03-03"

title: "ExpatDrive — Bilingual Driver's License Exam Prep"
tagline: "Pass your driver's license exam in any country — even if you don't speak the language yet."
slug: "expatdrive"

category: "Tools"
target_audience: "English-speaking expats preparing for foreign driver's license exams"
tags:
  - "astro"
  - "react"
  - "typescript"
  - "tailwind-css"
  - "spaced-repetition"
  - "bilingual"
  - "education"
  - "expat-tools"

thumbnail: ""
hero_images: []
demo_video_url: ""

live_url: "https://expat-driver-license-prep.vercel.app"
demo_url: "https://expat-driver-license-prep.vercel.app/countries/mexico/jalisco/"
case_study_url: ""

problem_solved: |
  English-speaking expats struggle to pass foreign driver's license exams due to
  legal and technical terminology in unfamiliar languages. Existing resources are
  fragmented, outdated, and rarely bilingual. ExpatDrive provides verified,
  state-specific question banks with quality translations, spaced repetition
  study tools, and step-by-step process guides.

key_outcomes:
  - "103 official Jalisco questions translated, explained, and verified bilingually"
  - "Multiple study modes: practice exams, flashcards with SM-2 spaced repetition, vocabulary drills"
  - "Content architecture scales to new countries/states with zero code changes"
  - "Process guides cover documents, fees, procedures, and expat-specific tips"
  - "Built for Phase 2 expansion to CDMX, Nuevo Leon, and Quintana Roo"

tech_stack:
  - "Astro"
  - "React"
  - "TypeScript"
  - "Tailwind CSS"
  - "SM-2 Spaced Repetition"
  - "JSON Content Collections"
  - "localStorage (Phase 1)"
  - "Vercel"

complexity: "MVP"
---

## Overview

ExpatDrive is a bilingual study companion for English-speaking expats preparing for foreign driver's license written exams. Phase 1 targets the Jalisco, Mexico exam — 103 official questions from the Secretaria de Vialidad y Transporte, presented in Spanish and English with detailed explanations and driving-specific vocabulary.

The app provides multiple study modes: timed practice exams simulating the real 20-question format, flashcards powered by SM-2 spaced repetition, standalone vocabulary drills for driving terminology, and comprehensive process guides covering everything from required documents to what happens on exam day.

The architecture is designed for multi-country scaling from day one. Adding a new country or state is a content task — drop JSON question banks, vocabulary files, and Markdown process guides into the content directory and the app picks them up automatically.

## The Challenge

- **Language barrier at the legal level:** Expats with conversational Spanish can't parse government exam terminology like "prelacion de paso" (right-of-way) or "placas sobrepuestas" (fraudulent plates). The gap between everyday language and legal/traffic vocabulary is significant.
- **Fragmented, unreliable resources:** Study materials are scattered across Angelfire pages from 2007, forum threads, TikTok videos, and paid PDFs of questionable accuracy. No single destination exists for bilingual, verified exam prep.
- **State-specific rules ignored:** Mexico's driving laws vary by state. Jalisco allows left turns on red under specific conditions — generic "Mexico driving test" resources miss these details, and getting them wrong means failing.
- **High cost of failure:** In Jalisco, a failed exam means a 15-day waiting period before retaking. For expats who need to drive, that delay has real consequences.

## The Solution

**Bilingual question bank with quality translations:**
All 103 official questions presented with polished English translations that improve on the rough government versions. Each question includes explanations in both languages and extracted vocabulary with contextual definitions — teaching the answer and the language simultaneously.

**Spaced repetition study system:**
SM-2 algorithm tracks mastery per question, scheduling reviews at optimal intervals. Flashcard mode uses a simplified 3-tier rating (Got it / Not sure / Missed it) that maps to the algorithm's scheduling. The progress dashboard shows mastery by category, highlighting weak areas for targeted study.

**State-specific process guides:**
Complete walkthroughs with required documents, step-by-step office procedures, exam format details, cost breakdowns, and tips from fellow expats. Jalisco content includes the new 2025 driving simulator requirement.

**Multi-region content architecture:**
JSON question banks and Markdown process guides follow a standardized schema. Adding a new region means creating a content folder — the routing, UI, and study features adapt automatically.

## Technical Highlights

- **Astro islands architecture** — Static content with React islands for interactive components, delivering fast loads with rich interactivity where needed
- **SM-2 spaced repetition** — Client-side implementation of the SuperMemo 2 algorithm with localStorage persistence, abstracted behind an interface for future Supabase migration
- **Content-as-data scaling** — Typed JSON schemas for questions, vocabulary, and region metadata enable content-only expansion to new countries
- **Bilingual-first UI patterns** — Toggle between original language and English with distinct visual treatment, preparing users for both the content and the exam-day experience
- **Progressive complexity** — Phase 1 is fully static with localStorage; the storage abstraction enables Phase 2 migration to Supabase with auth and cross-device sync without rewriting study features

## Results

**For the End User:**
- Single destination replacing fragmented study across forums, PDFs, and videos
- Spaced repetition targets study time at weak areas instead of re-reviewing mastered content
- Bilingual presentation teaches both the answer and the vocabulary needed on exam day
- Process guides eliminate the "what do I even bring?" uncertainty

**Technical Demonstration:**
- Content architecture that scales internationally without code changes
- Clean separation between static content delivery and interactive study features via islands
- Storage abstraction pattern enabling smooth migration from localStorage to cloud database
- Structured content pipeline from government PDF source to typed JSON with quality translations
