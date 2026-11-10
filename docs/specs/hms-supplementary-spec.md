# Gulf Heritage Hospitality Management System (HMS): AI Agent Engineering Specification & Architecture Manual

## 1. System Overview & Foundational Architecture

### 1.1 Project Mission & Scope
The Gulf Heritage Hospitality Management System (HMS) is an enterprise-grade operational execution platform designed for ultra-luxury authentic Gulf heritage hotels, palaces, and historic boutique resorts operating 100+ keys and suites. The system manages field operations, room readiness, heritage asset preservation, facility maintenance, dynamic task dispatch, and guest service protocols.

The architecture departs from standardized, Western chain hotel workflows to support architectural vernaculars rooted in Najdi, Hijazi, Qatari, Emirati, and Omani traditions. Modern hospitality operations must be unified with strict cultural heritage preservation, environmental materials science, and protocol-driven guest experiences. Rejecting generic international approaches does not compromise hygiene, occupational safety, or enterprise interoperability; rather, it elevates operational rigor by treating historic physical fabric as an active asset class.

### 1.2 Core Architectural Principles for AI Agents
When implementing client and server components, AI development agents must strictly enforce the following engineering axioms:

1. **Independent Lifecycle Dimensions**: Never conflate Cleanliness, Occupancy, Physical Maintenance, and PMS Reservation Availability into a single flat enumeration. Each operates on an isolated finite state machine.
2. **Offline-First Truth & Strict Honest UI**: In high-density adobe, stone, and coral structures where wireless attenuation is severe, no mobile client may display unverified state changes. Local persistence must never be falsely presented to users as confirmed server or PMS synchronization.
3. **Preservation-First Precedence**: Physical safety and heritage fabric protection take algorithmic and operational precedence over commercial priority, VIP tiering, and cleaning turnover speed.
4. **Interface Consolidation with Hard RBAC Boundaries**: While mobile viewports are consolidated into shared physical design templates, backend microservices and API gateways must enforce strict role-based access control and zero-trust credential evaluation.
5. **No Speculative Automation**: Conflict resolution, minibar consumption reconciliation, and maintenance overrides must never rely on blind last-write-wins (LWW) or automated merging. Discrepancies must be routed to human supervisors with complete forensic audit trails.

---

## 2. Personas, Roles, and Access Control Architecture

### 2.1 Design Group Consolidation vs. Functional Role Separation
To optimize frontend development while maintaining rigorous operational boundaries, user interactions are consolidated into three adaptive interface frameworks. Role capabilities remain completely separated within each group:

| Design Group | Included Functional Roles | Primary Hardware / Runtime | Primary System Objective |
| :--- | :--- | :--- | :--- |
| **Field Worker** | Room Attendant (Housekeeper), Engineering Technician, Royal Butler & Protocol Officer | Mobile PWA (BYOD / Android / iOS) | Execute assigned tasks, follow certified SOPs, capture photographic evidence, log physical state changes. |
| **Supervisor** | Floor Supervisor, Housekeeping Manager, Heritage Conservator (Delegated) | Mobile PWA (Inspections), Desktop Web (Management) | Workload balancing, digital quality audits, SLA escalation handling, maintenance clearance, SOP governance. |
| **Front Office & Operations** | Front Desk Receptionist, Duty Manager, General Manager | Desktop Web (Workstation) / Embedded PMS Panel | Monitor room readiness, activate guest queue flags, dispatch ad-hoc service requests, reconcile physical occupancy. |

An optional standalone administrative role, **Heritage & Compliance Manager**, operates via Desktop Web to curate the chemical/mechanical SOP catalog, approve material conservation profiles, and manage physical dispute archives.

### 2.2 Discrete Role Capability Matrix

```
                      +---------------------------------------+
                      |       ROLE ACCESS BOUNDARIES          |
                      +---------------------------------------+
                      | Room Attendant (P1)                   |
                      |   ├── View Daily Shift Queue           |
                      |   ├── Execute 7-Step Cleaning SOP     |
                      |   ├── Log Material Defect / Damage    |
                      |   └── Log Minibar Consumption         |
                      |                                       |
                      | Engineering Technician (P5)           |
                      |   ├── Accept Work Order Ticket        |
                      |   ├── View Material Repair Protocol   |
                      |   └── Upload Resolution Photo         |
                      |                                       |
                      | Royal Butler & Protocol Officer (P6)  |
                      |   ├── Receive VIP Ad-hoc Request      |
                      |   └── Coordinate Private Hospitality  |
                      |                                       |
                      | Floor Supervisor (P2)                 |
                      |   ├── Conduct 20-Point Digital Audit  |
                      |   ├── Re-assign Block Tasks           |
                      |   └── Clear Standard Maintenance Lock |
                      |                                       |
                      | Front Desk Receptionist (P4)          |
                      |   ├── Read Live Room Readiness Grid   |
                      |   ├── Flag Priority Queue Room        |
                      |   └── Dispatch Guest Service Request  |
                      +---------------------------------------+
```

### 2.3 Strict Authorization Rules for Backend Services
1. **Separation of Maintenance & Housekeeping**: A Room Attendant accessing the Field Worker interface cannot view, accept, or modify engineering work orders, nor can an Engineering Technician approve cleaning readiness.
2. **Data Minimization for VIP Profiles**: Guest profiles and VIP preferences must be truncated to operational necessity. Attendants receive task-specific instructions (e.g., extra feather pillows) without exposure to full guest identity, contact records, or billing profiles.
3. **SOP Modification Restrictions**: Field Supervisors cannot alter chemical formulations, mechanical tools, or approved procedures within Heritage Asset Profiles. All SOP modifications require cryptographic approval from a certified Heritage Conservator.
4. **Maintenance Lock Clearance**: An attendant marking a room clean does not clear an active `Out of Order (OOO)` or `Out of Service (OOS)` lock. Locks can only be cleared through the dual engineering-supervisor resolution pipeline.
5. **Independent Quality Audits**: When a Floor Supervisor directly cleans or touches up a room, the system strictly forbids self-inspection; an independent peer or manager audit is enforced by backend validation.

---

## 3. Finite State Machine (FSM) Lifecycle Architecture

The system tracks four decoupled operational dimensions to eliminate discrepancies between Front Office, Housekeeping, and Engineering:

```
[Cleanliness State FSM]
Dirty ──► Servicing In Progress ──► Clean (Pending Audit) ──► Inspected / Ready
  ▲                                           │
  └────────────── Re-Clean Rejected ──────────┘

[Task Execution FSM]
Assigned ──► Received ──► In Progress ──► Paused ──► Completed Locally ──► Syncing ──► Submitted ──► Approved

[Facility Maintenance FSM]
Defect Reported ──► Categorized ──► Work Order Dispatched ──► Repaired ──► Inspected ──► Closed

[Reservation Availability Dimension (Determined by PMS)]
Sellable & Assignable │ Restricted Hold │ Out of Service (OOS) │ Out of Order (OOO Hard Lock)
```

### 3.1 State Dimension Transition Specifications

#### Cleanliness State Dimension
* `Dirty`: Generated automatically upon guest checkout event or daily stayover schedule.
* `Servicing In Progress`: Triggered when an attendant taps "Start Cleaning" on the client device.
* `Clean (Pending Audit)`: Triggered when all mandatory checklist items are marked complete and submitted for supervisory review.
* `Inspected / Ready`: Triggered when a supervisor conducts a digital inspection audit and records an acceptable score with zero critical preservation defects.

#### Task Execution Dimension
* `Assigned`: Task generated by the algorithmic dispatch engine and mapped to an attendant.
* `Received`: Client device acknowledges receipt and persists task data in local IndexedDB.
* `In Progress`: Attendant initiates active cleaning; timer begins calculating net elapsed duration.
* `Paused`: Attendant selects a documented pause reason (meal break, floor assistance, linen delay); timer freezing occurs.
* `Completed Locally`: Attendant marks completion while offline; stored in local Outbox awaiting transmission.
* `Syncing`: Client establishes network transport and attempts server handshake.
* `Submitted`: Server receives payload, validates idempotency key, and alerts supervisor.
* `Approved` / `Rejected`: Supervisor accepts room readiness or rejects with corrective items.

#### Facility Maintenance Dimension
* `Defect Reported`: Defect logged with photographic evidence and physical categorization.
* `Categorized`: System evaluates impact: structural/safety issue triggers automatic PMS lock (`OOO`), while minor cosmetic issue flags operational warning (`OOS`).
* `Work Order Dispatched`: Routed to designated engineering technician queue.
* `Repaired`: Technician completes physical fix and uploads post-repair photograph.
* `Inspected`: Floor Supervisor verifies physical repair in person.
* `Closed`: Work order archived and room returned to standard housekeeping workflow.

---

## 4. Offline-First Resilience & Distributed Data Synchronization Engine

Thick adobe walls, subterranean service tunnels, and remote desert locations result in frequent network dropouts. The platform implements an offline-first distributed synchronization engine.

```
+-----------------------------------------------------------------------+
|                    CLIENT LOCAL OUTBOX PIPELINE                       |
+-----------------------------------------------------------------------+
| UI Event Trigger ──► Write to Local SQLite / IndexedDB Storage        |
|                               │                                       |
|                  Verify Persistent Write Success                      |
|                               │                                       |
|       [State: SAVED_LOCAL] ───┴───► Queue in Persistent Outbox        |
|                                           │                           |
|       Network Watcher Detects Connection ◄┘                           |
|                               │                                       |
|           Send HTTPS Request with Idempotency-Key                     |
|                               │                                       |
|             Receive Server ACK & Sequence Nonce                       |
|                               │                                       |
|    Update Local Record: [State: SERVER_ACKNOWLEDGED]                  |
+-----------------------------------------------------------------------+
```

### 4.1 Storage & Synchronization State Enumeration
Every user action, checklist progression, defect ticket, and minibar entry must be tagged with exactly one of the eight synchronization states:

| State Code | Descriptive Meaning | UI Representation & Constraint |
| :--- | :--- | :--- |
| `UNSAVED` | Action triggered in client memory but not yet committed to local persistent storage. | Action button disabled; processing spinner visible. |
| `SAVED_LOCAL` | Data committed to local IndexedDB/SQLite. Action is secure on device. | Neutral storage badge; explicit disclaimer: "Saved locally — pending dispatch". |
| `QUEUED` | Action placed in the outgoing network synchronization queue. | Outbox counter displays pending queue depth (e.g., "3 items pending"). |
| `IN_FLIGHT` | Active transport request open; awaiting server HTTP acknowledgement. | Animated sync icon; actions remain locked against duplicate submission. |
| `SERVER_ACKNOWLEDGED` | Central backend API received, validated, and persisted the record. | Green checkmark; central SLA timers initiate. |
| `PMS_PENDING` | Central server processed update but external PMS integration has not confirmed state change. | Warning indicator: "Internal system updated — awaiting PMS confirmation". |
| `FULLY_SYNCED` | All distributed targets (HMS Backend, PMS API, Engineering CMMS) confirmed state. | Complete operational green state. |
| `NEEDS_REVIEW` | Distributed conflict, schema rejection, or operational collision detected. | Amber alert; routes record directly to Supervisory Conflict Resolution panel. |

### 4.2 Engineering & Distributed Synchronization Protocols
* **Local Persistent Outbox**: Every mutation creates an immutable JSON envelope stored locally with a UUIDv4 `idempotency_key`, ISO-8601 client generation timestamp, user credentials hash, and schema version.
* **Deterministic Conflict Resolution (Anti-LWW)**: Blind Last-Write-Wins (LWW) is strictly banned across all endpoints. Conflicts are resolved via domain-specific operational rules:
  * *Room Status Conflict*: If a mobile attendant marks a room "Clean" while an offline technician simultaneously logs an "OOO Plumbing Leak", the server gives absolute precedence to the maintenance defect, locking the room to `OOO` and rejecting the clean state.
  * *Minibar Consumption Collision*: If two staff members log consumption for the same room during network partitions, items are never summed automatically. The engine flags the conflict as a shared transaction anomaly requiring supervisory verification to prevent duplicate guest charges.
* **Idempotent Network Retries**: Failed network transmissions back off exponentially at randomized intervals: 1 minute, 5 minutes, 15 minutes, and 1 hour. Requests repeat the original `idempotency_key` to prevent duplicate database writes or double work order generation.
* **Attachment Decoupling**: Large photographic payloads must be isolated from state event payloads. If a defect photo fails to upload due to low bandwidth, the text metadata event (`SERVER_ACKNOWLEDGED`) transitions independently while the image retry pipeline runs in the background (`IMAGE_PENDING_UPLOAD`).

---

## 5. Functional Implementation Epics & Acceptance Criteria

```
+-----------------------------------------------------------------------+
|                    HMS FUNCTIONAL EPIC TOPOLOGY                       |
+-----------------------------------------------------------------------+
| EPIC 1: Field Worker Visual Interface (Glove-Friendly, Multi-Lang)     |
| EPIC 2: Bidirectional Real-Time PMS Event Integration Engine          |
| EPIC 3: Heritage Algorithmic Task Dispatch & Spatial Clustering       |
| EPIC 4: Certified Heritage SOP & Material Preservation Profiles       |
| EPIC 5: Defect Reporting & Programmatic PMS Maintenance Lock          |
| EPIC 6: Protocol & Butler Ad-Hoc Guest Service Dispatch               |
| EPIC 7: Chain-of-Custody Digital Lost & Found Engine                  |
| EPIC 8: Active Cleaning Timer & Forensic Break Tracking               |
| EPIC 9: Supervisory Digital Inspection & 15-Minute Queue SLA          |
| EPIC 10: Inventory Par Stock, Artifact Tracking & Minibar Billing     |
| EPIC 11: Distributed Offline-First Synchronization & Outbox Engine    |
| EPIC 12: Contextual Gamification & Shift Milestone Engine             |
| EPIC 13: Enterprise Heritage Governance, Audit Trail & Data Security  |
+-----------------------------------------------------------------------+
```

### EPIC 1: Field Worker Visual Interface & Accessibility
* **Scope**: Build a high-contrast, touch-optimized PWA client designed for mobile viewports (360px–430px width).
* **Requirements**:
  * All primary interactive touch targets must measure at least **64×64 pixels** with a minimum **12-pixel** boundary margin to guarantee seamless operation while wearing standard nitrile or latex cleaning gloves.
  * Single-tap instant language switcher on the persistent navigation header supporting Arabic (RTL), English, Tagalog, Hindi, and Spanish.
  * Information architecture must follow an **Icon-First + Text Label** pattern with high-contrast AAA color differentiation (black text on high-contrast backgrounds; distinct badge fills).

### EPIC 2: Bidirectional Real-Time PMS Event Integration Engine
* **Scope**: Integration engine handling inbound and outbound webhooks and REST endpoints connecting to PMS systems (e.g., Oracle OPERA Cloud via OHIP APIs, Cloudbeds).
* **Requirements**:
  * Ingest inbound `CHECK_OUT` webhooks to instantly instantiate `Dirty` room states and append rooms to the dispatch queue.
  * Transmit outbound status transitions (`Servicing In Progress`, `Clean`, `Inspected`) to the PMS.
  * Must support configurable Service Level Objectives (SLOs) and log internal network transit lag independently from external third-party response times.

### EPIC 3: Heritage Algorithmic Task Dispatch & Spatial Clustering
* **Scope**: Dynamic task assignment engine distributing daily workload across attendants.
* **Requirements**:
  * Calculate priority using a deterministic hierarchy:
    1. Life Safety & Environmental Hazard Containment.
    2. Physical Heritage Material Preservation Needs.
    3. Mandatory Check-in Times & Reception Lobby Queue Rooms.
    4. Arriving VIP & Royal Protocol Tiers.
    5. Standard Departure Turnovers (`Vacant Dirty`).
    6. Daily Stayover Service (`Occupied Dirty`).
  * Cluster tasks geographically by floor wing, courtyard quadrant, or detached villa row to minimize transit through long stone corridors and open courtyards.

### EPIC 4: Certified Heritage SOP & Material Preservation Profiles
* **Scope**: Specialized checklist engine dynamically rendering step-by-step procedures based on the unique physical surface composition of each assigned room.
* **Requirements**:
  * Read the room's **Heritage Asset Profile** and inject material-specific instructions into the active 7-step checklist.
  * Forbid hardcoded cleaning formulas; present only certified, non-abrasive procedures matching the room's specific wood, stone, plaster, or textile assets.
  * Require workers to confirm the pre-work physical inspection checklist before starting mechanical work on sensitive surfaces.

### EPIC 5: Defect Reporting & Programmatic PMS Maintenance Lock
* **Scope**: Field worker defect identification and automatic inventory isolation pipeline.
* **Requirements**:
  * Provide a defect logging interface with photographic capture, physical location tagging, and severity selection (P1 Critical, P2 High, P3 Standard).
  * When a P1 defect is committed, trigger an automatic server-side instruction to the PMS locking the room into `Out of Order (OOO)` or `Out of Service (OOS)` status based on configured property policy.
  * Prevent Front Office from executing guest check-in via programmatic API blocks until the work order is signed off by Engineering and certified by a Supervisor.

### EPIC 6: Protocol & Butler Ad-Hoc Guest Service Dispatch
* **Scope**: Low-latency dispatch pipeline for guest service requests.
* **Requirements**:
  * Ingest requests for extra linens, traditional coffee (Gahwa), incense burning, or prayer furnishings directly from Front Desk, Butler stations, or guest portals.
  * Push requests directly to the smartphone of the attendant assigned to the corresponding floor quadrant.
  * Initiate an active countdown timer tied to property SLAs (default: 15-minute response window). If unacknowledged within 3 minutes, escalate automatically to the Floor Supervisor.

### EPIC 7: Chain-of-Custody Digital Lost & Found Engine
* **Scope**: Tamper-proof logging and tracking workflow for guest property found in departed suites.
* **Requirements**:
  * Mandate an *in situ* photograph captured within the room before the item is handled or relocated.
  * Automatically associate the item with the departing guest's PMS reservation ID, room number, date, and finder employee hash.
  * Track retention cycles (30, 60, or 90 days) configured in accordance with national legal statutes, providing secure chain-of-custody handoff logs for vault storage.

### EPIC 8: Active Cleaning Timer & Forensic Break Tracking
* **Scope**: Time-tracking engine measuring true room turnover duration without skewing operational metrics during legitimate pauses.
* **Requirements**:
  * Record discrete timestamps for `Start Cleaning` and `Mark Clean`.
  * Feature an explicit **Pause Cleaning** modal requiring the user to select a valid operational delay reason (e.g., Meal Break, Cross-Floor Assistance, Missing Supplies, Supervisor Consultation).
  * Calculate **Net Active Turnover Time** ($T_{\text{net}} = T_{\text{total}} - \sum T_{\text{pause}}$) to preserve accurate employee efficiency benchmarks and KPI integrity.

### EPIC 9: Supervisory Digital Inspection & 15-Minute Queue SLA
* **Scope**: Mobile inspection interface for floor supervisors conducting final quality certifications.
* **Requirements**:
  * Render a 20-point digital inspection matrix evaluating both hygiene and heritage material preservation.
  * Compute the standardized cleanliness index ($S_{\text{room}}$); fail any room scoring below 90% or failing any single critical safety/preservation checkpoint.
  * Enforce an automated **15-minute SLA countdown timer** for rooms flagged as `Queue Room` (guest waiting in lobby). If uninspected upon timer expiration, fire an urgent escalation alarm to the Housekeeping Manager's console.

### EPIC 10: Inventory Par Stock, Artifact Tracking & Minibar Billing
* **Scope**: Real-time asset tracking across floor pantries, guestrooms, and storage vaults.
* **Requirements**:
  * Track linen, towel, and luxury amenity consumption against floor pantry Par levels (baseline configurable, initialized at $1.5\times$ to $3.5\times$ daily turnover volume), emitting replenishment warnings when stock breaches safety thresholds.
  * Provide visual tap counters for minibar and consumable items; post charges directly to the active guest folio in the PMS upon completion.
  * Maintain a discrete registry of museum-grade artifacts, framed artwork, and handcrafted furnishings allocated to each suite to detect theft or unauthorized movement.

### EPIC 11: Distributed Offline-First Synchronization & Outbox Engine
* **Scope**: Core client-side SQLite/IndexedDB data layer and transaction manager.
* **Requirements**:
  * Capture all user mutations in an indexed client Outbox.
  * Tag every record with one of the 8 persistent synchronization states.
  * Re-establish transport connections automatically upon network recovery, resolving state conflicts via strict business priority logic and maintaining comprehensive local audit journals.

### EPIC 12: Contextual Gamification & Shift Milestone Engine
* **Scope**: Positive visual feedback mechanisms that drive employee engagement without compromising safety or preservation.
* **Requirements**:
  * Display a prominent, dynamic **Shift Progress Indicator** (e.g., "5 of 9 Suites Completed — 56%") on the primary task board.
  * Award zero-defect digital badges for suites that pass supervisory inspection on the first iteration.
  * Strictly prohibit auditory fanfare or loud celebrations that could disturb quiet guest zones, and ensure incentives reward quality and preservation over rushed turnover speed.

### EPIC 13: Enterprise Heritage Governance, Audit Trail & Data Security
* **Scope**: Centralized administrative console for historical auditing, compliance reporting, and cryptographic data protection.
* **Requirements**:
  * Maintain an immutable, append-only audit trail logging every room state transition, inspection score, work order override, and user login timestamp.
  * Enforce strict client-side storage quotas and automated image eviction protocols on personal staff devices (BYOD) to maintain privacy and comply with regional personal data protection regulations.
  * Provide full versioning and audit trails for all Heritage SOP documents, tracking updates, author credentials, and conservator sign-offs.

---

## 6. Heritage Asset Protection, Material Science & Specialized SOPs

Generic commercial cleaning protocols destroy authentic heritage substrates. The platform embeds material preservation rules into the digital task engine.

### 6.1 Heritage Asset Profile Schema
Every historic suite maintains a structured material asset profile consumed dynamically by the mobile task engine:

```json
{
  "asset_id": "ASSET-DIR-312-04",
  "room_number": "312",
  "surface_category": "WOOD_MANJOUR_CARVED",
  "material_composition": "Untreated Tamarix / Teak Inlay",
  "sensitivity_grade": "CRITICAL_TIER_1",
  "physical_condition": "STABLE_ORIGINAL",
  "finish_type": "Natural Beeswax Polish (Zero Polyurethane)",
  "approved_method_id": "SOP-HERITAGE-WD-02",
  "approved_tools": ["Electrostatic Microfiber Duster", "Horsehair Detailing Brush"],
  "prohibited_actions": [
    "WATER_WASHING",
    "ALCOHOL_SOLVENTS",
    "SYNTHETIC_DETERGENTS",
    "HIGH_PRESSURE_AIR"
  ],
  "inspection_frequency": "DAILY_VISUAL_WEEKLY_CONSERVATOR",
  "curator_signoff_date": "2026-10-15T12:00:00Z"
}
```

### 6.2 Material Conservation Protocols
AI agents must build validation rules preventing the entry or propagation of generic cleaning recommendations. Cleaning logic must strictly follow documented conservation science:

| Architectural Material Class | Approved Mechanical & Chemical Protocol | Strictly Prohibited Interventions |
| :--- | :--- | :--- |
| **Traditional Adobe & Sun-Dried Mud Brick (Libn)** | Dry electrostatic dust capture only; soft-bristle goat-hair brushes; spot consolidation reporting to Master Mason. | Liquid saturation; pressurized water; chemical biocides; abrasive scouring pads; synthetic sealants. |
| **Hand-Carved Najdi / Hijazi Timber (Manjour & Doors)** | Static dusting; natural microcrystalline or beeswax emulsion reconditioning (when certified); dry lint-free cotton buffing. | Bleach; ammonia; silicone aerosol polishes; wet mopping; acidic citrus-based wood cleaners. |
| **Natural Riyadh Limestone & Sandstone Masonry** | pH-neutral demineralized water damp-sponge extraction (low moisture); non-ionic surfactants ($<1\%$ dilution). | Hydrochloric or muriatic acid washes; wire bristle brushes; high-pressure steam; rotary floor polishers. |
| **Historical Gypsum Plasterwork (Juss Engravings)** | Low-suction HEPA dry vacuuming with micro-attachment brush spacer; soft natural hair dusting. | Wet wiping; scraping; generic room freshener direct sprays; abrasive cream cleansers. |
| **Raw Brass & Chiseled Copper Furnishings** | Microfiber dry polish; specialized non-abrasive museum conservation paste (applied monthly by certified staff). | Caustic alkaline cleaners; abrasive scrubbing sponges; industrial solvent dips; unbuffered acid washes. |

### 6.3 Mandatory Pre-Work Heritage Inspection Sequence
Before initiating cleaning operations in any heritage suite, the mobile client forces the attendant to verify three critical safety checkpoints:
1. **Physical Asset Identification**: Attendant confirms visually that the material profile displayed matches the physical asset in the suite.
2. **Method & Tool Verification**: Attendant confirms possession of the certified tools and materials specified in the active SOP.
3. **Substrate Integrity Verification**: Attendant checks for damp spots, structural flaking, plaster powdering, or insect frass. If damage is observed, work in that quadrant is immediately suspended, a defect ticket is submitted, and the Floor Supervisor is summoned.

### 6.4 Cultural Protocol & Environmental Atmosphere Integration
* **Incense & Bakhoor Governance**: Burning authentic agarwood or oud is never an unmanaged default. The system checks guest health preferences (asthma, respiratory sensitivities), verifies functional fire detection isolation protocols, and logs explicit guest consent before scheduling turndown incense ceremonies.
* **Traditional Hospitality Staging**: Suite readiness encompasses verifying the complete presentation of the Arabic hospitality tray: polished brass Dallah, clean finjan cups, premium locally sourced dates, chilled water carafes, and appropriate placement of prayer rugs aligned to the Qibla.

---

## 7. User Interface Specification & Native Design System Tokens

The visual language balances contemporary usability with authentic regional aesthetics, optimized for mobile (PWA) and desktop environments.

### 7.1 Regional Design Tokens

```css
:root {
  /* Surface & Base Colors (Regional Architectural Materials) */
  --color-heritage-adobe: #D2A679;          /* Sun-dried Mud Brick */
  --color-heritage-limestone: #F4EADB;      /* Riyadh Sandstone Surface */
  --color-heritage-plaster: #FAFAF7;        /* Traditional White Juss Gypsum */
  --color-heritage-palm-dark: #2B3A27;      /* Deep Date Palm Canopy */
  --color-heritage-desert-night: #1A1A18;   /* Deep Basalt Shadow / Body Text */
  
  /* Operational Status & Signal Tokens */
  --status-dirty: #C84B31;                  /* High-Contrast Terracotta Red */
  --status-in-progress: #D9822B;            /* Desert Ochre Amber */
  --status-clean-audit: #2D68C4;            /* Gulf Deep Water Cobalt */
  --status-inspected-ready: #237844;        /* Oasis Date Palm Green */
  --status-paused: #8C6D53;                 /* Weathered Clay Brown */
  --status-ooo-hard-lock: #1F1D1D;          /* Volcanic Basalt Black */
  
  /* Touch & Layout Geometry */
  --min-tap-target-size: 64px;             /* Glove-Friendly Minimum Dimension */
  --tap-target-margin: 12px;               /* Boundary Padding Between Controls */
  --border-radius-heritage-card: 8px;      /* Soft Organic Chamfer */
  --font-family-arabic: "IBM Plex Sans Arabic", "Noto Sans Arabic", sans-serif;
  --font-family-latin: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
}
```

### 7.2 Mobile PWA Layout Blueprint (Field Worker)

```
+-------------------------------------------------------------+
| [⚡ Logo]  Room 312: Departure Clean      [🌐 EN | 🇸🇦 AR]  |
| 🟢 ONLINE (Synced 08:30)                    [☁️ 0 Pending]   |
+-------------------------------------------------------------+
| ⚠️ HERITAGE NOTICE: Hand-Carved Manjour Wood Present        |
|    "Execute SOP-HERITAGE-WD-02: Use Soft Dry Brush Only"    |
+-------------------------------------------------------------+
| PROGRESS: STEP 3 OF 7 (High-to-Low Dusting)                 |
| [=========================>                        ] 42%    |
+-------------------------------------------------------------+
|                                                             |
|   +-----------------------------------------------------+   |
|   | [📸 REFERENCE PHOTO: Approved Brush Technique]      |   |
|   |                                                     |   |
|   | 1. Dust ceiling coving with horsehair attachment.   |   |
|   | 2. Buff wood fretwork lightly without water.        |   |
|   +-----------------------------------------------------+   |
|                                                             |
|   +-----------------------------------------------------+   |
|   |               [  COMPLETE STEP (64px)  ]            |   |
|   +-----------------------------------------------------+   |
|                                                             |
|   +--------------------------+ +------------------------+   |
|   | [⚠️ REPORT DEFECT (64px)] | | [⏸️ PAUSE WORK (64px)] |   |
|   +--------------------------+ +------------------------+   |
|                                                             |
+-------------------------------------------------------------+
| Shift Target: 4 of 9 Suites Finished         [Active: 18m]  |
+-------------------------------------------------------------+
```

### 7.3 Desktop Web Layout Blueprint (Supervisor & Manager Console)

```
+---------------------------------------------------------------------------------------+
| GULF HERITAGE HMS  │ 🏢 Suites: 104 │ 🔴 Dirty: 14 │ 🟡 Active: 6 │ 🟢 Ready: 78    |
+---------------------------------------------------------------------------------------+
| [QUADRANT HEATMAP FILTER: All │ North Wing │ South Courtyard │ Royal Villas]           |
|                                                                                       |
| +-------------------+ +-------------------+ +-------------------+ +-----------------+ |
| | SUITE 101 [VIP]   | | SUITE 102         | | SUITE 103 [QUEUE] | | SUITE 104 (OOO) | |
| | 🟢 Inspected      | | 🟡 Servicing      | | 🔵 Clean (Audit)  | | 🖤 Broken HVAC  | |
| | Attendant: Salem  | | Attendant: Nora   | | Attendant: Tariq  | | Ticket #8921    | |
| | Ready for Checkin | | Elapsed: 14m      | | SLA: 04:12 Remain | | Tech: Mansoor   | |
| +-------------------+ +-------------------+ +-------------------+ +-----------------+ |
|                                                                                       |
| [DRAG-AND-DROP WORKLOAD DISPATCH ENGINE]                                              |
| Attendant Nora (Floor 1):  [Suite 102 (🟡)] ──► [Suite 105 (🔴)] ──► [Suite 108 (🔴)] |
| Attendant Tariq (Floor 2): [Suite 201 (🟢)] ──► [Suite 204 (🔴)] ──► [Suite 209 (🔴)] |
|                                                                                       |
| [CRITICAL SLA ESCALATIONS & HERITAGE ALERTS]                                          |
| ⚠️ 08:24: Suite 103 Queue Room awaiting inspection (>10 mins elapsed)                 |
| ⚠️ 08:15: Suite 312 Mud Brick flaking reported - Master Mason dispatched              |
+---------------------------------------------------------------------------------------+
```

---

## 8. Context-Aware Voice Guidance Engine

To ensure field attendants remain focused on physical materials without constantly staring at glass screens, the PWA client includes an ambient, context-aware audio engine.

### 8.1 Voice Operational Rules & Acoustic Constraints
* **Subtle & Concise Delivery**: Audio cues must last between **2 and 5 seconds**, delivering a single operational instruction.
* **Strict Guest Privacy & Noise Discipline**: Voice prompts are strictly prohibited from announcing guest names, VIP titles, or room numbers in public hallways.
* **Safety & Hazard Priority**: Acoustic safety warnings (e.g., chemical hazard, material fragility alerts) immediately interrupt commercial or priority notifications.
* **Full Visual Redundancy**: Every spoken prompt must correspond to an identical, high-visibility text message on screen.
* **Offline Audio Caching**: All audio soundbites must be pre-rendered and stored in client IndexedDB storage to function in network dead zones.

### 8.2 Standard Audio Operational Matrix

| Trigger Event | Arabic Script Prompt | English Audio Script | Target Acoustic Duration |
| :--- | :--- | :--- | :--- |
| `SHIFT_START` | أهلاً نورة. لديك تسع مهام اليوم. | Welcome Nora. You have nine assignments today. | 3.2 sec |
| `TASK_ASSIGNED` | لديك مهمة جديدة. راجعي التفاصيل. | New task assigned. Please check details. | 2.5 sec |
| `HERITAGE_WARNING` | توجد مادة حساسة. اتبعي التعليمات المعتمدة. | Sensitive material present. Follow certified protocol. | 3.8 sec |
| `LOCAL_TIMER_START` | بدأ تسجيل وقت المهمة على الجهاز. | Local task timer started. | 2.4 sec |
| `STEP_COMPLETE` | أكملي الفحص، ثم اضغطي تم. | Complete visual check, then tap done. | 2.6 sec |
| `TIMER_PAUSED` | تم إيقاف مؤقت العمل. | Task timer paused. | 1.8 sec |
| `TIMER_RESUMED` | تم استئناف وقت العمل. | Task timer resumed. | 1.9 sec |
| `DEFECT_REPORTED` | أوقفي العمل في المنطقة المتأثرة، وأبلغي المشرف. | Halt work in affected area; notify supervisor. | 3.5 sec |
| `OFFLINE_ENTERED` | الاتصال غير متاح. راجعي حالة الحفظ على الشاشة. | Network unavailable. Monitor storage status. | 3.4 sec |
| `LOCAL_SAVE_OK` | حُفظ على الجهاز. لم يُرسل بعد. | Saved to device. Pending transmission. | 2.6 sec |
| `LOCAL_SAVE_FAIL` | لم يُحفظ التغيير. لا تغلقي التطبيق، واطلبي المساعدة. | Save failed. Do not close app; request help. | 4.1 sec |
| `SYNC_ACKNOWLEDGED` | وصل التقرير إلى النظام. | Update acknowledged by server. | 2.2 sec |
| `AD_HOC_REQUEST` | لديك طلب خدمة جديد. راجعي التفاصيل. | New guest service request received. | 2.7 sec |
| `INSPECTION_SUBMIT` | وصل طلب الفحص إلى المشرف. | Inspection request delivered to supervisor. | 2.8 sec |
| `INSPECTION_PASS` | تم اعتماد الغرفة. | Suite inspection approved. | 1.8 sec |
| `AUTH_EXPIRED` | انتهت الجلسة. سجلي الدخول لإكمال الإرسال. | Session expired. Re-authenticate to complete sync. | 3.6 sec |

---

## 9. Exception Handling, Conflict Resolution & Edge Cases

The system enforces deterministic protocols across ten critical operational failure scenarios:

### 1. Network Disconnection During Active Service
* Client enters `SAVED_LOCAL` status, caching checklist interactions and timestamps locally.
* Display banner: "Offline — Last server connection at HH:MM".
* Tasks currently in flight remain editable; new assignments are blocked until reconnect.
* Client forbids claiming actions were received by supervisors while disconnected.

### 2. Heritage Material Defect Identified Offline
* Attendant logs defect category, takes photo, and records audio/text note locally.
* Client updates local record to `SAVED_LOCAL` with priority `P1_CRITICAL`.
* Screen displays immediate notice: *"Defect recorded locally. Network is offline; you must verbally alert your Floor Supervisor via radio or runner immediately."*

### 3. Attachment Upload Failure & Partial Sync
* Payload decoupled: JSON event record updates to `SERVER_ACKNOWLEDGED` while photographic blob transitions to `IMAGE_RETRY_QUEUE`.
* System re-attempts image transmission on a randomized exponential schedule (1m, 5m, 15m, 1h).
* Dependent workflows proceed without locking other operational data.

### 4. Room Status Collision (Housekeeper vs. Maintenance)
* Attendant marks suite "Clean" while offline; concurrently, Engineering logs an "OOO Water Leak" on the server.
* Upon reconnection, server evaluates business rules: Maintenance `OOO Hard Lock` supersedes cleaning completion.
* Room remains `OOO`. The attendant's clean record is archived, and the attendant receives a notification explaining the maintenance hold.

### 5. Concurrent Minibar Consumption Logging
* Attendant A and Attendant B log minibar consumption for the same room during network partitions.
* Central engine detects transaction overlap; automated summation is blocked to prevent double-charging the guest.
* An anomaly ticket is routed to the Floor Supervisor for item verification.

### 6. Ad-Hoc Guest Request While Attendant is Offline
* Server attempts push notification to attendant; upon delivery failure after 60 seconds, task automatically re-routes to the Floor Runner or Supervisor.
* Prevents guest requests (towels, Gahwa) from sitting unread on an offline device.

### 7. Client Authentication Expiry Mid-Shift
* Unsent Outbox items are protected in encrypted device storage.
* Non-destructive login modal overlays view; user re-authenticates with PIN or biometric token.
* Queued synchronization resumes immediately without data loss.

### 8. Battery Failure or Abrupt Application Termination
* State reconstructed from the most recent persistent local record.
* Task elapsed time is calculated strictly from discrete `Start`, `Pause`, and `Resume` event timestamps—never by trusting client-side active JavaScript timers.

### 9. Storage Quota Exceeded or Camera Permission Denied
* If device storage is full: Client displays alert: *"Storage Full. Unable to save photo evidence. Alert supervisor immediately."*
* If camera access is denied: Client explains permission requirement and provides an administrative bypass pin for certified supervisors.

### 10. Central Property Management System (PMS) Downtime
* HMS server queues status updates in a resilient Outbox, continuing internal hotel operations.
* User interface clearly flags room states: *"Ready (HMS Verified) — Pending PMS Confirmation"*.
* Front Office managers make manual assignment decisions supported by verifiable local audit logs until the interface reconnects.

---

## 10. Phased Implementation Roadmap & Acceptance Testing

### 10.1 Three-Phase Release Strategy

```
PHASE 1: Core Minimum Viable Product (MVP)
├── 3 Consolidated Persona Interfaces (Field Worker, Supervisor, Front Office)
├── Core 7-Step Cleaning Workflow & Active Inspection Lifecycle
├── Heritage SOP Display with Pre-Work Checkpoint Verification
├── Local SQLite/IndexedDB Persistent Storage with 8-State Outbox Engine
├── Basic Defect Logging with Local Storage Protection
└── Baseline PMS Integration Adapter (Checked with Certified Vendor Sandbox)

PHASE 2: Advanced Logistics & Operational Scaling
├── Spatial Route Optimization & Automated Priority Index Dispatch
├── Full Engineering CMMS Integration with P1/P2/P3 Automated Locks
├── Dynamic Linen Par Stock Tracking & Minibar Billing Integration
├── Certified Heritage Asset Profile CMS & Conservator Workflow
└── 15-Minute Queue Room SLA Monitoring & Manager Escalation Console

PHASE 3: Enterprise Heritage Ecosystem & Multi-Property Governance
├── Museum-Grade Artifact Tracking & Loss-Prevention Vault Controls
├── Royal Butler & Specialized Cultural Guest Experience Module
├── Multi-Property Regional Governance & Centralized Audit Log Vault
└── Ambient Voice Guidance Engine with Full Offline Soundbite Caching
```

### 10.2 Mandatory Automated Acceptance Test Protocols (12 Core Test Gates)
Before any build is approved for staging deployment, it must pass all twelve test gates:

1. **Gate 01 (Offline Step Resilience)**: Execute a full 7-step cleaning sequence with the network disconnected. Terminate and restart the application after each step. Verify 100% of persisted data is recovered.
2. **Gate 02 (Idempotent Message Guarantee)**: Resend the same HTTP Outbox payload five times consecutively with identical idempotency keys. Verify database records exactly one transaction without duplicate tickets or inventory deductions.
3. **Gate 03 (Concurrent Maintenance Override)**: Submit a local "Mark Clean" event concurrently with a server-side "P1 OOO Leak" event. Verify the server enforces the `OOO` status and blocks the clean transition.
4. **Gate 04 (Attachment Decoupling)**: Simulate an upload failure on a 5MB defect photo while allowing metadata passage. Verify ticket metadata saves as `SERVER_ACKNOWLEDGED` while the image retries in the background.
5. **Gate 05 (Auth Expiry Protection)**: Force JWT expiration during active checklist completion. Verify client securely locks view, prompts for re-authentication, and transmits queued data upon login without loss.
6. **Gate 06 (Storage Saturation Grace)**: Fill simulated IndexedDB quota to capacity. Verify client displays transparent failure alerts rather than crashing silently.
7. **Gate 07 (PMS Partition Grace)**: Sever external PMS connection. Verify HMS records room readiness locally, informs operators of `PMS_PENDING` status, and flushes changes upon PMS recovery.
8. **Gate 08 (Offline Hazard Escalation)**: Log a P1 structural hazard while offline. Verify the interface warns the user to use physical/radio escalation channels immediately.
9. **Gate 09 (Stale Occupancy Detection)**: Attempt to start cleaning a room whose DND status was updated on the server while the client was disconnected. Verify the app prevents entry and prompts for status verification.
10. **Gate 10 (Strict Privilege Isolation)**: Attempt to trigger maintenance resolution, VIP profile expansion, or SOP modification from an attendant credential payload. Verify API gateway returns `403 Forbidden`.
11. **Gate 11 (Peer Inspection Separation)**: Submit an inspection sign-off payload where Inspector ID matches Attendant ID. Verify server rejects inspection with an operational conflict error.
12. **Gate 12 (Touch & Accessibility Compliance)**: Run automated layout test on 360px viewport. Verify 100% of primary interactive elements adhere to $\ge 64\times 64\text{px}$ touch targets and verify full RTL layout mirroring when Arabic is active.

---
*System Specification Architecture finalized for autonomous AI Agent implementation and full-stack software development.*
