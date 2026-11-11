# SPEC_RESEARCH.md — Grounded Research & Analysis

> **Project**: TrianglZ Hotel — Housekeeping Management System (HMS)
> **Phase**: 1 of 5 (Raw Inputs ➔ Research)
> **Generated**: 2026-09-23 · Initial Setup Mode
> **Sources ingested**:
> - `INPUT_RESEARCH_RAW/hotel-housekeeping-system-spec.md` (v4.0 — 13 epics, KPIs, 7-step SOP)
> - `INPUT_RESEARCH_RAW/hotel-housekeeping-userflows.md` (v2.0 — 5 personas, cross-persona scenarios)
> - `INPUT_RESEARCH_RAW/Housekeeping Management in OPERA System.pdf` (21 slides — OPERA Rooms Management)
> - `INPUT_RESEARCH_RAW/cloudbeds Housekeeping_SOP.pdf` (25 pages — Cloudbeds SOP 2026)
> - `INPUT_DESIGN_INSPIRATIONS/trianglz_hotel_style_guide.md` + `Logo.png`
> - Client brief (verbal, 2026-09-23) — see §1

---

## 1. Client Problem Statement (the "why")

The client runs a hotel of **~100 rooms (± variable)** and cannot answer three questions today:

| # | Pain (client's words, translated) | What it really means | Success signal |
| :-- | :-- | :-- | :-- |
| **Q1** | "I don't know who did their work and who didn't." | No **attribution**: room work isn't tied to a named person + timestamp. | Every status change and checklist tick carries `who · when · which room`. |
| **Q2** | "I don't know which checklist items were done and which weren't." | No **item-level visibility** into SOP execution. | Manager can open any room and see each checklist item ✔/✘ with the actor and time. |
| **Q3** | "Is the room clean? Is it **Ready for check-in**?" | No **single trusted readiness signal** for Front Desk. | Front Desk sees one unambiguous `READY` badge, computed by rules — never set by hand. |

> **Design consequence**: Q1–Q3 are the MVP. Everything else in the raw spec (gamification, minibar billing, route optimization…) is valuable but **secondary** and is phased in `SPEC_PRODUCT_PRD.md §3`.

---

## 2. Key Industry Takeaways

### 2.1 Room status is multi-dimensional — never one field
Both OPERA and Cloudbeds separate status into independent dimensions. Collapsing them into one enum is the #1 cause of "Front Desk assigned a dirty room" incidents.

| Dimension | OPERA term | Cloudbeds term | Values |
| :-- | :-- | :-- | :-- |
| **Occupancy** | FO Status | Occupancy status | `Vacant`, `Occupied` |
| **Reservation context** | Reservation Status | Front desk status | `Arrival`, `Due Out`, `Departed`, `Stayover`, `Not Reserved` (+ Cloudbeds `Turnover` = back-to-back) |
| **Housekeeping condition** | Room Status | Room condition | `Dirty`, `Clean`, `Inspected` (+ OPERA optional `Pickup` = light refresh) |
| **Service overlays** | Guest Service Status | — | `DND` (Do Not Disturb), `MUP` (Make Up Room) |
| **Availability blocks** | OOO / OOS | Out of service | `Out of Order` (removed from inventory), `Out of Service` (stays in inventory, last-resort sell) |

### 2.2 "Inspected" is the quality gate that answers Q3
- Cloudbeds: *Inspected* must be **explicitly enabled** by the property owner; when on, housekeepers mark **Clean**, supervisors mark **Inspected**.
- OPERA: *Inspected* is "the last check by Housekeeping supervisors before making a room available."
- **Takeaway**: `Ready for check-in` = `Vacant` ∧ `Inspected` ∧ ¬`OOO` ∧ ¬`OOS` ∧ no blocking ticket. It is a **derived** state (see `SPEC_DATA_SCHEMA.md §3`).

### 2.3 Accountability is an audit-trail problem, not a UI problem
- Cloudbeds recommends **separate user accounts with limited permissions** per housekeeper — shared logins destroy attribution.
- OPERA tracks **Attendant Points** and **Task Assignment** per attendant.
- Cloudbeds weekly tip: if the system shows a room as Clean but no housekeeper was assigned, investigate → the system should **auto-detect** such anomalies.
- **Takeaway**: an immutable, append-only event log + per-person login is the foundation for Q1.

### 2.4 Checklists must be scenario-specific
Cloudbeds lists 5 checklist types: **Check-Out Clean**, **Stayover Clean**, **Turnover Clean**, **Deep Clean**, **Vacant Room Maintenance Check**. The raw spec adds **Turndown** (evening). A single universal checklist is an anti-pattern.

### 2.5 Queue Rooms drive daily priority
OPERA's *Queue Rooms* lets Front Desk flag a reservation whose guest is waiting; Housekeeping services those first. This is the most important priority input after check-outs.

### 2.6 Exceptions housekeepers must capture (from Cloudbeds SOP)
| Exception | Mandatory data | Downstream effect |
| :-- | :-- | :-- |
| **DND** | Time, door photo (optional) | Skip; re-attempt later; welfare check if DND > 24h |
| **Maintenance defect** | Category, urgency, ≥1 photo | Work order; OOO/OOS block |
| **Damage / missing items** | Photos from multiple angles **before** cleaning, description | Supervisor assessment → possible charge |
| **Lost & Found** | Do not move until logged; location, description, photo | Logbook entry; guest contact; retention 30–90 days |
| **Pest / bed bug** | Room, pest type, evidence | Immediate OOO; linen quarantine; adjacent-room inspection |

### 2.7 Operational benchmarks
> ⚠️ Benchmarks come from the raw spec, whose bracketed citations (e.g. `[113]`) point to sources **not included** in `INPUT_RESEARCH_RAW/`. Treat them as **targets to validate with the client**, not facts.

| KPI | Target (raw spec) | Also tracked by Cloudbeds? |
| :-- | :-- | :-- |
| Turnover time — departure | ≤ 25–30 min | ✅ "average cleaning time per room type" |
| Turnover time — stayover | ≤ 12–15 min | — |
| Rooms per attendant per 8h shift | 12–16 | ✅ "rooms per housekeeper per shift" |
| Inspection pass score | ≥ 90% | ✅ scored checklists recommended |
| Re-clean / failure rate | ≤ 5% | ✅ "inspection pass/fail rates" |
| Maintenance MTTR | P1 < 15–30 min · P2/P3 < 2h | — |

---

## 3. Competitor Benchmark Summary

| Capability | OPERA (Oracle) | Cloudbeds | Specialist apps (Breezeway, RoomChecking, Sweeply, CleanMeNext, Operto) | **TrianglZ HMS target** |
| :-- | :-- | :-- | :-- | :-- |
| Multi-dimension room status | ✅ | ✅ | ✅ (via PMS) | ✅ |
| Supervisor "Inspected" gate | ✅ optional | ✅ optional | ✅ | ✅ **on by default** |
| Per-attendant assignment | ✅ Task Assignment | ✅ | ✅ | ✅ |
| **Item-level checklist with actor + time** | ❌ | ❌ (downloadable PDFs) | ✅ | ✅ **core** |
| Scored digital inspection | ❌ | ❌ | ✅ (RoomChecking) | ✅ |
| Discrepancy detection (FO vs HK) | ✅ Rm. Discrepancies | Manual weekly review | Partial | ✅ automatic |
| Queue Rooms | ✅ | ❌ | Partial | ✅ |
| Mobile-first for attendants | ❌ (legacy desktop) | ✅ native app | ✅ | ✅ PWA, glove-friendly |
| Arabic / RTL | ❌ | Partial | Varies | ✅ **first-class** |
| Offline tolerance | ❌ | ❌ | Varies | ✅ queued sync |
| Bulk status change | ✅ | ✅ Bulk Action | ✅ | ✅ (Supervisor+ only) |
| Printable room report | ✅ | ✅ | ✅ | ✅ PDF export |

**Differentiators to protect**: (1) item-level proof of work, (2) rule-computed READY badge, (3) Arabic/RTL + glove-friendly mobile, (4) automatic anomaly detection.

---

## 4. Personas (validated against sources)

| ID | Persona | Device | Core job | Pain solved |
| :-- | :-- | :-- | :-- | :-- |
| **P1** | Room Attendant (Housekeeper) | Smartphone PWA | Clean assigned rooms via checklist; report exceptions | Paper sheets, language barrier, radio calls |
| **P2** | Floor Supervisor | Smartphone PWA | Inspect & release rooms; re-assign | Walk-around logs, late releases |
| **P3** | Housekeeping Manager | Desktop web | See every room live; assign; audit who did what | **Q1, Q2** blind spots |
| **P4** | Front Desk / Receptionist | Desktop web | Know which rooms are READY; queue waiting guests | **Q3** uncertainty |
| **P5** | Engineering Technician | Smartphone PWA | Fix defects; release OOO/OOS | Missed / slow repairs |
| **P6** | System Admin *(added — not in raw inputs)* | Desktop web | Configure rooms, floors, room types, checklists, users, rules | Needed to run a 100±-room property without developer help |

---

## 5. Gaps, Conflicts & Assumptions Found During Ingestion

| # | Finding | Resolution in specs |
| :-- | :-- | :-- |
| G1 | **No PMS stated.** Raw spec assumes OPERA/Cloudbeds webhooks; client brief doesn't mention a PMS. | HMS works **standalone** (Front Desk uses HMS panel) with a PMS adapter in Phase 2. ❓ Confirm with client. |
| G2 | Raw spec scope (13 epics, 25 screens) far exceeds the client's 3 pains. | Phased roadmap: MVP = Q1–Q3. |
| G3 | Arabic listed as a language but **RTL layout never specified**. | RTL is a first-class requirement in the Design System. |
| G4 | Style guide assigns **OOO to both Red and Dark Gray**. | Dirty = Red, OOO/OOS = Gray (blocked). |
| G5 | Style guide "Servicing" terracotta `#E76F51` is too close to Dirty red `#D62828` (confusable, esp. with color-vision deficiency). | Servicing uses the guide's alternate amber `#F4A261`; status is never conveyed by color alone (icon + label). |
| G6 | Brand gold `#C5A059` on white = **2.46:1** — fails WCAG AA for text. | Gold buttons use navy text (7.48:1); gold text on light uses `gold-700` (5.11:1). |
| G7 | Raw spec header says v4.0, body says v3.0; some `→` arrows are corrupted (`$\nightarrow`). | Cosmetic — read as `Dirty → Servicing → Clean → Inspected → Ready`. |
| G8 | Raw citations `[1]…[252]` reference sources not provided. | Benchmarks flagged "to validate". |
| G9 | No **Admin/config** persona in raw inputs. | Added P6. |
| G10 | Minibar auto-billing & damage charging touch **guest folios/payments** — needs PMS + finance sign-off. | Deferred to Phase 3; HMS only *logs*, never charges. |

### ❓ Open questions for client (🔴 = blocks build decisions)
1. 🔴 Do you use a PMS today (OPERA, Cloudbeds, other, none)? Should HMS integrate with it or be the source of room status?
2. 🔴 Is supervisor inspection mandatory for **every** room before READY, or only departures/VIPs? *(Assumed: every vacant room; configurable.)*
3. Exact room count, floors, room types, and whether rooms are split into AM/PM sections.
4. Staff languages actually used *(assumed: Arabic + English; optional Tagalog, Hindi, Spanish)*.
5. Shifts (AM / PM / Night) and typical staff count per shift.
6. Company phones or personal phones (BYOD)? Affects login (PIN vs NFC).
7. Existing checklists / SOP documents to digitize *(else the 7-step default is used)*.
