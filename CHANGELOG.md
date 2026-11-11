# Changelog

What changed, **who** changed it, and **why**. Newest first. Every merge into `main` adds an entry (Claude does this automatically; see `docs/workflow.md`).

Entry format:

```
## YYYY-MM-DD · <short title> · @<github-login>
- **What:** the change, in plain words (screens/files touched).
- **Why:** the reason or the request behind it. Link a decision if there is one.
- **Decisions:** any choice made along the way (also add it to docs/decision-log.md). "None" if none.
- **PR:** #<number>
```

Use `@<login>` of the person who asked for the change, even when Claude wrote the code. Lovable edits made directly in the Lovable editor appear as `gpt-engineer-app[bot]` in git; add an entry for them the next time you work, if they matter.

---

## 2026-11-11 · Shared repo context, docs and changelog · @abdulsalahuddin94-dev
- **What:** Added `CLAUDE.md` (entry point for any Claude session), `CHANGELOG.md`, `docs/README.md` (docs index), `docs/workflow.md` (how two people + Claude work together), `docs/sitemap.md`, `docs/information-architecture.md`, `docs/design-system.md`, `docs/research/` (housekeeping research, v1 user flows and data schema, raw inputs, hotel link directory), and a PR template. Reworked `docs/decision-log.md` with Why/By columns. Updated `AGENTS.md` and `README.md` for the new repo name.
- **Why:** EmG38 and Abdul each open the repo in their own Claude; the repo itself must carry the research, IA, sitemap, design system and the history of who decided what.
- **Decisions:** The repo is the shared brain; every merge updates this changelog; decisions also go in `docs/decision-log.md`.
- **PR:** see GitHub (branch `claude/project-thread-8z2s9s`)

## 2026-11-11 · Dashboard: Needs-you-now, quiet tiles, arrivals timeline · @abdulsalahuddin94-dev
- **What:** Live Board opens with a Needs-you-now strip; room tiles are quiet, only exceptions get a fill; Front Desk and Reports lose their metric-card rows; Front Desk gets an arrivals timeline with estimated ready times; one primary action per escalation.
- **Why:** The board looked busy; the owner picked the "calm ledger" direction.
- **Decisions:** Dashboard direction "calm ledger + arrivals timeline".
- **PR:** #3

## 2026-11-10 · impeccable + Intent design pass · @abdulsalahuddin94-dev
- **What:** Applied impeccable critique/polish and Intent heuristics/WCAG checks across the Riwaq UI; added `PRODUCT.md` and `DESIGN.md`.
- **Why:** Consistent design quality and accessibility; shared design tooling for the team.
- **Decisions:** UI work follows impeccable + Intent.
- **PR:** #2

## 2026-11-10 · Rebrand to Riwaq; Thmanyah font; no demo wording · @abdulsalahuddin94-dev
- **What:** Rebranded TrianglZ HMS to Riwaq (arch mark, juss/brass palette, wings, Gulf staff and guests, heritage assets with "awaiting specialist approval"); cleaned the top bar; Thmanyah Arabic font via `local()`; removed "Demo" pills (presenter controls moved into the account menu); added `docs/specs/` and `docs/decision-log.md`.
- **Why:** New primary spec for a Gulf heritage hotel; owner wants it to read like a real product.
- **Decisions:** No backend; fictional property Dar Al Majlis; Thmanyah local-only (licence); auto-merge to main.
- **PR:** #1

## 2026-09-23 · TrianglZ HMS demo (pre-Riwaq) · @abdulsalahuddin94-dev
- **What:** Built in Lovable plus local edits: app shell, Live Board, mobile role screens, interactive checklist/inspection/work orders, Apple-style refinement, board without horizontal scroll, Reports with PNG/CSV export.
- **Why:** First demo answering the client's Q1–Q3 (who did the work, which items, is the room ready).
- **Decisions:** Ready is derived, never set by hand. See `docs/research/housekeeping-research.md`.
- **PR:** none (direct commits)
