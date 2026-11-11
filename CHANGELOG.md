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

## 2026-11-11 · Generated photos for sign-in, board hero and rooms · @abdulsalahuddin94-dev
- **What:** Seven AI-generated photos in `src/assets/photos/` (WebP, 42–139 KB): courtyard at dusk (desktop `/login`), courtyard at dawn (mobile `/m/login`), majlis at night (Live Board welcome hero) and one photo per room type (Heritage, Courtyard, Twin, Suite) used on mobile room cards, inspection cards and the room-detail banner. New `RoomPhoto` component and `photos` map in `illustrations.tsx`. SVG pictograms, avatars and job pictures stay.
- **Why:** Owner asked for more creative generated imagery that expresses the project instead of drawn scenes.
- **Decisions:** Images were generated with Lovable's image generation (owner's pick; Figma was view-only and Gemini MCP lives only on the owner's PC) in a separate scratch Lovable project. Prompts forbid people, text, logos and any real hotel. Logged in `docs/decision-log.md`.
- **PR:** #7

## 2026-11-11 · Pictures everywhere: illustrated sign-in, picture-first mobile, board welcome hero · @abdulsalahuddin94-dev
- **What:** New `src/components/hms/illustrations.tsx` (original SVG: courtyard scene, room interiors per type with bed state, staff portraits, job pictures, empty-state art, tinted pictograms + icon maps). Desktop `/login` is a split screen (courtyard at dusk + night form, remember-me switch, link to the staff app). Mobile `/m/login` is full-screen and picture-first: pick your job → tap your face → PIN. Mobile rooms, room detail (banner), checklist (pictogram per item), issue/pause/skip sheets, jobs, inspections, Me and empty states all carry pictures. Live Board opens with a welcome hero (greeting, dusk courtyard, readiness gauge). `MobileShell` gained a `bare` mode.
- **Why:** Owner said the app had no visuals and looked boring; field staff are low-literacy users, so pictures must carry meaning. Owner shared Vision UI screenshots as the mood (hero cards, glow, split sign-in).
- **Decisions:** Original hand-drawn SVG only (no photos, no real hotel imagery); pictures never replace words or status chips; one readiness gauge allowed in the welcome hero. Logged in `docs/decision-log.md`.
- **PR:** #6

## 2026-11-11 · Shared repo context, docs and changelog · @abdulsalahuddin94-dev
- **What:** Added `CLAUDE.md` (entry point for any Claude session), `CHANGELOG.md`, `docs/README.md` (docs index), `docs/workflow.md` (how two people + Claude work together), `docs/sitemap.md`, `docs/information-architecture.md`, `docs/design-system.md`, `docs/research/` (housekeeping research, v1 user flows and data schema, raw inputs, hotel link directory), and a PR template. Reworked `docs/decision-log.md` with Why/By columns. Updated `AGENTS.md` and `README.md` to point to all of it.
- **Why:** EmG38 and Abdul each open the repo in their own Claude; the repo itself must carry the research, IA, sitemap, design system and the history of who decided what.
- **Decisions:** The repo is the shared brain; every merge updates this changelog; decisions also go in `docs/decision-log.md`.
- **PR:** #5

## 2026-11-11 · Thmanyah: map all weights in local() · @abdulsalahuddin94-dev
- **What:** `src/styles.css` maps every Thmanyah weight in `local()` `@font-face` rules; Arabic sub-labels prefer Thmanyah.
- **Why:** The new Arabic font wasn't showing; only some installed weights were matched.
- **Decisions:** Still local-only, no font files in the repo (licence).
- **PR:** #4

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
