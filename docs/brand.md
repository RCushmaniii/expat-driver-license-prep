# ExpatDrive Brand & Design System

## Brand Identity

**ExpatDrive** helps English-speaking expats prepare for foreign driver's license exams with confidence. The brand is professional, trustworthy, and calm — the opposite of stressful test prep.

**Tagline:** Study smart. Drive legal.

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#0F2A44` | Primary brand, headers, CTA buttons |
| `navy-light` | `#1E4E79` | Secondary actions, hover states |
| `navy-dark` | `#0A1D30` | Footer background |
| `surface` | `#F8FAFC` | Page background |
| `surface-white` | `#FFFFFF` | Cards, content areas |
| `text-primary` | `#0F172A` | Body text |
| `text-secondary` | `#475569` | Supporting text, English translations |
| `text-muted` | `#94A3B8` | Hints, timestamps, metadata |
| `success` | `#15803D` | Correct answers, passing scores |
| `warning` | `#D97706` | Borderline scores, attention items |
| `error` | `#B91C1C` | Incorrect answers, failing scores |
| `spanish` | `#0F2A44` | Spanish text (matches navy) |
| `english` | `#475569` | English translation text |
| `official` | `#92400E` | Official government translation |

## Typography

**Font:** Inter (Google Fonts)

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| H1 | `text-3xl` / `md:text-4xl` | `font-bold` | `text-navy` |
| H2 | `text-2xl` / `md:text-3xl` | `font-bold` | `text-navy` |
| H3 | `text-xl` / `md:text-2xl` | `font-semibold` | `text-text-primary` |
| Body | `text-base` | `font-normal` | `text-text-primary` |
| Small | `text-sm` | `font-normal` | `text-text-secondary` |
| Muted | `text-sm` | `font-normal` | `text-text-muted` |

## Bilingual Display Pattern

Spanish text displays as primary (bold navy). English translation sits below with a left border accent:

```
[Spanish text — bold, navy]
│ English translation — regular, secondary gray
```

Official government English translations display in amber italic when toggled:

```
[Spanish text — bold, navy]
│ *Official test version — italic, amber*
```

## Component Patterns

### Buttons
- **Primary:** Navy background, white text, rounded-lg
- **Secondary:** White background, navy border + text
- **Ghost:** Transparent, secondary text, hover to navy
- All buttons: min 48x48px touch target, `transition-colors duration-150`

### Cards
- White background, 1px border (`border-border`), rounded-lg, shadow-sm, p-6

### Progress Bars
- Height: 8px, rounded-full
- Background: `bg-border` (gray track)
- Fill: `bg-success` (green), `bg-warning` (amber), `bg-error` (red) based on score
- No animations beyond smooth width transition

## Anti-Gamification Rules

- No streaks, confetti, badges, or celebration animations
- No "Great job!" / "Amazing!" / "You're on fire!" messaging
- Use: "16/20 correct — Passed" not "Congratulations! You PASSED!"
- Progress = percentages and mastery levels, not points or XP
- Feedback is specific: "Review questions about right-of-way rules" not "Keep it up!"

## Mobile-First Principles

- Base styles = mobile. Use `sm:`, `md:`, `lg:` for larger screens
- `min-h-dvh` for full viewport height
- Touch targets: 48x48px minimum
- Bilingual text stacks vertically (Spanish top, English below)
- Sticky progress bar during exams (bottom on mobile, top on desktop)
- Zero layout shift: pre-allocate space for translations and images

## SEO

- Every page has unique title, meta description, canonical URL
- Open Graph + Twitter Card meta on all pages
- JSON-LD structured data per page type
- `noindex` on progress/dashboard pages (personal data)
