# Information architecture

How Riwaq organises people, places, work and status. The **sitemap** (`sitemap.md`) lists the screens; this file explains the structure behind them. The spec reference is `specs/riwaq-product-spec.md` §5–§8.

## 1. Two surfaces, split by job
| Surface | URL prefix | Device | Who | Mental model |
|---|---|---|---|---|
| Operations console | `/app/*` | Desktop | Manager, Front Desk, Admin | "Watch the whole property, act on exceptions." |
| Field app | `/m/*` | Phone (glove-friendly) | Attendant, Supervisor, Engineer | "My next job, done right, in few taps." |

The mobile app is **mobile-native**, not a responsive copy of the console. Each persona gets its own bottom tabs (see `sitemap.md`).

## 2. Place hierarchy
```
Property  «دار المجلس» Dar Al Majlis (fictional)
└── Wing  (floors are presented as wings around courtyards)
    1 Courtyard Wing · 2 Najdi Wing · 3 Palm Garden Wing · 4 Fort Tower · 5 Royal Wing
    └── Room  (number, type: Heritage Room · Courtyard Room · Twin Room · Suite)
        └── Heritage assets  (material, sensitivity, "awaiting specialist approval")
```
Source of truth: `wings` and `buildSeed()` in `src/lib/demo-data.ts`.

## 3. Room status is several dimensions
Never merge these into one field (research finding, see `research/README.md`).

| Dimension | Values in code | Who changes it |
|---|---|---|
| Occupancy | `VACANT`, `OCCUPIED` | Front desk / PMS (simulated) |
| Housekeeping | `DIRTY → IN_PROGRESS ↔ PAUSED → CLEAN → INSPECTED` | Attendant, then Supervisor |
| Task type | `DEPARTURE`, `STAYOVER`, `RECLEAN`, `POST_REPAIR` | Assignment / failed inspection / closed work order |
| Service overlay | DND, queue guest (guest waiting) | Attendant / Front desk |
| Availability block | `OOO` (out of order), `OOS` (out of service) | Engineering / Manager |
| Accountability signal | `TOO_FAST`, `BULK_TICK`, `NO_START`, `OFFLINE_CONFLICT` | Detected automatically |

The board shows one **derived** display status (`RoomStatus`): `READY`, `AWAITING_INSPECTION`, `CLEANING`, `DIRTY`, `DND`, `BLOCKED_OOO`, `BLOCKED_OOS`, `OCCUPIED` (labels, Arabic labels and icons in `statusMeta`).

**Ready rule:** vacant ∧ inspected ∧ no OOO/OOS ∧ no blocking work order. It is shown as **"Ready (internal)"** because no PMS confirms it.

## 4. Work objects
| Object | Lifecycle (code) | Created by | Seen on |
|---|---|---|---|
| Cleaning task (per room) | housekeeping states above | Assignment | `/m/rooms`, board, team |
| Checklist (zones) | items ticked with who + when | Template per task type | `/m/rooms/:id/checklist` |
| Inspection | pass / fail with score; fail → `RECLEAN` | Supervisor | `/m/inspections/:id`, room drawer |
| Work order | `OPEN → ACCEPTED → IN_PROGRESS → RESOLVED → VERIFIED` | Anyone reports, engineering works | `/app/work-orders`, `/m/work-orders` |
| Incident / heritage report | reported → triaged (never auto-blocks) | Attendant / Supervisor | Escalations, room drawer |
| Escalation | derived from SLAs and anomalies | System | Needs-you-now strip, `/app/escalations` |
| Audit event | append-only | Every action | Event log dialog |

## 5. People and permissions
Roles in code: `ATTENDANT`, `SUPERVISOR`, `MANAGER`, `FRONT_DESK`, `ENGINEER`, `ADMIN`. Desktop personas: Manager, Front Desk, Admin. Mobile personas: Attendant, Supervisor, Engineer. The spec's capability model (§6) is the target; the demo enforces only simple role checks client-side. Key rule not yet enforced: a supervisor must not approve their own cleaning (`decision-log.md`, known gaps).

## 6. Navigation principles
- The console opens on the Live Board, which leads with "Needs you now".
- Details open in drawers and dialogs, so the manager never loses the board.
- On the phone every screen has one primary action (64px footer button).
- Status is always colour + icon + words.

## 7. Data and persistence
- All state is one object in `localStorage` key `riwaq-demo-state-v1` (`src/lib/hms-store.ts`, `VERSION` bump resets old saves).
- Seed data: `src/lib/demo-data.ts`. "Restore sample data" in the account menu re-seeds.
- No server, no auth, no PMS. Anything that looks external is simulated and labelled.
