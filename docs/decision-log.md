# Decision log

Why the product is the way it is. **Add a row whenever you make a choice someone else might question later** (a design direction, a scope cut, a rule, a library). Small code changes go only in `CHANGELOG.md`; decisions go here too.

Format: newest at the bottom of each table. `By` is the GitHub login of the person who decided (or `Claude for <login>` when Claude proposed and the person accepted). Status is `Decided`, `Assumption` (needs confirmation) or `OPEN`.

| Date | Decision | Why | By | Status |
|---|---|---|---|---|
| 2026-09-23 | Start as the TrianglZ HMS housekeeping demo (Lovable). MVP = answer Q1 who did the work, Q2 which checklist items, Q3 is the room ready. | Client pains from the brief (`research/housekeeping-research.md` §1). | abdulsalahuddin94-dev | Decided |
| 2026-09-23 | "Ready" is derived (vacant ∧ inspected ∧ unblocked), never set by hand. | OPERA/Cloudbeds research: single trusted readiness signal. | abdulsalahuddin94-dev | Decided |
| 2026-11-10 | Rework the repo into **Riwaq**, a demo for an authentic Gulf heritage hotel. | New primary spec `specs/riwaq-product-spec.md`. | abdulsalahuddin94-dev | Decided |
| 2026-11-10 | **Demo/prototype only, no backend.** State lives in localStorage. Server permissions, idempotency and PMS integration (spec §17/§22) are out of scope. | Goal is a clickable prototype, fast iteration. | abdulsalahuddin94-dev | Decided |
| 2026-11-10 | Visual direction from operating Gulf heritage hotels (`design-direction.md`). | Authentic, not generic luxury. | abdulsalahuddin94-dev | Decided |
| 2026-11-10 | Fictional property **Dar Al Majlis «دار المجلس»**; its 5 floors are shown as wings. | No real hotel's brand may be used. | abdulsalahuddin94-dev | Decided |
| 2026-11-10 | Heritage assets carry no care procedure: "awaiting specialist approval: report, don't treat". | Spec §11; inventing conservation steps could damage real assets. | spec | Decided |
| 2026-11-10 | A heritage-surface report does not block the room automatically; triage decides. | Spec §11. | spec | Decided |
| 2026-11-10 | **Arabic typeface: Thmanyah**, via `local()` only, fallback IBM Plex Sans Arabic. No font files in the repo. | Owner's choice; licence forbids hosting/embedding. Public use needs an extended licence (ask@thmanyah.com). | abdulsalahuddin94-dev | Decided (licence OPEN) |
| 2026-11-10 | The UI reads like a real product: no "DEMO" pills. Account switch and "Restore sample data" live in the account menu. PMS status still says "not connected". | Owner's request; honesty kept where it matters. | abdulsalahuddin94-dev | Decided |
| 2026-11-10 | UI work follows **impeccable** and **Intent** design skills (see `AGENTS.md`). | Consistent critique/polish and WCAG checks across people. | abdulsalahuddin94-dev | Decided |
| 2026-11-10 | Finished work is merged into `main` automatically after checks pass (no waiting for review). | Fast iteration; `main` syncs to Lovable. | abdulsalahuddin94-dev | Decided |
| 2026-11-11 | Dashboard direction "calm ledger" + arrivals timeline: Needs-you-now strip first, quiet tiles (fill only for exceptions), no metric-card rows, one primary action per escalation. | Owner's pick among directions. | abdulsalahuddin94-dev | Decided |
| 2026-11-11 | **Picture-first mobile app and illustrated sign-in.** Original SVG illustrations (no photos, no generated raster yet): courtyard scene, room thumbnails with bed state, staff portraits, task pictograms. Mobile sign-in = job picture → face → PIN. Desktop sign-in = split screen at dusk. Board gets a welcome hero with one readiness gauge (partly supersedes "no progress rings" from the calm-ledger row). | Owner: the app looked boring, field staff are low-literacy users; referenced Vision UI-style hero cards and glow. | abdulsalahuddin94-dev | Decided |
| 2026-11-11 | Repo is the shared brain: `CLAUDE.md`/`AGENTS.md` entry, `docs/` for research, IA, sitemap, design system, and a `CHANGELOG.md` every contributor (and their Claude) updates. | Two people (abdulsalahuddin94-dev, EmG38) each work through their own Claude sessions. | abdulsalahuddin94-dev | Decided |

## Still OPEN (spec §25)
Launch country and property · PMS provider · inspection and release authority · heritage SOP owner · BYOD policy · data retention and residency · SLA configuration · brand clearance for "Riwaq" · multi-property rollout · audio strategy · accessibility target.

## Known gaps in the demo (to do next)
- The UI is English, with Arabic only in some labels. Full Arabic RTL is not done yet. Heritage notices will show a single language once a language switch exists.
- No simulated offline outbox yet. Sync states should follow spec §14 ("Saved locally", "Queued", "Received", …).
- PMS confirmation is shown only as "not connected". A clearly labelled mock PMS acknowledgement could be added.
- Independent-inspection rule: the demo does not yet block a supervisor from approving their own cleaning.
