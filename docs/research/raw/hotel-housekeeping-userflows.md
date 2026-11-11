# Hotel Housekeeping System - End-to-End User Flows & Persona Interaction Specs (v2.0)

## Executive Overview

This document specifies the complete **End-to-End User Flows** for the Enterprise Housekeeping Management System (HMS). It incorporates all 5 operational personas across mobile and desktop interfaces, detailing entry triggers, step-by-step actions, decision branching, system state transitions, offline resilience, and cross-persona interactions grounded in international hotel SOP standards and PMS integration protocols (e.g., Oracle OPERA Cloud OHIP / Cloudbeds).

---

## 1. Personas & Interface Matrix

| Persona ID | Role Title | Key Operating Device | Primary Goals | Key Pain Points Solved |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | **Housekeeper / Room Attendant** | Mobile Smartphone (PWA) | Clean rooms efficiently, follow SOP checklists, log defects/supplies, handle ad-hoc requests | Eliminates paper task sheets, language barriers, manual radios, and inaccurate turnover timers |
| **P2** | **Floor Supervisor** | Mobile Smartphone (PWA) | Audit cleaned rooms, verify quality ($S_{\text{room}} \ge 90\%$), inspect maintenance, handle inspection SLAs | Replaces physical walkthrough logs, manual status reporting, phone calls, and delayed room releases |
| **P3** | **Housekeeping Manager** | Desktop / Web Dashboard | Monitor live hotel heatmap, balance workloads, track KPIs, handle inspection escalations | Eliminates blind spots, delayed turnover, unmonitored SLAs, and inventory theft/losses |
| **P4** | **Receptionist / Front Desk** | Desktop / PMS Integration Panel | Check in guests fast, monitor `Vacant Ready` status, trigger Queue rooms | Eliminates room assignment delays and status discrepancies |
| **P5** | **Engineering Technician** | Mobile Smartphone (App) | Receive maintenance tickets, repair OOO/OOS defects, resolve work orders | Prevents missed repairs and prolonged room downtime (MTTR) |

---

## 2. Comprehensive Persona User Flows

### 2.1 Persona 1: Housekeeper / Room Attendant (Mobile Smartphone PWA)

#### Header Global Component: Offline Sync Status Indicator
* **Position:** Fixed Top Navigation Header across all mobile screens.
* **Visual States:**
  * 🟢 **Green Cloud Icon ("Online & Synced"):** Live WebSocket connection active. Real-time sub-second sync to PMS.
  * 🟡/🩶 **Amber/Grey Cloud Icon ("Offline - 3 Cached Updates Pending"):** Network disconnected (elevators, basements). All actions (checklist ticks, photos, status changes) saved to local IndexedDB/SQLite. Automatically flushes queue upon reconnect.

#### Flow Diagram Summary
```
[Login / One-Tap Language Switch] ➔ [Dynamic Task Queue (Badged Tasks)] ➔ [Select Room] 
   ➔ [Tap "Start Cleaning" (PMS: Servicing In Progress / Timer Started)]
   ├── Active Cleaning ➔ [Dynamic Checklist (Departure / Turndown 🌙 / Deep Clean 🧽)]
   │      ├── Normal Track ➔ [Checklist Completion + Minibar Counter] ➔ [Tap "Mark Clean"]
   │      └── Pause Track ➔ [Tap "Pause Cleaning"] ➔ [PMS: Servicing Paused / Timer Paused] ➔ [Resume]
   ├── Exception: DND ➔ [Flag DND + Photo] ➔ [System Alert to Reception]
   ├── Exception: Defect ➔ [Report Defect + Photo] ➔ [Auto Work Order + PMS OOO/OOS Lock]
   ├── Exception: Damage ➔ [Pre-clean Damage Photo] ➔ [Urgent Push to Reception]
   └── Exception: Lost & Found ➔ [Photograph In-situ] ➔ [Auto PMS Linkage]
```

#### Step-by-Step Flow Details

1. **Authentication & Shift Start:**
   * **Trigger:** Attendant opens PWA on smartphone or taps NFC Master Keycard.
   * **Action:** Selects primary language (English, Arabic, Tagalog, Hindi, Spanish) via **One-Tap Language Switcher**.
   * **Outcome:** Loads **Dynamic Task Queue**, displaying assigned rooms ordered by the **Priority Index Algorithm** ($P_i$). The UI features glove-friendly 64px tap targets, the top **Sync Status Indicator**, and a live **Shift Progress Bar** (e.g., `5/14 Rooms Completed - 36%`).

2. **Dynamic Task Queue Badging & Custom Checklist Routing:**
   * **Visual Badging System:** Each room card displays distinct color-coded badges indicating task type and urgency:
     * ⚡ **Queue Room Badge (Glowing Yellow):** Guest waiting in lobby; highest priority.
     * 👑 **VIP Badge (Gold):** VIP guest arriving; strict SOP standards.
     * 🌙 **Turndown Service Badge (Purple):** Evening bed opening & ambient prep (18:00--22:00).
     * 🧽 **Deep Cleaning Badge (Cyan):** Scheduled 30/60/90-day comprehensive deep clean cycle.
   * **Dynamic Checklist Switching:** Tapping a room automatically loads the corresponding checklist:
     * *Standard Departure:* 7-Step Departure Cleaning SOP.
     * *Turndown Service (🌙):* Bed opening, bath mat placement, ambient light setup, chocolate/water placement.
     * *Deep Clean (🧽):* 15-Step Intensive SOP (carpet shampooing, AC filter sanitization, mattress rotation).

3. **Room Entry & Status Initialization:**
   * **Action:** Attendant arrives at the room and taps **"Start Cleaning"**.
   * **System Event & KPI Timer:** HMS emits a WebSocket event updating PMS status from `Vacant Dirty` $\rightarrow$ `Servicing In Progress`. The **Turnover Time KPI Timer** begins counting.

4. **Pause Cleaning & Re-assignment Management (Pause Button):**
   * **Trigger / Need:** Attendant goes on lunch break, or receives an urgent call from Supervisor to assist on another floor.
   * **Action:** Attendant taps **"Pause Cleaning"** and selects reason (Break, Assistance Request, Material Shortage).
   * **System Event:** HMS updates PMS status to `Servicing Paused`. The Turnover Time timer **pauses immediately**, preventing artificial KPI skewing or penalty.
   * **Resume Track:** When returning, attendant taps **"Resume Cleaning"** $\rightarrow$ Status reverts to `Servicing In Progress` and timer resumes.

5. **Active Cleaning & Minibar Tracking:**
   * **Action:** Attendant executes the dynamic checklist items.
   * **Minibar & Amenities Tracking:** Attendant taps visual counters to log consumed minibar items (e.g., 2 Waters, 1 Soda). System posts charges directly to guest folio via REST API.

6. **In-Task Exception Handling (Branching Nodes):**
   * **Branch A (Do Not Disturb - DND):** Attendant taps **"Flag DND"**, takes photo of door hanger. PMS sets status to `DND`. If DND exceeds 24h, system auto-escalates to Supervisor for a Welfare Check.
   * **Branch B (Maintenance Defect Identified):** Attendant taps **"Report Maintenance"**, selects category (Plumbing, HVAC, Electrical), attaches photo/video, sets priority (P1/P2/P3). HMS generates CMMS ticket and auto-locks room to `Out of Order (OOO)` or `Out of Service (OOS)`, blocking Front Desk check-in.
   * **Branch C (Pre-Clean Damage / Missing Property):** Attendant taps **"Log Pre-Clean Damage"**, captures photo before touching room. Urgent alert sent to Receptionist to intercept/bill guest before checkout.
   * **Branch D (Lost & Found Item):** Attendant taps **"Lost & Found"**, photographs item *in situ*, selects location tag (e.g., Safe, Drawer). HMS links item to departed guest's PMS profile.
   * **Branch E (Ad-Hoc Guest Request Notification):** Pop-up alert interrupts view with audio chime ("Room 304 needs 2 extra towels"). Attendant taps **"Accept Task"** (starts SLA timer) $\rightarrow$ delivers item $\rightarrow$ taps **"Complete Request"**.

7. **Completion & Supervisor Handoff:**
   * **Action:** Attendant completes all mandatory checklist items and taps **"Mark Clean"**.
   * **System Transition:** PMS status updates to `Vacant Clean`. Confetti animation triggers on smartphone with a "Zero-Defect Streak" badge. Automatic push notification sent to Floor Supervisor's mobile device.

---

### 2.2 Persona 2: Floor Supervisor (Mobile Smartphone PWA)

#### Header Global Component: Offline Sync Status Indicator
* Includes top-bar 🟢/🟡/🩶 **Sync Status Indicator** matching Attendant PWA.

#### Flow Diagram Summary
```
[Supervisor Mobile Login] ➔ [Floor Inspection Queue] ➔ [Select "Vacant Clean" Room]
   ➔ [Execute Digital Audit Checklist (20-Point Protocol)]
   ├── Pass (Score ≥ 90%) ➔ [Approve Room] ➔ [PMS Status: Vacant Inspected / Vacant Ready]
   ├── Fail (Score < 90%) ➔ [Reject & Add Notes/Photos] ➔ [Auto Task Re-open to Attendant]
   └── SLA Timeout Trigger (15 mins Queue Room Uninspected)
          └── Auto Escalation Alert ➔ [Push Critical Alert to Housekeeping Manager (P3)]
```

#### Step-by-Step Flow Details

1. **Inspection Queue Overview & SLA Monitoring:**
   * **Trigger:** Supervisor receives push notification when an attendant taps "Mark Clean".
   * **Action:** Opens mobile inspection queue. Rooms pending audit are highlighted in blue (`Vacant Clean`). High-priority Queue Rooms display a 15-minute countdown SLA timer.

2. **Escalation Engine & SLA Timeout Handling:**
   * **Rule:** If a room marked `Vacant Clean` is a **Queue Room** (guest waiting in lobby) and remains uninspected for **$> 15 \text{ minutes}$**:
     * **System Action:** SLA Timeout Trigger fires.
     * **Escalation Event:** Sends a **Critical Priority Alert** to Supervisor's phone with repeating audio chime, and simultaneously pushes an **Escalation Notification** to the Housekeeping Manager's Dashboard (P3).
     * **Manager Override:** Manager can remotely review attendant photos and release the room, or re-assign inspection to an available floor supervisor.

3. **Digital Inspection Audit ($S_{\text{room}}$ Evaluation):**
   * **Action:** Supervisor enters room and conducts a 20-point digital inspection across 4 zones (Bedroom, Bathroom, Amenities, Safety/Electronics).
   * **Scoring System:** Evaluates each item weighted by severity ($w_i$). The app calculates the real-time score:
     $$S_{\text{room}} = \left( \frac{\sum w_i \cdot x_i}{\sum w_i} \right) \times 100$$
   * **Pass Condition ($S_{\text{room}} \ge 90\%$):** Supervisor taps **"Approve & Release"**. PMS updates status to `Vacant Inspected` $\rightarrow$ `Vacant Ready`. Room becomes instantly sellable on Front Desk screen.
   * **Fail Condition ($S_{\text{room}} < 90\%$):** Supervisor marks failed items, attaches photos of missing standards, and taps **"Reject / Re-Clean"**. Room status reverts to `Dirty / Re-Clean Needed`. Attendant receives priority re-clean alert.

4. **Field Maintenance & Discrepancy Reconciliation:**
   * **Action:** Supervisor inspects repaired rooms submitted by Engineering. If repair passes, Supervisor approves and lifts the `OOO/OOS` hard lock.
   * **Discrepancy Resolution:** If PMS shows `Occupied` but room is physically empty, Supervisor inspects room, confirms departure, and taps **"Reconcile Status"**, setting PMS to `Vacant Dirty`.

5. **Shift Handover Logbook Entry:**
   * **Action:** At shift end, Supervisor opens **Digital Handover Logbook**, records unresolved issues, pending VIP arrivals, or supply shortages, and digitally signs off.

---

### 2.3 Persona 3: Housekeeping Manager (Desktop / Web Dashboard)

#### Flow Diagram Summary
```
[Manager Login] ➔ [Live 100+ Room Floor Heatmap] 
   ├── Live Monitoring ➔ [KPI Cards: Turnover Time, Cleanliness Score, MTTR, Attendant Productivity]
   ├── SLA Escalations ➔ [Receive Inspection Timeout Alerts (>15m Queue Room) ➔ Remote Release / Re-assign]
   ├── Workload Management ➔ [Drag-and-Drop Room Dispatch Adjustments]
   ├── Inventory Control ➔ [Par Level Alerts (Floor Pantry < 1.5 Par) ➔ Trigger Re-stock]
   └── Analytics ➔ [Export Quality & Efficiency Audit Reports]
```

#### Step-by-Step Flow Details

1. **Command Center Overview (Live Floor Heatmap):**
   * **Trigger:** Manager accesses HMS Web Dashboard.
   * **Visual Grid:** Real-time color-coded map of all 100+ rooms with live status badges.

2. **Escalation Center & SLA Timeout Resolution:**
   * **Action:** When a Supervisor misses a 15-minute inspection SLA for a Queue Room, an **Escalation Banner (Red)** flashes on the Manager's dashboard.
   * **Manager Action:** Manager taps the banner, views attendant completion photos, and clicks **"Manager Remote Approval"** to immediately release the room to `Vacant Ready` for the waiting guest.

3. **Dynamic Workload Dispatch & Re-assignment:**
   * **Action:** Manager monitors attendant progress bars. Uses **Drag-and-Drop** to re-assign rooms between attendants in real time based on workload spikes or pause requests.

4. **Inventory & Par Level Monitoring:**
   * **Action:** System monitors floor pantry stock against Par standards ($3.5\text{--}5.0\text{ Par}$). Automated reorder alerts fire when stock drops below $1.5\text{ Par}$.

---

### 2.4 Persona 4: Receptionist / Front Desk Agent (Desktop / PMS Panel)

#### Flow Diagram Summary
```
[Front Desk Guest Arrival] ➔ [Search Room Preferences in PMS]
   ├── Case A: Room is "Vacant Ready" ➔ [Immediate Check-in]
   ├── Case B: Room is "Dirty" / "Servicing" / "Paused" ➔ [Tag "Queue Room" in PMS]
   │      └── System Event ➔ [Pushes Room to #1 Priority in Attendant Queue + 15m SLA Timer for Supervisor]
   └── Case C: Guest Request ➔ [Log Request in Panel] ➔ [Direct Push to Floor Attendant Mobile]
```

#### Step-by-Step Flow Details

1. **Room Status Search & Assignment:**
   * **Outcome:** If room status shows 🟢 `Vacant Ready`, Receptionist completes check-in in under 2 minutes.

2. **Early Arrival & Queue Room Triggering:**
   * **Action:** Guest arrives early. Receptionist flags reservation as **"Queue Room"**.
   * **System Event:** HMS engine instantly recalculates task priority, bumping room to position #1 in attendant's app, and starts the 15-minute Supervisor Inspection SLA timer upon cleaning completion.

3. **In-Room Guest Request Dispatch:**
   * **Dispatch Flow:** Receptionist inputs request in HMS panel $\rightarrow$ System routes request directly to floor attendant's smartphone as an ad-hoc task with SLA delivery countdown.

4. **Hard-Lock Interception (OOO Protection):**
   * **Protection Rule:** Programmatically disables "Assign Room" button for OOO rooms with reason badge.

---

### 2.5 Persona 5: Maintenance / Engineering Technician (Mobile Smartphone App)

#### Header Global Component: Offline Sync Status Indicator
* Includes top-bar 🟢/🟡/🩶 **Sync Status Indicator**.

#### Flow Diagram Summary
```
[P1/P2 Ticket Auto-Generated] ➔ [Technician Smartphone Push Notification]
   ➔ [Accept Ticket] ➔ [Arrive at Room & Check Occupancy] ➔ [Execute Repair]
   ➔ [Upload Resolution Photo + Notes] ➔ [Mark Work Order "Resolved"]
   └── System Event ➔ [Triggers Supervisor Inspection Alert ➔ Release OOO/OOS Lock]
```

---

## 3. End-to-End Cross-Persona Integration Scenarios

### Scenario 1: Early Guest Arrival Queue & Inspection SLA Escalation Flow
```
[Guest Arrives at Lobby (11:00 AM)] 
   ➔ Receptionist tags "Queue Room 304" (Front Desk Desktop)
   ➔ WebSockets Push Notification
   ➔ Housekeeper Smartphone: Room #304 jumps to Priority #1 with Alert Chime & Queue Badge ⚡
   ➔ Housekeeper completes 7-Step Clean ➔ Taps "Mark Clean"
   ➔ Supervisor Mobile Alert: 15-Minute Inspection SLA Countdown Starts
   ➔ [15 Minutes Elapsed - Supervisor Busy on Floor 5]
   ➔ SLA Timeout Trigger Fires!
   ➔ Critical Alert pushed to Housekeeping Manager Dashboard (P3)
   ➔ Manager conducts Remote Photo Audit ➔ Taps "Manager Approval"
   ➔ PMS Status Auto-Converts: Vacant Inspected ➔ Vacant Ready (<200ms)
   ➔ Front Desk Screen Auto-Refreshes 🟢 ➔ Receptionist Keys Assigned
```

### Scenario 2: Pause Cleaning & Resumption Workflow
```
[Housekeeper Starts Cleaning Room 208 (12:30 PM)]
   ➔ PMS Status: Servicing In Progress (Turnover Timer Running)
   ➔ Attendant called to assist on Floor 1 Lunch Relief
   ➔ Attendant taps "Pause Cleaning" (Selects: Assistance Re-assignment)
   ➔ PMS Status Updates: Servicing Paused (Turnover Timer PAUSED at 08m:12s)
   ➔ Attendant returns at 01:15 PM ➔ Taps "Resume Cleaning"
   ➔ PMS Status Reverts: Servicing In Progress (Timer Resumes at 08m:13s)
   ➔ Attendant completes room ➔ Taps "Mark Clean" (Total Clean Duration: 24 mins)
```

---

## 4. Summary of System Interfaces & UI Artifact Specs

| Interface ID | Target Device | Persona | Total Screens | Key UX & Architectural Features |
| :--- | :--- | :--- | :--- | :--- |
| **UI-APP-01** | Smartphone (PWA) | Housekeeper | 9 Mobile Screens | Glove-friendly (64px), Visual-first, Multi-language switcher, **Pause Timer Button**, **Dynamic Badges (🌙, 🧽)**, **Offline Sync Indicator** |
| **UI-APP-02** | Smartphone (PWA) | Supervisor | 5 Mobile Screens | Mobile floor heatmap, 20-point digital audit, **15m SLA Timeout Alert Engine**, **Offline Sync Indicator** |
| **UI-DASH-01** | Desktop / Web | Manager | 5 Web Screens | Live 100+ room heatmap, drag-and-drop dispatch, Par control, **SLA Escalation Center** |
| **UI-PANEL-01**| Desktop / PMS | Receptionist | 3 Web Screens | Dual-dimension status matrix, Queue room trigger, Ad-hoc request dispatch |
| **UI-ENG-01** | Smartphone (App) | Engineer | 3 Mobile Screens | Work order push alerts, photo resolution upload, MTTR timers, **Offline Sync Indicator** |
| **TOTAL UI** | **Multi-Device** | **5 Personas** | **25 Core Screens** | **Complete Enterprise HMS Specification (Bulletproof Edition)** |

---
*Document compiled and published for Hotel Housekeeping Operational Architecture & UX User Flows (v2.0).*
