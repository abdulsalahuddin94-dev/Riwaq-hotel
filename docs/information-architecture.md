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
    1 Marina Wing · 2 Lagoon Wing · 3 Palm Wing · 4 Dune Wing · 5 Oasis Wing   (same as the staff app, EmG38/hotel-hearth-ops)
    └── Room  N01–N20 per wing (type: Standard 01–12 · Deluxe 13–17 · Suite 18–20)
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
| Work order | `OPEN → ACCEPTED → IN_PROGRESS → RESOLVED → VERIFIED` (data kept; no dashboard page since 2026-11-18) | Anyone reports | `/m/work-orders` only; rooms still show OOO/OOS blocks |
| Incident / heritage report | reported → triaged (never auto-blocks) | Attendant / Supervisor | Room drawer |
| Escalation | derived from SLAs and anomalies (queue SLA, DND welfare) | System | Notification bell |
| Guest request | `pending → acknowledged → completed` (or `cancelled` by reception) | Front Desk | Front Desk page, bell (reception), supervisor phone alerts |
| Reservation | `expected → checked_in` / `no_show` / `cancelled`; follow-ups logged | Front Desk | `/app/reservations`, bell, room arrival on the board once a room is assigned |
| User | active / deactivated; PIN or temporary password shown once | Manager / Admin | `/app/users`, staff app sign-in |
| Audit event | append-only | Every action | Event log dialog |

## 5. People and permissions
Roles in code: `ATTENDANT`, `SUPERVISOR`, `MANAGER`, `FRONT_DESK`, `ENGINEER`, `ADMIN`. `ENGINEER` stays in the data but is not offered on the Users page or the staff sign-in since 2026-11-18 (maintenance isn't in the staff app). Users are created on `/app/users`: staff-app jobs sign in with job → photo → PIN (PD-01), dashboard jobs with email. Desktop personas: Manager, Front Desk, Admin. Mobile personas: Attendant, Supervisor. The spec's capability model (§6) is the target; the demo enforces only simple role checks client-side. Key rule not yet enforced: a supervisor must not approve their own cleaning (`decision-log.md`, known gaps).

## 6. Navigation principles
- The console opens on the Live Board. What needs someone now lives in the **notification bell** on every page (2026-11-18), not in a strip on the board.
- Reception sees room status and sends requests; room details (checklist, timings, signals) are for the supervisor on the phone.
- Details open in drawers and dialogs, so the manager never loses the board.
- On the phone every screen has one primary action (64px footer button).
- Status is always colour + icon + words.

## 7. Data and persistence
- All state is one object in `localStorage` key `riwaq-demo-state-v1` (`src/lib/hms-store.ts`, `VERSION` bump resets old saves).
- Seed data: `src/lib/demo-data.ts`. "Restore sample data" in the account menu re-seeds.
- No server, no auth, no PMS. Anything that looks external is simulated and labelled.
