# SPEC_DATA_SCHEMA.md — Data Architecture & IA

> **Project**: TrianglZ Hotel — Housekeeping Management System (HMS)
> **Phase**: 3 of 5 (Flows ➔ Data) · built on `SPEC_RESEARCH.md` + `SPEC_USER_FLOWS.md`
> **Generated**: 2026-09-23 · Initial Setup Mode
> **Stack assumption**: PostgreSQL (e.g. Supabase) + realtime channel (WebSocket) + PWA local store (IndexedDB). Adjust names freely; keep the **shape**.

---

## 1. Navigation Tree (Information Architecture)

```
HMS
├── 📱 Mobile PWA  (/m)  — P1 Attendant · P2 Supervisor · P5 Engineer (role-aware bottom nav, 4 tabs max)
│   ├── /m/login                      M-01  Team avatar grid + PIN
│   ├── /m/rooms                      M-02  My Rooms (Attendant)            [tab: Rooms]
│   │   └── /m/rooms/:roomId          M-03  Room Detail
│   │       ├── /checklist            M-04  Checklist execution
│   │       └── /report               M-05  Report issue / damage / DND / found item (sheet)
│   ├── /m/inspections                M-06  Inspection Queue (Supervisor)   [tab: Inspect]
│   │   └── /m/inspections/:taskId    M-07  Inspection Form
│   ├── /m/floor                      M-08  Floor Board (Supervisor)        [tab: Floor]
│   ├── /m/work-orders                M-10  Work Orders (Engineer)          [tab: Jobs]
│   │   └── /m/work-orders/:id        M-11  Work Order Detail
│   ├── /m/alerts                     M-09  Notifications                   [tab: Alerts]
│   └── /m/me                         M-12  Profile · Language · Today's stats [tab: Me]
│
└── 🖥️ Web App  (/app)  — P3 Manager · P4 Front Desk · P6 Admin (left sidebar)
    ├── /login                        W-00  Email + password (+ optional 2FA)
    ├── /app/board                    W-01  Live Board (all rooms, floor grid)
    │   └── ?room=:id                         Room Timeline drawer (audit)
    ├── /app/team                     W-02  Team Progress
    │   └── /app/team/:staffId                Staff Day View
    ├── /app/assign                   W-03  Assignment Board
    ├── /app/reports                  W-04  Reports & exports
    ├── /app/front-desk               W-05  Front Desk Board (READY view + Queue)
    ├── /app/work-orders              W-06  Work Orders list
    ├── /app/escalations              W-07  Escalation Center
    └── /app/settings                 W-08  Admin
        ├── /property                         Floors · Rooms · Room types
        ├── /checklists                       Checklist builder
        ├── /inspections                      Inspection templates
        ├── /users                            Staff & roles
        └── /rules                            Thresholds · SLAs · roll-over
```

---

## 2. Entity Relationship Model

```
Property 1─* Floor 1─* Room *─1 RoomType
Room 1─* HousekeepingTask *─1 Staff (assignee)
HousekeepingTask 1─1 ChecklistRun 1─* ChecklistItemResult *─1 ChecklistItemTemplate
ChecklistTemplate 1─* ChecklistItemTemplate          (versioned)
HousekeepingTask 1─0..* Inspection 1─* InspectionPointResult
Room 1─* RoomBlock (OOO/OOS)  0..1─1 WorkOrder
Room 1─* Overlay (DND / QUEUE / DISCREPANCY)
Room 1─* Incident (damage / lost&found / pest)
Every mutation ─▶ AuditEvent (append-only)
Media *─1 (ChecklistItemResult | InspectionPointResult | Incident | WorkOrder)
```

### 2.1 Core tables

#### `property`
| Field | Type | Notes |
| :-- | :-- | :-- |
| id | uuid PK | |
| name | text | "TrianglZ Hotel" |
| timezone | text | e.g. `Africa/Cairo` |
| settings | jsonb | see §5 Rules |

#### `floor`
| id uuid PK · property_id FK · number int · label text (e.g. "Floor 3 — East Wing") · sort_order int |

#### `room_type`
| Field | Type | Notes |
| :-- | :-- | :-- |
| id | uuid PK | |
| code | text | `STD`, `KNG`, `STE`… |
| name_i18n | jsonb | `{ "en": "Standard King", "ar": "كينج قياسي" }` |
| credits | numeric(3,1) | workload weight (Standard = 1.0, Suite = 2.0) |
| std_minutes | jsonb | `{ "departure": 30, "stayover": 15, "turnover": 25, "deep": 90, "turndown": 8 }` |

#### `room`
| Field | Type | Notes |
| :-- | :-- | :-- |
| id | uuid PK | |
| number | text UNIQUE per property | "304" |
| floor_id | FK | |
| room_type_id | FK | |
| section | text null | AM/PM section code (OPERA-style) |
| occupancy | enum `VACANT`,`OCCUPIED` | from PMS or Front Desk |
| fo_status | enum `NOT_RESERVED`,`ARRIVAL`,`STAYOVER`,`DUE_OUT`,`DEPARTED`,`TURNOVER` | reservation context |
| hk_status | enum `DIRTY`,`PICKUP`,`IN_PROGRESS`,`PAUSED`,`CLEAN`,`INSPECTING`,`INSPECTED` | housekeeping condition |
| hk_status_changed_at | timestamptz | |
| hk_status_changed_by | FK staff | |
| is_active | bool | soft-delete |
| version | int | optimistic concurrency |

> `is_ready` is **NOT** a column. It is a view (see §3).

#### `staff`
| Field | Type | Notes |
| :-- | :-- | :-- |
| id | uuid PK | |
| full_name | text | |
| photo_url | text null | shown on login grid |
| role | enum `ATTENDANT`,`SUPERVISOR`,`MANAGER`,`FRONT_DESK`,`ENGINEER`,`ADMIN` | one role per account |
| pin_hash | text null | mobile roles (argon2/bcrypt; never plain) |
| email | text null | web roles |
| preferred_lang | enum `ar`,`en`,`tl`,`hi`,`es` | |
| floors | uuid[] | default floors (for auto-assign & ad-hoc routing) |
| is_active | bool | deactivated staff keep history |

#### `shift`
| id · staff_id · date · type enum `AM`,`PM`,`NIGHT` · started_at · ended_at · device_id |

#### `housekeeping_task` — one unit of work on one room
| Field | Type | Notes |
| :-- | :-- | :-- |
| id | uuid PK | |
| room_id | FK | |
| business_date | date | hotel date (after roll-over) |
| task_type | enum `DEPARTURE`,`STAYOVER`,`TURNOVER`,`DEEP`,`TURNDOWN`,`VACANT_CHECK`,`RECLEAN`,`POST_REPAIR` | selects checklist |
| assignee_id | FK staff null | |
| assigned_by | FK staff | |
| priority | int | computed; Queue = 1000 bonus |
| state | enum `PENDING`,`IN_PROGRESS`,`PAUSED`,`DONE`,`SKIPPED_DND`,`REFUSED`,`CANCELLED`,`CARRIED_OVER` | |
| started_at / completed_at | timestamptz | |
| active_seconds | int | excludes pauses (KPI) |
| pause_log | jsonb | `[{ "at", "resumed_at", "reason" }]` |
| parent_task_id | FK null | set on RECLEAN (links to rejected task) |
| anomaly_flags | text[] | `TOO_FAST`,`BULK_TICK`,`NO_START`,`OFFLINE_CONFLICT` |

#### `checklist_template` / `checklist_item_template` (versioned)
| checklist_template: id · task_type · room_type_id null (null = all) · version int · is_published bool · created_by |
| :-- |

| checklist_item_template | Type | Notes |
| :-- | :-- | :-- |
| id | uuid PK | |
| template_id | FK | |
| zone | enum `VENTILATION_WASTE`,`LINEN_STRIP`,`DUSTING`,`BATHROOM`,`LINEN_RESTOCK`,`FLOOR`,`FINAL_AUDIT` | the 7-step SOP |
| label_i18n | jsonb | `{ "en": "Replace trash liners", "ar": "تغيير أكياس القمامة" }` |
| icon | text | icon key |
| reference_image_url | text null | "what good looks like" |
| is_mandatory | bool | gates Mark Clean (rule R-C) |
| requires_photo | bool | |
| sort_order | int | |

#### `checklist_item_result` ★ answers Q2
| Field | Type | Notes |
| :-- | :-- | :-- |
| id | uuid PK | |
| task_id | FK | |
| item_template_id | FK | pinned to template **version** used |
| status | enum `DONE`,`SKIPPED`,`PENDING` | |
| skip_reason | enum `NA`,`OUT_OF_STOCK`,`GUEST_BELONGINGS`,`OTHER` null | |
| done_by | FK staff | ★ answers Q1 at item level |
| done_at | timestamptz | server-received time |
| device_time | timestamptz | client time (offline) |
| photo_media_id | FK null | |

#### `inspection` + `inspection_point_result`
| inspection | Type | Notes |
| :-- | :-- | :-- |
| id | uuid PK | |
| task_id | FK | the cleaning task being verified |
| inspector_id | FK staff | |
| template_version | int | |
| started_at / finished_at | timestamptz | |
| score | numeric(5,2) | `Σ(w·x)/Σw × 100` |
| result | enum `PASSED`,`FAILED`,`WAIVED` | |
| is_remote | bool | Manager remote approval |
| notes | text | |

| inspection_point_result: id · inspection_id · point_template_id · zone · weight 1–3 · is_critical · passed bool · photo_media_id · note |
| :-- |

#### `room_block` (OOO / OOS)
| id · room_id · type enum `OOO`,`OOS` · reason_code · work_order_id null · from_at · to_at_estimate · created_by · released_at · released_by |
| :-- |

#### `work_order`
| id · room_id · category enum `PLUMBING`,`HVAC`,`ELECTRICAL`,`CARPENTRY`,`FURNITURE`,`PEST`,`OTHER` · urgency `P1`,`P2`,`P3` · state `OPEN`,`ACCEPTED`,`IN_PROGRESS`,`RESOLVED`,`VERIFIED`,`CANCELLED` · reported_by · assignee_id · description · resolution_note · needs_cleaning bool · created_at · accepted_at · resolved_at · verified_at |
| :-- |

#### `overlay`
| id · room_id · type enum `DND`,`QUEUE`,`DISCREPANCY`,`MUP` · data jsonb (`guest_name`, `requested_room_type`…) · created_by · created_at · cleared_at · cleared_by |
| :-- |

#### `incident`
| id · room_id · type enum `DAMAGE`,`MISSING_ITEM`,`LOST_FOUND`,`PEST` · description · location_tag · reported_by · reported_at · assessed_by · resolution · ref_no (sequential, e.g. `LF-2026-0042`) |
| :-- |

#### `media`
| id · storage_path · mime · width · height · taken_at · uploaded_at · uploaded_by · sha256 (tamper evidence) |
| :-- |

#### `audit_event` ★ answers Q1 — append-only, never updated/deleted
| Field | Type | Notes |
| :-- | :-- | :-- |
| id | bigserial PK | ordering |
| occurred_at | timestamptz | server time |
| device_time | timestamptz null | client time when offline |
| actor_id | FK staff null | null = SYSTEM |
| actor_role | enum | snapshot at event time |
| room_id | FK null | |
| entity | text | `room`, `task`, `checklist_item`, `inspection`, `work_order`… |
| entity_id | uuid | |
| type | text | see §4 event catalogue |
| from_state / to_state | text null | |
| payload | jsonb | e.g. `{ "reason": "BREAK" }` |
| device_id | text | |
| offline | bool | |
| is_override | bool | Supervisor+ acting on another's task |

> DB-level: `REVOKE UPDATE, DELETE ON audit_event` for the app role.

---

## 3. Derived State — `READY for check-in` ★ answers Q3

```sql
CREATE VIEW room_readiness AS
SELECT r.id AS room_id,
  (   r.occupancy = 'VACANT'
  AND r.hk_status = 'INSPECTED'           -- or 'CLEAN' when property.settings.inspection_required = false
  AND NOT EXISTS (SELECT 1 FROM room_block b WHERE b.room_id = r.id AND b.released_at IS NULL)
  AND NOT EXISTS (SELECT 1 FROM work_order w WHERE w.room_id = r.id AND w.state IN ('OPEN','ACCEPTED','IN_PROGRESS') AND w.urgency = 'P1')
  ) AS is_ready,
  /* one display status for UI, first match wins */
  CASE
    WHEN EXISTS (block OOO)                    THEN 'BLOCKED_OOO'
    WHEN EXISTS (block OOS)                    THEN 'BLOCKED_OOS'
    WHEN EXISTS (overlay DND active)           THEN 'DND'
    WHEN r.occupancy='OCCUPIED' AND r.hk_status IN ('CLEAN','INSPECTED') THEN 'OCCUPIED_CLEAN'
    WHEN r.occupancy='OCCUPIED'                THEN 'OCCUPIED_DIRTY'
    WHEN r.hk_status='INSPECTED'               THEN 'READY'
    WHEN r.hk_status IN ('CLEAN','INSPECTING') THEN 'AWAITING_INSPECTION'
    WHEN r.hk_status IN ('IN_PROGRESS','PAUSED') THEN 'CLEANING'
    ELSE 'DIRTY'
  END AS display_status
FROM room r;
```

### 3.1 Display status ➔ UI mapping (used by `SPEC_DESIGN_SYSTEM.md §3`)

| display_status | Label EN / AR | Token family | Icon |
| :-- | :-- | :-- | :-- |
| `READY` | Ready / جاهزة | `success` | check-circle |
| `AWAITING_INSPECTION` | Awaiting inspection / بانتظار الفحص | `info` | clipboard-check |
| `CLEANING` | Cleaning / قيد التنظيف | `warning` | spray / timer |
| `DIRTY` | Dirty / غير نظيفة | `error` | bed-dirty |
| `DND` | Do not disturb / عدم الإزعاج | `dnd` | moon |
| `BLOCKED_OOO` / `BLOCKED_OOS` | Out of order / Out of service · خارج الخدمة | `blocked` | wrench / ban |
| `OCCUPIED_CLEAN` | Occupied · clean / مشغولة · نظيفة | `neutral` + success dot | user |
| `OCCUPIED_DIRTY` | Occupied · service due / مشغولة · تحتاج خدمة | `neutral` + error dot | user |

---

## 4. State Machines & Event Catalogue

### 4.1 `room.hk_status` transitions (server-enforced)

| From | To | Event | Allowed roles | Guard |
| :-- | :-- | :-- | :-- | :-- |
| DIRTY / PICKUP | IN_PROGRESS | `CLEAN_STARTED` | Attendant (assignee), Supervisor+ | no active OOO; no DND |
| IN_PROGRESS | PAUSED | `CLEAN_PAUSED` | assignee | reason required |
| PAUSED | IN_PROGRESS | `CLEAN_RESUMED` | assignee, Supervisor+ | |
| IN_PROGRESS | CLEAN | `CLEAN_COMPLETED` | assignee | all mandatory items DONE; required photos present |
| CLEAN | INSPECTING | `INSPECTION_STARTED` | Supervisor+ | inspector ≠ cleaner |
| INSPECTING | INSPECTED | `INSPECTION_PASSED` | Supervisor+ | score ≥ threshold, no critical fail |
| INSPECTING | DIRTY | `INSPECTION_FAILED` | Supervisor+ | ≥1 photo + note; spawns RECLEAN task |
| CLEAN | INSPECTED | `INSPECTION_WAIVED` | SYSTEM | sampling rule |
| any | DIRTY | `STATUS_RESET` | Supervisor+ | reason required (`is_override`) |
| INSPECTED / CLEAN | DIRTY | `CHECKED_OUT` / `ROLLOVER` | SYSTEM / Front Desk / PMS | |
| any (bulk) | CLEAN / INSPECTED | `BULK_STATUS_CHANGE` | Manager | reason required; flags `NO_START` |

### 4.2 Event catalogue (non-exhaustive)
`SHIFT_STARTED`, `SHIFT_ENDED`, `ROOM_ASSIGNED`, `ROOM_REASSIGNED`, `CLEAN_STARTED`, `CLEAN_PAUSED`, `CLEAN_RESUMED`, `ITEM_CHECKED`, `ITEM_UNCHECKED`, `ITEM_SKIPPED`, `PHOTO_ATTACHED`, `CLEAN_COMPLETED`, `INSPECTION_STARTED`, `INSPECTION_PASSED`, `INSPECTION_FAILED`, `INSPECTION_WAIVED`, `DND_FLAGGED`, `DND_CLEARED`, `SERVICE_REFUSED`, `QUEUE_ADDED`, `QUEUE_CLEARED`, `WORK_ORDER_CREATED`, `WO_ACCEPTED`, `WO_RESOLVED`, `WO_VERIFIED`, `BLOCK_CREATED`, `BLOCK_RELEASED`, `DAMAGE_REPORTED`, `LOST_FOUND_LOGGED`, `CHECKED_IN`, `CHECKED_OUT`, `ROLLOVER`, `CARRIED_OVER`, `STATUS_RESET`, `BULK_STATUS_CHANGE`, `ESCALATION_RAISED`, `ESCALATION_RESOLVED`, `SYNC_CONFLICT`.

### 4.3 Realtime payload (WebSocket channel `property:{id}:rooms`)
```json
{
  "event": "CLEAN_COMPLETED",
  "event_id": 918273,
  "occurred_at": "2026-09-23T08:21:04Z",
  "room": { "id": "…", "number": "304", "hk_status": "CLEAN", "display_status": "AWAITING_INSPECTION", "is_ready": false },
  "actor": { "id": "…", "name": "Ahmed K.", "role": "ATTENDANT" },
  "task": { "id": "…", "active_seconds": 1740, "items_done": 22, "items_total": 22, "anomaly_flags": [] }
}
```
Fallback: SSE ➔ 15s polling. Clients de-dupe by `event_id`.

---

## 5. Configurable Rules (`property.settings`)

```json
{
  "inspection_required": true,
  "inspection_sampling": { "STAYOVER": 1.0, "DEPARTURE": 1.0 },
  "inspection_pass_score": 90,
  "rollover_time": "03:00",
  "sla": { "queue_inspection_min": 15, "p1_accept_min": 10, "guest_request_ack_min": 3, "dnd_welfare_hours": 24 },
  "anomaly": { "too_fast_ratio": 0.4, "bulk_tick_ratio": 0.8, "bulk_tick_window_sec": 60 },
  "attendant_target_credits": 16,
  "languages": ["ar", "en"],
  "photo_required_default_items": ["BED_MADE", "BATHROOM_VANITY"]
}
```

---

## 6. Roles & Permissions Matrix

| Capability | Attendant | Supervisor | Manager | Front Desk | Engineer | Admin |
| :-- | :-: | :-: | :-: | :-: | :-: | :-: |
| See own assigned rooms | ✅ | ✅ | ✅ | — | — | — |
| See all rooms board | — | ✅ (floors) | ✅ | ✅ (read) | — | ✅ |
| Start / tick / Mark Clean | ✅ own | ✅ override | ✅ override | — | — | — |
| Inspect & approve | — | ✅ | ✅ (+remote) | — | — | — |
| Assign / reassign | — | ✅ | ✅ | — | — | — |
| Queue guest | — | — | ✅ | ✅ | — | — |
| Check-in / check-out (standalone mode) | — | — | ✅ | ✅ | — | — |
| Report issue / DND / damage | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Resolve work order | — | — | — | — | ✅ | — |
| Release OOO / OOS | — | ✅ | ✅ | — | — | — |
| Bulk status change | — | — | ✅ | — | — | — |
| View audit timeline & reports | own only | ✅ | ✅ | room status only | own WOs | ✅ |
| Configure property / checklists / rules | — | — | ✅ checklists | — | — | ✅ |
| Guest / reservation PII | — | — | ✅ | ✅ | — | ✅ |

> Attendants never see guest financial data (Cloudbeds SOP: limited-permission accounts).

---

## 7. Data Retention & Privacy
- `audit_event`, `checklist_item_result`, `inspection*`: retain ≥ 24 months (performance disputes, audits).
- Photos: 12 months default; incident/damage photos retained until incident closed + 12 months.
- Guest names in overlays/incidents: purge or anonymize 14 days after check-out unless tied to an open incident (aligned with Cloudbeds PCI note).
- Staff PINs hashed; lockout after 5 failures.
