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
