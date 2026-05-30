# Session Log — expat-driver-license-prep

Entries are newest-first. Each entry documents one Claude Code working session.

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
