# Research

Everything the team learned before and during the build. Read this folder to understand **why** the product works the way it does.

## Precedence
1. `../specs/riwaq-product-spec.md` (Riwaq, primary). It wins over everything here.
2. `../specs/hms-supplementary-spec.md` (supplementary; its hard numbers are proposals).
3. The files in this folder. They come from the **earlier TrianglZ HMS phase** (2026-09-23), before the project became Riwaq. The housekeeping domain research still holds; the TrianglZ branding, gold/navy palette and 100-room "TrianglZ Hotel" framing do **not**.

## Files
| File | What it is | Still valid? |
|---|---|---|
| `housekeeping-research.md` | Synthesis of OPERA + Cloudbeds SOPs + raw spec: client pains Q1–Q3, multi-dimensional room status, the "Inspected" gate, competitor table, personas, gaps G1–G10, open questions | Yes for domain findings. Branding sections superseded by Riwaq. |
| `user-flows-v1.md` | Persona journeys and cross-persona scenarios (TrianglZ era) | Mostly. Riwaq spec §9–§10 win where they differ. |
| `data-schema-v1.md` | Entities, derived READY rule, early route map (TrianglZ era) | The READY rule and entity ideas hold. Routes are superseded by `../sitemap.md`. |
| `hotel-links-directory.md` | Long directory of heritage hotel and market links | Yes. The curated short list is `../specs/hotel-reference-links.md`. |
| `raw/hotel-housekeeping-system-spec.md` | Raw input: 13 epics, KPIs, 7-step SOP | Raw source, not a decision. Its bracketed citations point to sources we do not have. |
| `raw/hotel-housekeeping-userflows.md` | Raw input: 5 personas, scenarios | Raw source. |
| `raw/HMS_Master_Context_AR.md` | Raw input, Arabic master context | Raw source. |

Not in the repo (third-party PDFs, kept in the owner's local "Hotels System/INPUT_RESEARCH_RAW" folder): *Housekeeping Management in OPERA System* (21 slides) and *Cloudbeds Housekeeping SOP* (25 pages). Their findings are summarised in `housekeeping-research.md` §2–§3.

## Key findings in one screen
- **Room status is several dimensions, never one field:** occupancy, reservation context, housekeeping condition, service overlays (DND/MUP), availability blocks (OOO/OOS). Collapsing them is the top cause of "front desk sent a guest to a dirty room".
- **"Ready" is derived, never set by hand:** vacant ∧ inspected ∧ not OOO/OOS ∧ no blocking work order. In Riwaq it is "Ready (internal)" until a PMS confirms it.
- **Accountability is an audit-trail problem:** every tick and status change carries who, when and which room; anomalies (too fast, bulk tick, no start) are detected automatically.
- **Checklists are scenario-specific:** departure, stayover, re-clean, post-repair (turnover, deep clean, turndown later).
- **Queue rooms** (guest waiting) are the top priority input after departures.
- **Heritage hotels add a dimension the PMS world ignores:** sensitive surfaces (juss plaster, carved wood, palm-frond ceilings, antique textiles) that must be reported, not treated, until a specialist approves a procedure.

## Adding research
Put new raw inputs in `raw/`, write the synthesis into a new or existing file here, and add a line to `../../CHANGELOG.md` and, if it changes a decision, to `../decision-log.md`.
