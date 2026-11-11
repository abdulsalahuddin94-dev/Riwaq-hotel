# Decision log

| Date | Decision | Status |
|---|---|---|
| 2026-11-10 | The repo is reworked from the TrianglZ HMS demo into **Riwaq**, a demo for a Gulf heritage hotel. | Decided |
| 2026-11-10 | **Demo/prototype only, no backend.** State lives in the browser (localStorage). Server-side permissions, idempotency and PMS integration from spec §17/§22 are out of scope until this changes. | Decided (owner) |
| 2026-11-10 | The visual direction is drawn from operating Gulf heritage hotels (see `design-direction.md`). | Decided |
| 2026-11-10 | The demo property is fictional ("Demo Heritage Palace") and its 5 floors are presented as wings. | Assumption |
| 2026-11-10 | Heritage assets carry no care procedure. Every one is marked "awaiting specialist approval: report, don't treat". | Decided (spec §11) |
| 2026-11-10 | A heritage-surface report does not block the room automatically. Triage decides (spec §11). | Decided (spec §11) |

## Still OPEN (spec §25)
Launch country and property · PMS provider · inspection and release authority · heritage SOP owner · BYOD policy · data retention and residency · SLA configuration · brand clearance for "Riwaq" · multi-property rollout · audio strategy · accessibility target.

## Known gaps in the demo (to do next)
- The UI is English, with Arabic only in some labels. Full Arabic RTL is not done yet.
- There is no simulated offline outbox yet. Sync states should follow spec §14 ("Saved locally", "Queued", "Received", and so on).
- PMS confirmation is shown only as "not connected". A clearly labelled mock PMS acknowledgement could be added.
- Independent-inspection rule: the demo does not yet block a supervisor from approving their own cleaning.

## 2026-11-10 updates
- **Arabic typeface: Thmanyah** (owner's choice). Its licence forbids hosting, redistributing or making the font files downloadable, which includes web embedding that lets users extract them. So the repo contains **no font files**: `src/styles.css` references only copies installed on the device via `local()`, and other devices fall back to IBM Plex Sans Arabic. Shipping it on a public site needs an extended licence from thmanyah (ask@thmanyah.com). OPEN.
- **The UI reads like a real product** (owner's request): no "DEMO" pills or demo wording in the app. Account switching and "Restore sample data" live in the account menu. PMS status still says "not connected", because that is true.
- Heritage notices are English-only until a language switch exists. Each notice will then show a single language.

## 2026-11-11 updates
- **Dashboard direction: "calm ledger" plus an arrivals timeline** (owner's pick). The Live Board opens with "Needs you now", room tiles are quiet and only exceptions get a fill, Front Desk and Reports drop their metric-card rows, and Front Desk gets an arrivals timeline with estimated ready times. Each escalation row has one primary action.
