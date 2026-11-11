# SPEC_USER_FLOWS.md — User Journeys & Logic Triggers

> **Project**: TrianglZ Hotel — Housekeeping Management System (HMS)
> **Phase**: 2 of 5 (Research ➔ Flows) · built on `SPEC_RESEARCH.md`
> **Generated**: 2026-09-23 · Initial Setup Mode
> **Legend**: 🟢 MVP (Phase 1) · 🟡 Phase 2 · ⚪ Phase 3 · `[EVT]` = event written to the audit log · `HK:` = housekeeping condition · `READY` = derived readiness (see `SPEC_DATA_SCHEMA.md §3`)

---

## 0. The Room Lifecycle (the spine every flow hangs on)

```
                   ┌──────────── Reject (score < pass) ─────────────┐
                   ▼                                                │
 Check-out ─▶ HK: DIRTY ─▶ HK: IN_PROGRESS ⇄ HK: PAUSED ─▶ HK: CLEAN ─▶ HK: INSPECTED ─▶ (derived) READY ─▶ Check-in ─▶ Occupied
   [EVT]        ▲  [EVT] Start          [EVT] Pause/Resume   [EVT] Mark Clean   [EVT] Approve                     [EVT]
                │
 Stayover day ──┘ (occupied rooms become DIRTY at day roll-over unless DND / guest refused)

 Overlays at any point:  DND · OOO (hard block) · OOS (soft block) · QUEUE (guest waiting) · DISCREPANCY
```

Rules that apply to every flow:
- **R-A (Attribution)**: every transition writes an `[EVT]` with `actor_id`, `room_id`, `from`, `to`, `timestamp`, `device_id`, `offline_flag`.
- **R-B (No manual READY)**: nobody can "set" READY. It is computed. Front Desk can only *see* it.
- **R-C (Checklist gate)**: `Mark Clean` is disabled until every **mandatory** checklist item is ticked.
- **R-D (Own-work rule)**: an attendant can only start/tick rooms assigned to them; Supervisor+ can override (logged as override).

---

## 🟢 Flow 1 — Sign-in & Shift Start (P1 Attendant / P2 Supervisor / P5 Engineer — mobile)

**Trigger**: staff opens PWA at shift start.

1. Screen `M-01 Login`: select name from **team avatar grid** (photo + name) ➔ enter **4–6 digit PIN** (large keypad, 64px keys).
   - Alt 🟡: tap NFC staff card.
   - Language chip (🇸🇦 AR / 🇬🇧 EN …) always visible top-end; switching re-renders instantly (RTL/LTR) without logout.
2. System validates PIN ➔ `[EVT] SHIFT_STARTED` ➔ opens `M-02 My Rooms`.
3. **Errors**: wrong PIN ×5 ➔ account locked 5 min, supervisor notified. No network ➔ cached session allowed only if a session exists from the same device in the last 12h (offline banner shown).
4. **Empty**: no rooms assigned yet ➔ illustration + "Your supervisor hasn't assigned rooms yet" + `Refresh` button.

---

## 🟢 Flow 2 — Morning Assignment (P3 Manager or P2 Supervisor)

**Trigger**: before shift start (default 07:30), or anytime rooms change.

1. `W-03 Assignment Board`: columns = attendants on shift; left rail = **Unassigned rooms**, pre-sorted: Queue ⚡ ➔ VIP arrival 👑 ➔ Due-out/Departed ➔ Arrivals today ➔ Stayovers ➔ Vacant dirty.
2. Manager clicks **Auto-assign** ➔ system proposes a split by floor clusters and **credits** (room-type weights, e.g. Suite = 2.0, Standard departure = 1.0, Stayover = 0.5) ➔ manager adjusts by **drag & drop** (desktop) or **multi-select ➔ Assign to…** (tablet/mobile).
3. `Publish` ➔ `[EVT] ROOM_ASSIGNED` per room ➔ push to each attendant: "You have 14 rooms today".
4. Reassign during the shift ➔ `[EVT] ROOM_REASSIGNED (from, to, reason)`; if the room was `IN_PROGRESS`, the checklist progress **stays with the room**, and completed items keep the original actor.
5. **Validation**: can't assign OOO rooms; warning (not block) if one attendant exceeds the target credit (default 16).

---

## 🟢 Flow 3 — Clean a Room (P1 Attendant — mobile) ★ core for Q1 + Q2

**Trigger**: attendant taps a room card in `M-02 My Rooms`.

1. `M-03 Room Detail`: room #, type, occupancy, reservation context (Due out 11:00 / Arrival 14:00), badges, guest notes (e.g. "extra pillows"), last-clean history.
2. Tap **Start Cleaning** (full-width, 64px) ➔ `HK: DIRTY ➔ IN_PROGRESS` ➔ `[EVT] CLEAN_STARTED` ➔ timer starts.
   - Guard: if the room is `DND` ➔ button replaced by **Flag DND** (Flow 6).
   - Guard: if the room is Occupied + guest inside ➔ attendant picks **Guest refused service** / **Come back later** (logged).
3. `M-04 Checklist` auto-selected by scenario (Departure / Stayover / Turnover / Deep / Turndown / Vacant check):
   - Items grouped by the **7-step SOP** zones; each item = icon + short label + optional reference photo.
   - Tap to tick ➔ item stores `done_by`, `done_at`. Untick allowed within the session (logged).
   - Items marked 📷 **require a photo** (default: made bed, bathroom vanity) — camera opens inline.
   - Items marked ⚠ are **mandatory**; optional items can be skipped with a reason chip ("N/A", "Out of stock").
   - Progress ring shows `9 / 22`.
4. **Pause** (break / called away / missing supplies) ➔ `HK: PAUSED`, timer paused ➔ `[EVT] CLEAN_PAUSED (reason)`; **Resume** reverses.
5. **Mark Clean** (enabled only when all mandatory items ✔) ➔ confirmation sheet showing the summary ➔ `HK: IN_PROGRESS ➔ CLEAN` ➔ `[EVT] CLEAN_COMPLETED (duration, items_done, items_skipped)` ➔ supervisor gets push "Room 304 ready for inspection" ➔ success toast + next-room suggestion.
6. **Anomaly flags** (auto, visible to Manager only, never blocking the attendant):
   - `TOO_FAST`: duration < 40% of the room-type standard (default Departure 30 min ➔ flag < 12 min).
   - `BULK_TICK`: ≥ 80% of items ticked within 60 seconds.
   - `NO_START`: room marked Clean without a Start event (e.g. bulk change) ➔ requires Supervisor+ with reason.
7. **Offline**: all steps work offline; events queue locally with device time + `offline_flag`; header shows 🟡 "3 updates waiting". On reconnect, the server re-validates transitions in order; conflicts ➔ Flow 11.

---

## 🟢 Flow 4 — Inspect & Release (P2 Supervisor — mobile) ★ core for Q3

**Trigger**: push notification or `M-06 Inspection Queue` (sorted: Queue ⚡ with countdown ➔ VIP ➔ arrivals today ➔ rest).

1. Open room ➔ tap **Start Inspection** ➔ `[EVT] INSPECTION_STARTED`.
2. `M-07 Inspection Form`: 4 zones (Bedroom, Bathroom, Amenities, Safety/Electronics), ~20 points; each point = Pass / Fail with weight (1–3). Attendant's checklist + photos are visible side-by-side for comparison.
3. Live score `S = Σ(wᵢ·xᵢ) / Σwᵢ × 100`.
4. **Approve** (S ≥ pass threshold, default 90%) ➔ `HK: CLEAN ➔ INSPECTED` ➔ `[EVT] INSPECTION_PASSED (score)` ➔ if vacant & not blocked ➔ room shows **READY** on Front Desk instantly.
5. **Reject** (S < threshold, or any 🔴 critical item failed) ➔ must attach ≥1 photo + note on failed points ➔ `HK: CLEAN ➔ DIRTY (re-clean)` ➔ `[EVT] INSPECTION_FAILED` ➔ same attendant gets top-priority re-clean task with the failed points pre-highlighted.
6. **Waiver** (config option, 🟡): Manager can configure "inspection sampling" (e.g. inspect 30% of Stayovers); non-sampled rooms go `CLEAN ➔ INSPECTED` automatically with `[EVT] INSPECTION_WAIVED`.

---

## 🟢 Flow 5 — Front Desk: Is the Room Ready? (P4 Receptionist — desktop)

**Trigger**: guest arrives / planning today's arrivals.

1. `W-05 Front Desk Board`: grid of all rooms; filter chips **READY**, **Not ready**, **Arrivals today**, by room type/floor. Big counter: "READY 42 · Cleaning 11 · Dirty 23 · Blocked 3".
2. Room tile shows the **one-word answer** (READY / CLEANING / DIRTY / INSPECTING / BLOCKED / DND) + ETA when in progress ("~12 min").
3. **Case A – READY** ➔ receptionist proceeds with check-in (in PMS or HMS) ➔ `[EVT] CHECKED_IN` ➔ room becomes Occupied.
4. **Case B – not READY & guest waiting** ➔ click **Queue guest** ➔ select room or room type + guest name ➔ `[EVT] QUEUE_ADDED` ➔ room jumps to #1 on the assigned attendant's list with chime; supervisor's 15-min inspection SLA timer arms (starts at Mark Clean).
5. **Case C – BLOCKED (OOO/OOS)** ➔ tile disabled with reason + ETA; "Assign" action hidden.
6. When a queued room becomes READY ➔ desktop notification + sound to Front Desk: "Room 304 is READY for Mr. X".

---

## 🟢 Flow 6 — Exceptions During Cleaning (P1 Attendant)

| # | Exception | Steps | Resulting state / event |
| :-- | :-- | :-- | :-- |
| 6a | **DND** | Tap **Flag DND** ➔ optional door photo ➔ confirm | Overlay `DND` + `[EVT] DND_FLAGGED`; room moves to end of queue; auto-reminder in 2h; **DND > 24h** ➔ Manager alert "welfare check" |
| 6b | **Maintenance defect** | Tap **Report Issue** ➔ category (Plumbing, HVAC, Electrical, Furniture, Other) ➔ urgency P1/P2/P3 ➔ ≥1 photo ➔ note (voice-to-text allowed) | `[EVT] WORK_ORDER_CREATED`; P1 ➔ overlay `OOO` (hard block), P2/P3 ➔ `OOS` (soft block) — Supervisor may downgrade |
| 6c | **Damage / missing item** | Before touching the room: tap **Report Damage** ➔ photos (≥2 angles) ➔ description | `[EVT] DAMAGE_REPORTED` ➔ Supervisor + Front Desk alert (guest may still be on property) |
| 6d | **Lost & Found** 🟡 | **Found Item** ➔ photo in place ➔ location tag ➔ category | `[EVT] LOST_FOUND_LOGGED` ➔ item ref # generated |
| 6e | **Pest / bed bug** | **Report Issue ➔ Pest** ➔ photo ➔ confirm | Immediate `OOO`, Manager alert, linen-quarantine instructions shown |
| 6f | **Guest refused service** | Tap **Guest refused** | `[EVT] SERVICE_REFUSED`; stays `DIRTY` for the day; no penalty to attendant |

---

## 🟢 Flow 7 — Maintenance Loop (P5 Engineer — mobile)

1. Push "P1 · Room 512 · Plumbing" ➔ `M-10 Work Orders` ➔ **Accept** ➔ `[EVT] WO_ACCEPTED`.
2. Arrive ➔ **Start** ➔ fix ➔ **Resolve** with fix note + photo ➔ `[EVT] WO_RESOLVED`.
3. System ➔ room goes back to `HK: DIRTY` (post-repair clean needed) **or** straight to Supervisor inspection if engineer marks "no cleaning needed" ➔ Supervisor approves ➔ OOO/OOS removed ➔ `[EVT] BLOCK_RELEASED`.
4. A block is **never** lifted by the engineer alone (rule from raw spec EPIC 1, US 1.3).

---

## 🟢 Flow 8 — Manager Live Board & Accountability Audit (P3 Manager — desktop) ★ core for Q1 + Q2

1. `W-01 Live Board`: floor-by-floor grid of all rooms (100± tiles), colored by status, icons for overlays. KPI strip: READY / In progress / Dirty / Awaiting inspection / Blocked; avg clean time; inspection pass rate today.
2. `W-02 Team Progress`: row per attendant — progress bar `8/14`, current room, time in current room, anomalies count, pass rate.
3. Click any room ➔ **Room Timeline drawer**: chronological `[EVT]` list — *"07:52 Ahmed started · 08:03 bathroom vanity ✔ (photo) · 08:21 Mark Clean (29 min) · 08:40 Sara inspected — 95% PASS"*. Each checklist item shows ✔/✘/skipped + who + when.
4. Click an attendant ➔ **Staff day view**: all rooms, durations, skipped items, rejects, anomalies.
5. `W-04 Reports`: export PDF/CSV of *Daily Room Status*, *Attendant Performance*, *Checklist Compliance* (most-skipped items), *Inspection Failures*.
6. **Escalations banner** (red): Queue room uninspected > 15 min after Mark Clean · DND > 24h · P1 work order unaccepted > 10 min · attendant idle in a room > 2× standard time.
   - **Manager Remote Approval** (🟡): review attendant photos ➔ approve without walk-in ➔ `[EVT] INSPECTION_PASSED (remote=true)`.

---

## 🟢 Flow 9 — Day Roll-over / Night Audit (System)

At configurable time (default 03:00):
1. All `Occupied` rooms ➔ `HK: DIRTY` (stayover service due) unless flagged "no service today".
2. `DND` overlays cleared; `QUEUE` entries expire; unfinished tasks carried over with `[EVT] CARRIED_OVER`.
3. Daily snapshot stored for reporting.

---

## 🟢 Flow 10 — Admin Configuration (P6 Admin — desktop)

1. **Property**: floors, rooms (bulk import CSV: number, floor, type, section), room types with credits & standard times.
2. **Checklists**: builder — per scenario × room type; add items (label AR/EN, icon, mandatory, photo-required, reference image); reorder by drag; versioned (old tasks keep their version).
3. **Inspection templates**: points, weights, critical flag, pass threshold.
4. **Users & roles**: create staff, reset PIN, deactivate (history retained).
5. **Rules**: inspection mandatory/sampling, roll-over time, SLA timers, anomaly thresholds.

---

## 🟢 Flow 11 — Offline Sync & Conflict Resolution (System)

1. Actions queue locally in order with device timestamp.
2. On reconnect: replay in order; the server is authoritative on state transitions.
3. Conflict (e.g., supervisor reassigned the room while attendant was offline) ➔ attendant's work is **kept** in the log with `conflict=true`, attendant sees a sheet "Room 208 was reassigned to Mona — your 6 ticks were saved", Manager sees the conflict in the room timeline.
4. Photos upload in the background; tick is valid immediately, photo shows ⏳ until uploaded.

---

## 🟡 Phase 2 Flows (summarized)

| Flow | Summary |
| :-- | :-- |
| **PMS Sync** | Check-out / check-in / room move webhooks from PMS ➔ HMS; HMS pushes `CLEAN`/`INSPECTED` back. Discrepancy check every 15 min: PMS Occupied vs HK "found vacant" ➔ `DISCREPANCY` overlay + Supervisor task **Reconcile**. |
| **Guest Requests (ad-hoc)** | Front Desk logs "Room 308 · 2 towels" ➔ pushed to floor attendant (full-screen + chime) ➔ **Accept** (SLA 3 min, else escalate to backup) ➔ **Done**. |
| **Lost & Found logbook** | Custody tracking, guest contact log, retention 30/60/90 days, resolution (Returned/Donated/Disposed). |
| **Turndown & Deep Clean** | Evening turndown list (18:00–22:00) from guest preferences; deep-clean cycles every 30/60/90 days auto-injected into daily tasks. |
| **Shift Handover Log** | Supervisor writes end-of-shift notes (open issues, VIPs, shortages) ➔ digital sign-off ➔ next shift must acknowledge. |
| **Priority Index** | Automatic ordering by weighted formula (VIP 35%, Queue 30%, ETA 20%, Departure 10%, proximity 5%). |

## ⚪ Phase 3 Flows (summarized)

| Flow | Summary |
| :-- | :-- |
| **Minibar & amenities** | Tap counters during clean ➔ log consumption ➔ (with PMS + finance approval) post to folio. |
| **Linen / pantry par levels** | Floor pantry stock vs par; alert < 1.5 par. |
| **Gamification** | Streaks, badges, confetti on zero-defect passes. |
| **Damage charging** | Supervisor assessment ➔ manager-approved charge via PMS. |

---

## 12. Cross-Persona Scenario — Early Arrival (end-to-end, MVP)

```
11:00  Guest arrives, room type KING not READY
11:00  Front Desk ▸ Queue guest → Room 304            [EVT] QUEUE_ADDED
11:00  Ahmed's phone ▸ chime, 304 jumps to #1 ⚡
11:04  Ahmed ▸ Start Cleaning                          [EVT] CLEAN_STARTED
11:31  Ahmed ▸ Mark Clean (27 min, 22/22 items)         [EVT] CLEAN_COMPLETED
11:31  Sara (Supervisor) ▸ push + 15-min SLA timer
11:38  Sara ▸ Inspect → 95% PASS                        [EVT] INSPECTION_PASSED
11:38  Front Desk ▸ 🔔 "304 READY for guest"            (derived READY = true)
11:40  Front Desk ▸ Check-in                           [EVT] CHECKED_IN
—      Manager can replay all of the above in Room 304's timeline (Q1 + Q2 + Q3 answered)
```
If Sara doesn't inspect by 11:46 ➔ escalation banner on Manager board ➔ Manager remote-approves or reassigns.
