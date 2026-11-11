# Hotel Housekeeping System Architecture, UX Design & Product Backlog Specification (v4.0 - Smartphone-First / Pure Mobile Architecture)

## Executive Summary
This document serves as the master operational, technical, and UX product design specification for an enterprise **Housekeeping Management System (HMS)** designed for hotels with 100+ rooms. Version 3.0 incorporates advanced accessibility guidelines for multi-lingual and glove-wearing staff, direct ad-hoc guest request dispatching, gamified shift progress tracking, real-time event-driven PMS integration, maintenance locking protocols, and 13 Jira-ready epics to guide Figma UI design and engineering development [1, 3, 5].

---

## 1. Housekeeper User Journey & UX Interaction Guidelines

### 1.1 Mobile (Smartphone / Mobile Web App) User Journey (Step-by-Step Flow)

```
[Login / NFC Key Scan] ➔ [Visual Dashboard & Progress Bar] ➔ [Dynamic Priority Task Queue] ➔ [Start Cleaning] ➔ [Visual SOP Checklist] ➔ [Mark Clean] ➔ [Supervisor Inspection] ➔ [Vacant Ready]
```

1. **Authentication & Shift Initialization:**
   * The Room Attendant logs into the mobile app via NFC card tap or visual PIN login [113].
   * The home screen displays an intuitive **Shift Progress Dashboard** showing completed vs. remaining rooms, current shift score, and a prominent language switcher flag [1, 101].
   * Tasks are dynamically ordered by the **Priority Index Algorithm** with high-contrast color-coded badges [107, 129].

2. **Room Entry & Real-Time Status Transition:**
   * Upon entering the room, the attendant taps a prominent green button **"Start Cleaning"** (minimum 64px tap target) [113].
   * **System Event:** The PMS room status updates instantaneously to `Servicing In Progress` via WebSockets [102, 106, 113]. This signals to Front Desk and Management that the room is actively being serviced [102, 113].

3. **Digital SOP Checklist Execution:**
   * The app presents an interactive 7-step visual cleaning checklist with high-contrast iconography, minimal text, and photo-guided standards [85, 109].
   * Attendants tap or swipe to complete sub-items sequentially [85, 109, 113].

4. **Completion & Verification Request:**
   * Once all mandatory sub-tasks are checked, the attendant taps **"Mark Clean"** [113].
   * **System Event:** The room status updates to `Vacant Clean` in the PMS [102, 103, 113]. An automated push notification alerts the Floor Supervisor [102, 104, 111].
   * **Gamification Trigger:** A celebratory micro-animation appears, updating the housekeeper's daily progress bar and granting streak points.

5. **Supervisor Inspection & Availability Release:**
   * The Supervisor conducts a digital inspection audit on their smartphone [102, 110, 111].
   * Upon passing (Cleanliness Score $S_{\text{room}} \ge 90\%$), the room status transitions to `Vacant Inspected` and releases to `Vacant Ready` for immediate check-in [102, 103, 111].

---

### 1.2 Edge Cases & Operational Exception Handling

| Edge Case / Exception | Mobile App Workflow & Action | System Status Transition & Integration Payload |
| :--- | :--- | :--- |
| **Maintenance Defect Identified** | Attendant taps **"Report Maintenance"** icon, captures photo/video, selects category (HVAC, Plumbing, Electrical), and sets urgency [113]. | System creates Engineering Work Order [106, 136]. Automatically triggers `Out of Order (OOO)` or `Out of Service (OOS)` lock in PMS, blocking check-in [103, 155, 156]. |
| **Ad-Hoc Guest Request Inbound** | High-priority pop-up notification banner with audio chime appears on attendant's device (e.g., "Extra Towels - Room 402") [1, 14, 106]. | Injected into queue as `Ad-Hoc Task`. Attendant acknowledges and delivers, bypassing manual walkie-talkie delays [1, 106]. |
| **Do Not Disturb (DND) / Refusal** | Attendant taps **"Flag DND"** icon, captures door photo, and confirms [113]. | Timestamped event logged; status updated to `DND` [113, 184]. Front Desk receives streaming notification [106, 113]. Welfare check alert triggered if DND >24h [252]. |
| **Lost & Found Items** | Attendant taps **"Lost & Found"** camera icon, photographs item *in situ*, records location details, and submits [113, 204]. | Creates timestamped record auto-linked to departed guest's PMS reservation ID [12, 113]. Alerts Supervisor for secure custody [113]. |
| **Room Damage / Missing Property** | Attendant logs damage/missing items with photo *before* cleaning begins [6, 11, 239]. | Urgent push alert sent to Receptionist and Manager UI to intercept and bill guest prior to departure [6, 11]. |
| **Room Status Discrepancy** | Attendant reports discrepancy via visual toggle (PMS = Occupied, Physical = Vacant) [31]. | Flags `Discrepant Code` in PMS [31]. Supervisor receives priority alert to inspect and reconcile with Front Office [31, 34]. |

---

## 2. Core Functional Modules & Jira Backlog Epics

### 2.1 EPIC 1: Maintenance & Repair Engine (CMMS & OOO/OOS Lock Engine)

* **Operational Purpose:** Allows Housekeepers to act as the primary line of defect detection while enforcing a strict programmatic block preventing Receptionists from assigning uninspected or broken rooms [11, 103, 113, 156].

```
[Defect Upload (Photo/Category)] ➔ [Auto Work Order] ➔ [PMS Lock: OOO / OOS] ➔ [Front Desk Blocked]
                                                                                      │
[PMS Release (Vacant Inspected)] ◄── [Supervisor Inspection] ◄── [Engineering Resolve] ◄┘
```

#### User Stories & Acceptance Criteria

* **User Story 1.1 (Housekeeper Defect Reporting):**
  * *As a* Housekeeper, *I want to* capture a photo of a defect, select an icon category (Plumbing, HVAC, Electrical, Carpentry, Furniture) and set urgency (P1 Critical, P2 High, P3 Standard), *so that* Engineering is immediately notified [113, 136].
  * *Acceptance Criteria:* Requires at least one photo; auto-attaches room number, floor, timestamp, and user ID; auto-generates work order ticket in CMMS [106, 113].
* **User Story 1.2 (PMS Inventory Locking Engine):**
  * *As the* System, *I want to* automatically transition a room with a P1 defect to `Out of Order (OOO)` and P2/P3 to `Out of Service (OOS)` in the PMS upon ticket creation, *so that* Front Desk cannot Check-in a guest [103, 127, 156].
  * *Acceptance Criteria:* Front Desk UI displays a hard lock with reason code and estimated completion time; "Assign Room" button is programmatically disabled for OOO rooms [103, 127, 156].
* **User Story 1.3 (Maintenance Clearance Workflow):**
  * *As an* Engineer, *I want to* mark a work order "Resolved" with a fix description and repair photo, triggering a Supervisor inspection request, *so that* the room lock can be safely lifted [112, 117].
  * *Acceptance Criteria:* OOO/OOS status is only lifted after Supervisor passes inspection, transitioning room to `Vacant Clean` or `Vacant Inspected` [102, 103, 111].

---

### 2.2 EPIC 2: Real-Time Event-Driven PMS Integration Engine

* **Operational Purpose:** Delivers sub-second synchronization between HMS mobile applications and Hotel Property Management Systems (e.g., Oracle OPERA OHIP, Cloudbeds) using WebSockets and event-driven architecture [4, 105, 106].

#### Technical Payload Schema & User Stories

```json
{
  "event": "ROOM_STATUS_CHANGE",
  "timestamp": "2026-09-23T04:15:00Z",
  "property_id": "HOTEL_100",
  "room_number": "304",
  "previous_status": "SERVICING_IN_PROGRESS",
  "new_status": "VACANT_CLEAN",
  "attendant_id": "HK_88",
  "inspection_score": 95,
  "queue_flag": true
}
```

* **User Story 2.1 (Bi-directional WebSocket Sync):**
  * *As a* Receptionist, *I want to* see room status changes reflect on my Front Desk screen instantly without refreshing, *so that* I can check in guests immediately upon room release [4, 105, 106].
  * *Acceptance Criteria:* Status latency must be $<200\text{ ms}$; connection fallback to SSE/polling if WebSockets disconnect; automatic UI badge refresh [106].
* **User Story 2.2 (Guest Check-out Event Hook):**
  * *As the* System, *I want to* listen for `CHECK_OUT` events from PMS, *so that* the corresponding room automatically switches to `Vacant Dirty` and enters the cleaning dispatch queue [91, 101, 107].

---

### 2.3 EPIC 3: Dynamic Priority Index & Spatial Route Optimization

* **Operational Purpose:** Automatically ranks housekeeping tasks based on real-time operational urgency and clusters assignments by floor/wing to reduce attendant walking time and physical fatigue [8, 107, 108].

#### Priority Index Formula
$$\text{Priority Index } (P_i) = (w_1 \cdot \text{VIP}) + (w_2 \cdot \text{Queue}) + (w_3 \cdot \text{ETA}) + (w_4 \cdot \text{Departure}) + (w_5 \cdot \text{Spatial Cluster})$$

* **Weight Distribution:** $\text{VIP} = 35\%$, $\text{Queue Status} = 30\%$, $\text{ETA} = 20\%$, $\text{Departure} = 10\%$, $\text{Spatial Proximity} = 5\%$ [107, 129, 130].

#### User Stories & Acceptance Criteria

* **User Story 3.1 (Automated Task Prioritization):**
  * *As a* Housekeeper, *I want my* app task list ordered dynamically by priority, *so that* I clean high-priority rooms (VIPs, Queue Rooms) first [107, 129, 130].
  * *Acceptance Criteria:* Queue Rooms waiting in the lobby automatically jump to position #1 with a glowing alert banner and audio notification [107, 130].
* **User Story 3.2 (Spatial Floor Clustering):**
  * *As a* Supervisor, *I want the* auto-assignment engine to group rooms by floor wings and physical adjacency, *so that* attendants minimize elevator trips and hallway transit [8, 108].

---

### 2.4 EPIC 4: Digital Lost & Found SOP Workflow

* **Operational Purpose:** Standardizes the chain of custody for guest belongings forgotten after check-out, providing photo evidence, automated guest linkage, and retention policy tracking [12, 113, 204].

#### User Stories & Acceptance Criteria

* **User Story 4.1 (In-Situ Photo Capture & Logging):**
  * *As a* Housekeeper, *I want to* log a found item by photographing it *in its original spot* before moving it, *so that* there is clear evidence of where it was left [113, 204].
  * *Acceptance Criteria:* Must record photo, specific location tag (e.g., Safe, Under Bed, Drawer), category (Electronics, Jewelry, Clothing, Documents), and finder ID [113, 204].
* **User Story 4.2 (PMS Reservation Linkage & Front Office Alert):**
  * *As the* System, *I want to* cross-reference the room number and check-out timestamp with the PMS reservation database, *so that* the item is automatically attached to the guest's profile [12, 113].
  * *Acceptance Criteria:* Front Desk receives an alert on the guest's folio; automated SMS/email template generated to contact the guest [12, 113].
* **User Story 4.3 (Retention Policy & Custody Tracker):**
  * *As a* Housekeeping Manager, *I want to* track items across storage lockers with 30/60/90-day retention countdowns, *so that* expired items can be legally disposed of or claimed by finder [113].

---

### 2.5 EPIC 5: Inventory & Amenities Par Level Control (Minibar & Pantry Tracker)

* **Operational Purpose:** Tracks real-time consumption of linens, toiletries, and minibar items per room type, alerting when floor pantry stock falls below designated Par levels [136, 137].

```
  Floor Pantry Par Stock Standard: 3.5x - 5.0x Daily Room Consumption
  ├── Linens & Towels (Sheets, Pillowcases, Bath Towels)
  ├── Personal Toiletries (Shampoo, Soap, Conditioner)
  ├── Hospitality Amenities (Coffee, Tea, Water)
  └── Minibar Inventory (Auto-posted to Guest Folio via PMS API)
```

#### User Stories & Acceptance Criteria

* **User Story 5.1 (Minibar & Amenity Consumption Logging):**
  * *As a* Housekeeper, *I want to* record consumed minibar items and replenished toiletries during room cleaning, *so that* minibar charges are automatically posted to the guest's PMS folio [6, 11, 136].
  * *Acceptance Criteria:* Items logged via tap counter; instantaneous REST call posts charges to guest folio before final check-out settlement [6, 106, 136].
* **User Story 5.2 (Floor Pantry Low Stock Alerts):**
  * *As a* Housekeeping Manager, *I want to* receive alert notifications when floor pantry inventory drops below the $1.5\text{ Par}$ reorder threshold, *so that* linen runners can replenish stock proactively [136, 137].

---

### 2.6 EPIC 6: Housekeeping Analytics & Manager KPIs Dashboard

* **Operational Purpose:** Provides a real-time command center displaying interactive floor heatmaps, attendant productivity graphs, inspection failure analysis, and operational KPIs [110, 112, 141].

#### Key Performance Indicators (KPI) Matrix

| Metric / KPI | Calculation / Formula | Benchmark Target | Operational Impact |
| :--- | :--- | :--- | :--- |
| **Room Cleanliness Score ($S_{\text{room}}$)** | $S_{\text{room}} = \left( \frac{\sum w_i \cdot x_i}{\sum w_i} \right) \times 100$ [111] | $\ge 90\%$ Average [111, 141] | Drives guest satisfaction and online review scores [2, 112]. |
| **Room Turnover Time** | $\text{Timestamp}_{\text{Mark Clean}} - \text{Timestamp}_{\text{Start Cleaning}}$ [112] | $\le 25\text{–}30\text{ min}$ (Departure)<br>$\le 12\text{–}15\text{ min}$ (Stayover) [86, 108] | Reduces room turnaround lag during peak check-in windows [112]. |
| **Attendant Productivity** | Completed Rooms per Attendant per 8-hr Shift [108, 141] | $12\text{–}16\text{ rooms/shift}$ [96, 108, 141] | Balances labor distribution and controls overtime costs [108, 225]. |
| **Re-Clean / Failure Rate** | $\left( \frac{\text{Failed Initial Inspections}}{\text{Total Inspected Rooms}} \right) \times 100$ [112] | $\le 5\%$ [112, 141] | Pinpoints staff training needs and SOP compliance gaps [112]. |
| **Maintenance MTTR** | $\text{Timestamp}_{\text{Resolved}} - \text{Timestamp}_{\text{Ticket Created}}$ [112] | $< 15\text{–}30\text{ min}$ (P1)<br>$< 2\text{ hrs}$ (P2/P3) [112, 117] | Accelerates inventory recovery for sellable rooms [112, 117]. |

---

### 2.7 EPIC 7: Evening Turndown Service Module

* **Operational Purpose:** Manages evening room preparation workflows (18:00 – 22:00) for VIP guests, suites, and special requests [10, 11].

#### User Stories & Acceptance Criteria

* **User Story 7.1 (Turndown Task Routing):**
  * *As an* Evening Shift Housekeeper, *I want to* view a specialized Turndown Checklist (bed opening, ambient lighting, bath mat placement, chocolate/water placement), *so that* VIP room standards are met [10, 11].
  * *Acceptance Criteria:* App displays turndown preferences recorded in PMS guest profile (e.g., extra feather pillows, specific room temp) [10, 11, 106].

---

### 2.8 EPIC 8: Guest Room Damage & Property Protection Tracker

* **Operational Purpose:** Captures pre-cleaning damage or property theft immediately upon attendant entry, triggering urgent front-office alerts [6, 11, 239].

#### User Stories & Acceptance Criteria

* **User Story 8.1 (Pre-Clean Damage Alert):**
  * *As a* Housekeeper, *I want to* photograph damaged furniture, stained carpets, or missing TV/linens *before* touching the room, *so that* the hotel can hold the departing guest accountable [6, 11, 239].
  * *Acceptance Criteria:* Sends urgent priority alert to Receptionist and Manager UI; flags guest profile in PMS prior to folio settlement [6, 11].

---

### 2.9 EPIC 9: Rotating Deep Cleaning Cycle Scheduler

* **Operational Purpose:** Schedules and tracks periodic deep cleaning tasks (carpet shampooing, mattress rotation, AC filter sanitization, marble polishing) [6, 10, 12, 13].

#### User Stories & Acceptance Criteria

* **User Story 9.1 (Deep Clean Task Assignment):**
  * *As a* Housekeeping Manager, *I want to* schedule recurring deep cleaning cycles every 30/60/90 days per room, *so that* rooms maintain long-term physical quality [6, 12, 13].
  * *Acceptance Criteria:* App embeds deep clean checklists into regular daily queues when a room cycle is due; logs historical deep clean date [6, 13].

---

### 2.10 EPIC 10: Digital Shift Handover & Supervisory Logbook

* **Operational Purpose:** Provides an electronic shift log replacing paper logbooks for seamless communication between AM, PM, and Night shifts [67, 73].

#### User Stories & Acceptance Criteria

* **User Story 10.1 (Shift Handover Log):**
  * *As a* Supervisor, *I want to* log shift summaries, unresolved maintenance issues, VIP arrivals, and pending guest requests, *so that* the incoming shift supervisor has full operational context [67, 73].
  * *Acceptance Criteria:* Digital sign-off with timestamp; searchable archives by date and room number [67, 73].

---

### 2.11 EPIC 11: Accessibility & Visual-First Mobile UI Design System (Glove-Friendly & Multi-Lingual)

* **Operational Purpose:** Optimizes the mobile application for hotel room attendants who may have low tech literacy, speak diverse native languages, or wear cleaning gloves during operational shifts [1, 113].

```
  UX Ergonomics & Accessibility Framework:
  ├── Minimum Tap Target Size: ≥ 56px to 64px (Glove-friendly execution)
  ├── Visual-First Paradigm: High-contrast universal icons over dense text
  ├── Multi-Language i18n Switcher: English, Arabic, Tagalog, Hindi, Spanish
  ├── Haptic & Audio Feedback: Sound cues for task completion & priority alerts
  └── High-Contrast Color Palette: AAA Accessibility compliance for low/high lighting
```

#### User Stories & Acceptance Criteria

* **User Story 11.1 (Multi-Lingual One-Tap Localization Switcher):**
  * *As a* foreign-language Housekeeper, *I want to* toggle the app language instantly with one tap on a flag icon (e.g., English, Arabic, Tagalog, Hindi), *so that* I can read all task instructions and checklists in my native language [1, 113].
  * *Acceptance Criteria:* Full UI internationalization (i18n); instant switching without re-authenticating; iconography and universal color coding remain consistent across languages [1, 113].
* **User Story 11.2 (Glove-Friendly Tap Targets & Gesture Controls):**
  * *As a* Housekeeper wearing rubber cleaning gloves, *I want* oversized buttons (minimum $64 \times 64\text{px}$) and simple swipe gestures, *so that* I can check off items and change room status without misclicks or removing gloves [113].
  * *Acceptance Criteria:* Primary action buttons ("Start Cleaning", "Mark Clean", "Report Bug") fill full screen width with $>16\text{px}$ padding; supports swipe-to-complete; haptic vibration feedback on successful tap.
* **User Story 11.3 (Pictorial SOP Guidance):**
  * *As a* Housekeeper with low literacy, *I want* visual photo/icon cards demonstrating standard bed-making or towel-folding standards, *so that* I know exactly what standard is expected without reading long text manuals [85, 91, 109].

---

### 2.12 EPIC 12: Real-time In-Room Guest Request Direct Dispatch Engine (Ad-Hoc Tasks)

* **Operational Purpose:** Routes in-room guest requests (extra towels, ironing board, extra pillows, dental kit) directly to the mobile device of the housekeeper assigned to that specific floor/wing, bypassing manual Receptionist and walkie-talkie delays [1, 14, 106, 185].

```
[Guest Request Inbound (PMS / QR / Front Office)] 
       │
       ▼
[HMS Dispatch Engine] ➔ Spatial Matching (Assigned Floor Attendant)
       │
       ▼
[Mobile Push Notification] ➔ High-Priority Sound Chime + Visual Banner
       │
       ▼
[Attendant Action] ➔ Tap "Acknowledge" ➔ Deliver Item ➔ Tap "Fulfilled" (PMS Status Cleared)
```

#### User Stories & Acceptance Criteria

* **User Story 12.1 (Direct Guest Request Push Routing):**
  * *As a* Floor Housekeeper, *I want to* receive a direct, high-priority notification on my phone when a guest on my floor requests an amenity (e.g., "Room 308 - 2 Extra Bath Towels"), *so that* I can deliver it immediately [1, 14, 106].
  * *Acceptance Criteria:* Dedicated audio alert tone distinct from regular room alerts; full-screen pop-up modal; auto-injected into task queue as top-priority `Ad-Hoc Task` [1, 106].
* **User Story 12.2 (Request Acknowledgment & SLA Escalation Timer):**
  * *As a* Housekeeping Supervisor, *I want the* system to automatically re-route an unacknowledged guest request to the Floor Runner or Supervisor if the assigned housekeeper doesn't tap "Acknowledge" within 3 minutes, *so that* guest SLA is never breached [106, 112].
  * *Acceptance Criteria:* Escalation countdown timer visible on Manager Dashboard; auto-pings backup attendant after 180 seconds.

---

### 2.13 EPIC 13: Gamification, Performance Motivation & Shift Progress Engine

* **Operational Purpose:** Boosts engagement, morale, and productivity for physically demanding housekeeping work by providing real-time visual progress tracking, celebratory micro-interactions, and streak rewards [1, 110].

```
  Shift Progress Bar: [████████████░░░░] 8/14 Rooms Completed (57%)
  ├── Real-Time Completion Target Counter
  ├── "Zero-Defect" Streak Counter (Passed Inspection 1st Time)
  ├── Micro-Celebrations: Confetti animation + encouraging toast on completion
  └── Daily Performance Badge Unlock ("Speed Master", "Quality Champ")
```

#### User Stories & Acceptance Criteria

* **User Story 13.1 (Shift Progress Bar & Real-Time Target Indicator):**
  * *As a* Housekeeper, *I want to* see a prominent progress bar on my home screen showing how many assigned rooms I've completed versus my shift target (e.g., "10 / 14 Rooms Cleaned"), *so that* I know exactly where I stand in my workday [108, 110].
  * *Acceptance Criteria:* Real-time updating progress bar; percentage completion gauge; color transition from orange to vibrant green upon shift completion.
* **User Story 13.2 (Gamified Rewards & Quality Badging):**
  * *As a* Housekeeper, *I want to* earn positive feedback badges and celebratory animations when I complete rooms efficiently and pass inspections with $100\%$ scores, *so that* my hard work feels recognized and valued [110, 111].
  * *Acceptance Criteria:* Trigger celebratory particle effect (confetti animation) on "Mark Clean" or "Inspection Pass"; track monthly "Zero Defect" streaks for employee recognition programs [111, 112].

---

## 3. Front Desk (Receptionist) Communication Architecture

```
[Front Desk Check-out] ➔ PMS Webhook ➔ HMS Engine ➔ Task Queue (Vacant Dirty)
[Attendant Mark Clean] ➔ HMS Webhook ➔ PMS Status Update ➔ Front Desk Board (Vacant Clean)
[Supervisor Pass Inspection] ➔ HMS Webhook ➔ OHIP PUT ➔ PMS Room Release (Vacant Ready)
```

1. **Dual-Dimension Room Status Matrix:**
   * **Occupancy Condition:** `Occupied` vs. `Vacant` [22, 40].
   * **Housekeeping Condition:** `Dirty` $
ightarrow$ `Servicing In Progress` $
ightarrow$ `Clean` $
ightarrow$ `Inspected` $
ightarrow$ `Ready` [101, 102, 103, 126].
2. **Queue Rooms Engine:**
   * Allows Front Desk to tag waiting guests, instantly escalating room priority in attendant queues [107, 129, 130].

---

## 4. Standard Hotel Guestroom Cleaning Checklist (7-Step Sequence)

Execution follows a strict **Top-to-Bottom, Clean-to-Dirty** sequence [85, 94, 109].

| Step # | Category | SOP Tasks & Standard Scope |
| :--- | :--- | :--- |
| **1** | **Ventilation & Waste Stripping** | Open windows for ventilation [109]. Empty all trash bins and replace liners [75, 109]. Remove food trays to service corridor [56, 109]. |
| **2** | **Linen Removal & Property Check** | Strip bed sheets, pillowcases, and bath towels into laundry bags [75, 91, 109]. Inspect mattress for stains/bedbugs [78, 91, 109]. Check drawers/under bed for lost items [78, 91, 109]. |
| **3** | **High-to-Low Dusting & Disinfection** | Dust ceilings, light fixtures, down to furniture [76, 109]. Disinfect high-touch points (TV remote, phone, light switches, door handles) [6, 76, 109]. |
| **4** | **Bathroom Sanitization** | Apply disinfectant to vanity, sink, tub, shower, and toilet [76, 91, 109]. Scrub tile walls and glass; polish mirrors and chrome [76, 109]. |
| **5** | **Linen Replacement & Restocking** | Make bed with fresh linens to hotel brand standards [91, 109]. Restock toiletries, paper products, bath towels, and coffee bar [76, 91, 109]. |
| **6** | **Floor Care Execution** | Vacuum carpets wall-to-wall and under furniture [79, 91, 109]. Damp-mop hard surface floors with microfiber mops [79, 109]. |
| **7** | **Final Environmental Audit** | Set HVAC to eco-mode [56, 109]. Check light bulbs, align drapes, spray room freshener, and securely lock entry door [56, 79, 109]. |

---

## 5. Summary Matrix of Backlog Epics for Figma & Jira Planning

| Epic ID | Epic Name | Key System & UX Features | Primary Persona |
| :--- | :--- | :--- | :--- |
| **EPIC 1** | **Maintenance & CMMS Integration** | Photo defect reporting, OOO/OOS hard lock, engineering ticket lifecycle [103, 113, 136, 156] | Housekeeper, Engineer, Supervisor |
| **EPIC 2** | **Real-Time PMS Sync Engine** | WebSockets, OHIP API integration, $<200\text{ ms}$ status sync [4, 105, 106] | System Architecture, Receptionist |
| **EPIC 3** | **Dynamic Priority Index** | Automated task ranking (VIP, Queue, ETA) + spatial floor clustering [8, 107, 129] | Housekeeper, Supervisor |
| **EPIC 4** | **Digital Lost & Found SOP** | In-situ photo capture, reservation profile link, 30/60/90d retention [12, 113, 204] | Housekeeper, Manager, Receptionist |
| **EPIC 5** | **Inventory & Amenities Par Control** | Minibar auto-billing, Par level tracking, floor pantry reorder alerts [6, 136, 137] | Housekeeper, Manager |
| **EPIC 6** | **Manager Analytics Dashboard** | Interactive floor heatmap, $S_{\text{room}}$ scoring, turnover & MTTR metrics [110, 111, 112] | Housekeeping Manager, Supervisor |
| **EPIC 7** | **Evening Turndown Service** | Evening shift routing, guest preference integration, turndown SOPs [10, 11] | Evening Housekeeper |
| **EPIC 8** | **Property Protection & Damage** | Pre-clean photo alert, urgent front desk push notification [6, 11, 239] | Housekeeper, Receptionist |
| **EPIC 9** | **Deep Cleaning Cycle Scheduler** | Recurring 30/60/90d deep clean task automation [6, 12, 13] | Manager, Supervisor |
| **EPIC 10** | **Digital Shift Handover Logbook** | Shift logs, VIP alerts, pending task handovers [67, 73] | Supervisor, Manager |
| **EPIC 11** | **Accessibility & Visual UI System** | Multi-language switcher (i18n), glove-friendly $64\text{px}$ targets, icon-first UI [1, 113] | Housekeeper |
| **EPIC 12** | **Ad-Hoc Guest Request Dispatch** | Direct push routing for guest requests, SLA timer escalation [1, 14, 106, 185] | Housekeeper, Supervisor, Receptionist |
| **EPIC 13** | **Gamification & Shift Progress** | Real-time progress bar, zero-defect streak badges, completion celebrations [108, 110, 111] | Housekeeper, Manager |

---
*Document compiled and published for Hotel Housekeeping Operational Architecture & Product Design.*
