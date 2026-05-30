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

- [ ] Native/local click-through of the live quiz on production to confirm in-browser rendering + behavior of all 14 sign questions.
- [ ] Sanity-check the exam answer key in questions.json itself (images were matched TO the answers; answers taken as given).

### Technical Debt

- The displayed sign `id` codes are now real SICT codes, but a future SICT manual edition could renumber a few; not exam-impacting.

### Open Questions / Blockers

- None.

---

<!-- New entries go above this line -->
