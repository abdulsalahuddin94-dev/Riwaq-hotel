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

## 2026-11-12 · Wing-specific room drawer photography · @abdulsalahuddin94-dev
- **What:** Added four distinct generated wing photographs and a faded drawer header with wing identity, room type/task icons and existing VIP/Queue/Alert/Re-clean tags. Existing Courtyard Wing keeps its courtyard photo.
- **Why:** Owner requested a visual wing-level header instead of a long descriptive line.
- **Decisions:** Preserve all wing and room-type assignments; tags reflect existing data only. No operational changes.
- **PR:** Not created; direct Lovable edit.

## 2026-11-12 · Sign-in-first preview flows · @abdulsalahuddin94-dev
- **What:** Home opens desktop sign-in, or mobile shift sign-in on phones. Switching experiences also opens sign-in. Verified desktop submission and all three mobile job → person → PIN flows; two entry-routing tests pass.
- **Why:** Owner asked both dashboard and mobile flows to start at the login screen.
- **Decisions:** Presentation routing only; no real authentication or access protection added. Deep links stay accessible.
- **PR:** Not created; direct Lovable edit.

## 2026-11-12 · Refined hotel welcome photography · @abdulsalahuddin94-dev
- **What:** Replaced the Live Board welcome image with a generated daylight luxury heritage lounge; retained greeting, readiness gauge and all workflows. Completed social metadata on existing detail pages.
- **Why:** Owner said the pictured interior felt primitive rather than hotel-like.
- **Decisions:** Change the referenced welcome photograph only; fictional property, no real hotel, people, text or logos. Existing images remain available. Logged in `docs/decision-log.md`.
- **PR:** Not created; direct Lovable edit.

## 2026-11-12 · Dar Al Majlis is the front brand (desktop) · @abdulsalahuddin94-dev
- **What:** Desktop `/login` left side now shows the hotel lockup (Arabic «دار المجلس» over "DAR AL MAJLIS", tight and start-aligned, "Heritage Hotel · فندق تراثي"); footer reads "© 2026 Dar Al Majlis Hotel · Powered by RIWAQ Systems". Sidebar brand shows the hotel name with "Powered by Riwaq Systems". Desktop tab titles end with "· Dar Al Majlis"; chart exports credit the hotel. Files: `mobile-pages.tsx` (DesktopLoginPage only), `desktop-shell.tsx`, `reports-page.tsx`, `src/routes/app/*`, `login.tsx`, `index.tsx`, `__root.tsx`, `styles.css`.
- **Why:** Owner: the Arabic and English sat far apart, and hotel staff shouldn't see RIWAQ more than their own hotel. A Dar Al Majlis website is planned.
- **Decisions:** Riwaq = vendor credit only. Mobile screens are left to the mobile redesign work to avoid conflicts. Logged in `docs/decision-log.md`.
- **PR:** #11

## 2026-11-12 · Thmanyah from a local, git-ignored folder · @abdulsalahuddin94-dev
- **What:** New `public/fonts/thmanyah/` (git-ignored except its README) and `src/lib/local-fonts.ts`: on a local dev server the app loads Thmanyah `.woff2` files from that folder, so nobody has to install the font in their OS. Setup steps in the folder README, the main README and `CLAUDE.md` (Claude reminds a new teammate on first run). Font stacks in `src/styles.css` gained "Riwaq Arabic Files" / "Riwaq Arabic Display Files".
- **Why:** Owner wants @EmG38 to work with the same font as soon as she clones the repo. The licence forbids putting the files in the repo, so each person downloads them once from font.thmanyah.com.
- **Decisions:** Files never committed; the shared Lovable preview never requests them. Logged in `docs/decision-log.md`.
- **PR:** #9

## 2026-11-12 · Closer Arabic web fallback for Thmanyah · @abdulsalahuddin94-dev
- **What:** Arabic text now falls back to **Almarai** (UI) and **Markazi Text** (brand «رِواق», display) from Google Fonts instead of IBM Plex Sans Arabic. Thmanyah still comes first via `local()` where installed. Files: `src/styles.css`, `src/routes/__root.tsx`, design docs.
- **Why:** Owner asked why the chosen Arabic font doesn't show on Lovable. Thmanyah's licence keeps its files off the web, so anyone without it installed saw Plex; this makes them see something close.
- **Decisions:** Fallback picked by rendering ten free sans and nine free display fonts next to the real Thmanyah files. Font files still not committed. Logged in `docs/decision-log.md`.
- **PR:** #8

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
