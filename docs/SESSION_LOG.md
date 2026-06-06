# Session Log — expat-driver-license-prep

Entries are newest-first. Each entry documents one Claude Code working session.

---

## Session: 2026-06-04

### Accomplished

- Strategic review of repo (new four-layer `strategic-review` skill, created this session at ~/.claude/skills/strategic-review/); compared against Codex review of same repo, merged best findings.
- PR #34: standalone SEO guide pages (/countries/mexico/jalisco/{process,insurance,rental}) + region waitlist EmailCapture on homepage (Formspree). Merged, verified live.
- PR #35 (P0): Upstash sliding-window rate limiting (per-min + per-hour, per IP) + input bounds on all 3 paid routes (explain/readiness/synthesize). Fail-open until Upstash env vars exist. New @lib/server/{rate-limit,api-validation} + 15 tests (74 total). Verified 400s in prod.
- PR #36: ContentProvenance trust signals (hub/exam/guides), README truth pass (env-vars falsehood, storage claim, region roadmap), CLAUDE.md updates, `pnpm check` added to CI gate.
- PR #37: batched 7 stale Dependabot PRs into one deploy (marked 18 major verified, react 19.2.5, sentry 10.48, vitest 4.1.4, pnpm/action-setup v6); closed #19-24, #26. Dependabot alerts: 0 open.
- docs/VENUE_POSTS.md: ready-to-paste distribution copy per venue (Chapala board, FB groups, Reddit ES/EN comments, MND/PVDN pitches, broken-link outreach).

### Decisions Made

- Rate limiter fails open (missing env vars or Redis outage → allow + warn): feature availability over strictness; lets code merge before Upstash is connected.
- Dependency bumps batched, not merged per-PR: Vercel Hobby deploy quota (1 deploy vs 7).
- Deferred: activation analytics events (Vercel custom events likely paid-tier — verify before building), programmatic sign SEO pages (next session), region data loader (trigger: CDMX content scheduled).

### Immediate Next Steps

- [ ] Robert: connect Upstash via Vercel marketplace (env vars auto-inject; limiter activates next deploy — spec provided in chat 2026-06-04).
- [ ] Robert: post Tier 1 venues (Chapala webboard + 2 Lakeside FB groups) using docs/VENUE_POSTS.md.
- [ ] Build programmatic road-sign SEO pages (67 indexable pages from sign-metadata.json).
- [ ] Verify whether @vercel/analytics custom events work on Hobby; if not, decide on alternative before instrumenting activation.

### Technical Debt

- content/ vs public/data/ dual copies still hand-synced (fix-spanish.py double-writes); add validation/sync script before any new region content.
- Mid-exam state not persisted (refresh loses a 20-question run) — ExamSimulator.tsx.

### Open Questions / Blockers

- jalisco-059 still unresolved (three official sources disagree; needs verified image + answer key) — now documented in CLAUDE.md Known Issues.

---

## Session: 2026-05-30

### Accomplished

- Audited all 56 road signs on /countries/mexico/jalisco/signs; found the project's code→meaning table was fictional, so 15+ images were wrong (6 on live exam quiz questions) and "untouched" signs were mis-coded too (SP-17/17A are "Merge", not narrowing; SR-10 is really SR-37).
- Rebuilt `public/data/jalisco/sign-metadata.json` as 67 authentic entries (real SICT code ↔ real image ↔ official SCT meaning). Every image downloaded from Wikimedia Commons and visually verified (rasterized via sharp) against its official ImageDescription.
- Re-pointed all 14 image-bearing exam questions to canonical entries (e.g. clearance SR-11→SR-15, width SR-13→SR-16, no-stopping SR-23→SR-20, ag-machinery SR-27→SR-29, narrow-bridge SP-25→SP-23, asymmetric-narrowing SP-17A→SP-21).
- Hand-authored 3 clean driver hand-signal SVGs (old AI-poster art literally printed "ALTO", revealing quiz answer) + verified them. Synced content/ source copies. Removed 27 orphan files.
- Merged PR #29 to main (squash, 5803326). 59 tests pass; build prerenders signs page.

### Decisions Made

- Source of truth = official SCT catalog (Wikimedia Commons), keyed by real SICT codes — not the project's invented codes. Chose authentic triples over patching to eliminate the recurring image/code/description drift.
- Kept custom SVGs for the two informational signs (exit/free-width, j-071/072) — teaching-correct, no clean authentic source.

### Immediate Next Steps

- [x] Live Playwright click-through on production: gallery 67/67 images load, quiz 14/14 render — clean.
- [x] Answer-key audit of all 103: answers correct except jalisco-059. Fixed stale "15 signs" header copy (PR #30, merged 8e1404d).
- [ ] Resolve jalisco-059 against the OFFICIAL Jalisco answer key, then restore it with verified image + answer and remove the generateExam exclusion.

### Technical Debt

- The displayed sign `id` codes are now real SICT codes, but a future SICT manual edition could renumber a few; not exam-impacting.
- jalisco-059 excluded from the practice exam via a `generateExam` filter (src/lib/question-bank.ts) — temporary until its image/answer is verified.

### Open Questions / Blockers

- **jalisco-059 answer is unverifiable from public sources.** No image, and three Jalisco sources give three different answers for the same options (app: "Vuelta continua a la derecha"; licencia-conducir.com: "Codo inverso"; escuelasdemanejovertiz.com Gobierno-de-Jalisco PDF: "Entronque lateral derecho") because the answer depends on the missing image. Needs official answer key. Likely the app's answer is wrong (image probably a "codo inverso") — ~70% confidence, not changed on a guess.

---

<!-- New entries go above this line -->
