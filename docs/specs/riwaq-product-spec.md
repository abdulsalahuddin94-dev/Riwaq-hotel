# Riwaq — Heritage Hospitality Operations Platform
## Detailed Product Context and AI Implementation Specification

**Document version:** 1.0  
**Date:** 10 November 2026  
**Product name:** Riwaq — رِواق  
**Status:** Working specification; not a legal, conservation, or vendor integration certification.

## 1. How an AI Agent Must Use This Document

This is the source of product intent for design and implementation. Treat explicit safety, authorization, preservation, and data-integrity rules as mandatory. Treat proposed thresholds and technology choices as configurable or unresolved, not established industry standards.

- Inspect the existing repository and its instructions before modifying code.
- Reuse existing architecture and dependencies where reasonable.
- Do not silently invent a PMS capability, conservation treatment, legal requirement, or operational approval.
- Identify unresolved decisions and document assumptions before implementation.
- Implement in small, testable vertical slices.
- Keep mock adapters clearly separated from production integrations.
- Never represent simulated integration events as confirmed external events.
- Validate permissions on the server for every protected operation.
- Describe what was implemented, what was tested, and what remains unverified.
- Do not build every future module in the MVP.

### Decision vocabulary

- **MUST / MUST NOT:** Required product constraint.
- **SHOULD:** Recommended default; departures require a documented reason.
- **PROPOSED:** Starting design subject to operational validation.
- **OPEN:** Must be decided before dependent production behavior is enabled.

## 2. Product Purpose

Riwaq is a mobile-first, offline-capable platform coordinating housekeeping, maintenance, guest requests, room readiness, and heritage asset care for luxury Gulf heritage hotels and palaces.

The initial target property has 100 or more rooms or suites. Interfaces must also remain usable for smaller heritage properties and future multi-property operation.

The product combines three goals:

1. Operational clarity: the correct worker receives the correct task and knows what happens next.
2. Preservation: staff use approved procedures for sensitive materials and escalate damage instead of improvising treatment.
3. Quiet luxury: service is discreet, timely, culturally appropriate, and respectful of privacy.

Riwaq is not a replacement for a PMS, emergency response procedures, a qualified conservator, or a full accounting platform.

## 3. Cultural and Brand Direction

- Product name: **Riwaq**; Arabic display name: **رِواق**.
- Descriptor: **Heritage Hospitality Operations Platform**.
- Tone: calm, clear, respectful, precise, and operationally useful.
- Inspiration: Gulf courtyards, shaded passages, local craftsmanship, and Najdi, Hijazi, Qatari, Emirati, and Omani heritage contexts.
- Avoid generic glass-tower imagery, decorative overload, and interfaces that sacrifice readability for luxury styling.
- Proposed palette: warm off-white, sand, deep brown, muted green, restrained brass accents.
- Do not use color alone to communicate status.
- Commercial naming and trademark clearance remain OPEN.

## 4. Scope Boundaries

### Included

- Task assignment and field execution.
- Housekeeping checklists and inspection.
- Maintenance reporting, work orders, and release review.
- Heritage asset profiles and approved care instructions.
- Guest requests and service-level tracking.
- Room-status coordination with PMS.
- Offline task data, queued changes, conflict handling, and audit history.
- Supervisory dashboard and basic operational reporting.

### Later-stage modules

- Full linen and consumables inventory.
- Lost-and-found custody workflows.
- Artwork and artifact inventories.
- Minibar consumption review and PMS posting.
- Advanced protocol and VIP coordination.
- Multi-property analytics and gamification.

### Excluded unless separately approved

- Booking engine, revenue management, payment processing, payroll, full procurement, and full accounting.
- Automated diagnosis or treatment of heritage materials.
- Employee audio surveillance, continuous recording, or background microphone capture.
- Unrestricted guest profiling or employee location tracking.

## 5. Personas and Device Strategy

Use three interface personas without collapsing underlying job permissions.

| Persona | Job profiles | Main device | Main objective |
|---|---|---|---|
| Field Worker | Room attendant, technician, butler/service staff | Mobile PWA, BYOD where permitted | Execute assigned work and record outcomes |
| Supervisor | Floor supervisor, housekeeping manager, authorized operations reviewer | Mobile inspection view and desktop management view | Assign, inspect, coordinate, and approve within authority |
| Front Office / Operations | Receptionist, operations manager, authorized leadership | Desktop web or PMS-linked view | Coordinate requests and monitor confirmed room readiness |

A heritage specialist can be a separate optional role or a specifically authorized supervisor profile. A tablet is optional, not a deployment requirement.

### Persona-specific concerns

**Field Worker:** minimal typing, 64 CSS px primary action targets as a project design target, glove usability testing, readable text, cached instructions, and clear local versus remote state.

**Supervisor:** actionable inspection queues, workload visibility, unresolved issue review, specific correction requests, and no accidental self-approval.

**Front Office:** reliable timestamps, stale-data warnings, request ownership, and a clear distinction between internal approval and PMS confirmation.

## 6. Permissions Model

Implement capabilities and property scope, not one unrestricted role per persona.

Suggested capabilities:

- task.read_assigned, task.start, task.pause, task.complete
- task.assign, task.reassign, task.view_team
- inspection.perform, inspection.approve, inspection.reject
- maintenance.report, maintenance.work, maintenance.verify
- room.block.request, room.block.apply, room.block.release
- heritage.read_sop, heritage.report, heritage.review, heritage.approve_sop
- request.create, request.accept, request.fulfill
- inventory.record, inventory.adjust, minibar.review, minibar.post
- guest.read_minimum, guest.read_sensitive
- report.view_team, report.view_property
- user.manage, role.manage, configuration.manage

### Mandatory rules

- A room attendant does not gain engineering permissions through the shared Field Worker UI.
- A butler does not automatically see complete guest profiles.
- A technician cannot independently release a room unless explicitly authorized by policy.
- Reception staff do not automatically receive user-administration privileges.
- Updating a heritage SOP requires specialist authorization and version control.
- Restrict every query and mutation to authorized properties and records.
- Where independent inspection is required, the person who performed cleaning cannot approve it.
- Audit privileged overrides with reason, actor, timestamp, and previous/new values.

## 7. Domain Model

The following is a proposed logical model, not a mandated database technology.

| Entity | Core fields and relationships |
|---|---|
| Property | id, name, country, timezone, supported locales, configuration |
| Floor / Zone | property_id, name, sequence, route grouping |
| Room | property_id, zone_id, room_number, room_type, linked PMS reference |
| RoomState | housekeeping_state, occupancy_state, availability_state, version, confirmed timestamps |
| User | identity, locale, status, scoped memberships; no plaintext credentials |
| Role / Capability | grants with property scope and optional certification requirements |
| Shift | user, start/end, assignment context |
| Task | room/area, type, priority, assignee, lifecycle state, due time, checklist version |
| TaskEvent | event_id, actor, transition, event time, server receipt time, device reference |
| PauseInterval | task, start/end, reason, correction history |
| ChecklistTemplate | version, job type, material applicability, approval metadata |
| ChecklistItemResult | task, item, result, note, evidence references |
| HeritageAsset | room/area, material, finish, sensitivity, approved procedure, condition |
| ConditionReport | asset/location, issue type, severity, evidence, review status |
| WorkOrder | issue linkage, trade, assigned technician, status, verification requirement |
| Inspection | task/room, template version, inspector, findings, decision |
| GuestRequest | request type, room reference, minimum guest context, assignment, SLA timestamps |
| Attachment | owner record, local/upload state, media type, access policy, retention metadata |
| IntegrationEvent | provider, correlation key, payload reference, state, retry history |
| AuditEvent | actor, action, entity, changes, reason, timestamps |
| SyncOperation | client operation ID, device, sequence, entity version, payload, status |

Store external identifiers separately from internal primary keys. Preserve the checklist and SOP versions used during execution even after a new version is published.

## 8. Room and Task State Machines

Housekeeping, occupancy, maintenance, and commercial availability are separate dimensions.

### Housekeeping

`DIRTY → CLEANING → AWAITING_INSPECTION → APPROVED`

Rejected inspection creates corrections and returns the appropriate workflow to an actionable state. A completed task alone does not authorize commercial availability.

### Task

`ASSIGNED → ACCEPTED → IN_PROGRESS ↔ PAUSED → COMPLETED → AWAITING_REVIEW → APPROVED`

Additional explicit outcomes: `CORRECTION_REQUIRED`, `CANCELLED`, `BLOCKED`. Define which task types require review; a delivered towel request need not follow room-cleaning inspection rules.

**Sync status is orthogonal to task status.** A task can be completed locally but not yet received by the server.

### Maintenance

`REPORTED → TRIAGED → ASSIGNED → IN_PROGRESS → REPAIR_COMPLETE → VERIFICATION_PENDING → CLOSED`

### Guest requests

`RECEIVED → ACCEPTED → IN_PROGRESS → DELIVERED → COMPLETED`

Allow `ESCALATED`, `CANCELLED`, and `UNFULFILLABLE` with reason and policy-defined handling.

### Availability

Internal availability intent and externally confirmed PMS availability MUST be represented separately. OOO and OOS definitions and release rules depend on the chosen PMS and property policy.

A room cannot be presented as PMS-confirmed ready if the relevant integration update has not been acknowledged or reconciled.

## 9. Mobile Field Worker Journey

### Screen 1: My Shift

Show:

- Worker name and current shift.
- Task count and progress.
- Priority-ordered task cards.
- Room/area, task type, due time, and accessibility-friendly priority label.
- Connection status, last confirmed sync time, and pending item count.

Primary action: **Open Task**. Do not expose sensitive guest identities on the list.

### Screen 2: Task Details

Show room reference, task type, priority reason, expected service window, authorized access status, heritage warnings, and required tools or products.

If occupancy or DND data is stale or uncertain, do not assume entry is permitted. Display the appropriate confirmation or supervisor path. A software action does not replace the hotel's physical room-entry protocol.

Primary action: **Start Task**. Secondary actions: **Report Issue**, **Contact Supervisor**, **View Instructions**.

### Screen 3: Active Task

- One clear current step with image/reference where available.
- Text instructions and optional replayable audio.
- Done, Not Applicable where allowed, and Report Issue.
- Progress indicator and active work time.
- Persistent Pause/Resume control.
- Locally saved state indicator.

Task completion must validate required items and mandatory evidence. A missing photo must not prevent reporting a safety concern.

### Screen 4: Report Issue

Issue categories: moisture, crack, damaged finish, missing item, equipment fault, safety concern, other.

Capture location, asset if known, brief description, proposed severity, photo if permitted, and local event time. Severity may require supervisor confirmation.

Display the actual outcome: saved locally, received by server, or failed to save. For urgent issues without connectivity, show the approved alternative communication route.

### Screen 5: Completion Review

Show completed/remaining items, unresolved findings, time intervals, and attachments. Use **Send for Inspection** for room cleaning and a task-type-specific completion action for other jobs.

If offline: **Saved on device — not yet submitted**.

After central confirmation: **Inspection requested**.

### Screen 6: Feedback

- Approval: concise success message and next task.
- Rejection: specific finding, location, expected correction, and required evidence.
- Conflict: preserved local record plus explanation and supervisor action.

## 10. Supervisor and Desktop Workspaces

### Supervisor mobile

- Inspection queue with oldest and urgent items visible.
- Floor/zone view with text status labels.
- Specific pass/fail findings.
- Heritage and maintenance escalation.
- Assignment and reassignment subject to scope.

### Operations desktop

- Property overview: dirty, cleaning, awaiting inspection, approved, maintenance-restricted.
- Separate indicators for PMS confirmation and stale data.
- Filters by zone, task type, priority, team, and time window.
- Request queue and overdue work.
- Audit drawer and integration health view for authorized users.

### Proposed inspection policy

A 15-minute queue-room inspection target and a 90% score were discussed as configurable starting ideas. They are not universal hotel standards. Critical failures must block approval regardless of numeric score.

## 11. Heritage Asset Care

Each sensitive asset profile SHOULD include material, surface finish, condition, permitted procedure, prohibited treatment, required competence, inspection frequency, evidence policy, and escalation contact.

Examples of materials are context labels, not cleaning recipes: earth/adobe, lime plaster, gypsum ornament, traditional woodwork, local limestone, coral stone, brass, woven textiles, and artifacts.

### Non-negotiable preservation rules

- Follow an approved procedure applicable to that exact asset and condition.
- Do not infer that all stone tolerates washing or all wood requires the same dry treatment.
- Do not prescribe acidic, abrasive, polishing, or restoration treatments without qualified approval.
- Natural or eco-friendly labeling does not establish conservation safety.
- Untrained staff report fragile artwork or antique issues rather than attempting treatment.
- Stop work in the affected area when suspected damage requires review.
- A report does not automatically imply whole-room OOO; apply triage and policy.
- A material warning is not proof that the application detected the cleaning product in use.

### SOP governance

`DRAFT → SPECIALIST_REVIEW → APPROVED → PUBLISHED → RETIRED`

Record author, specialist reviewer, effective date, applicable assets, translations, and change history. Critical safety revisions need an explicit mechanism for alerting assigned staff and invalidating unsafe cached instructions.

## 12. Quiet Luxury and Guest Privacy

- Guest-facing execution should be discreet and avoid loud notifications.
- Use only task-relevant preferences, with an appropriate permission and privacy basis.
- Incense, bakhoor, fragrance, and open-flame-related service are not default cleaning steps; apply allergy, fire-safety, consent, and property rules.
- Do not photograph guests, passports, screens, or unrelated personal belongings.
- Use role-specific guest aliases or room references where possible.
- Do not announce guest identities, VIP status, or room numbers aloud by default in public areas.

## 13. Task Prioritization

Apply eligibility and safety constraints before ranking.

1. Is work safe and entry authorized?
2. Does the worker hold the necessary skill and permission?
3. Is there a safety/security issue requiring immediate escalation?
4. Which requests or room arrivals have the nearest valid service deadlines?
5. Apply configured VIP/protocol and queue-room priorities within those constraints.
6. Group geographically when this does not breach higher-priority commitments.
7. Balance workload and avoid assigning specialist work to an unqualified worker.

A final weighted score and weights are OPEN. Do not hard-code a universal ranking in which every guest request always overrides every imminent arrival, or VIP overrides safety.

## 14. Offline-First and Synchronization

### Offline capabilities

Allow only previously cached, authorized tasks and instructions to be accessed offline. New remote tasks cannot arrive without connectivity.

Persist permitted writes locally before presenting them as locally saved. Include task events, checklist results, notes, attachments, and pause intervals.

### Outbox record

Suggested fields: operation_id, entity_id, operation_type, actor_id, device_id, base_version, event_time, payload, dependencies, retry_count, next_retry_at, last_error, created_at.

The server must provide idempotency and authorization checks. Local identifiers alone do not prevent duplication unless the receiving service enforces them.

### Display states

| State | Meaning |
|---|---|
| Not saved | Durable local persistence has not succeeded |
| Saved locally | Stored on this device only |
| Queued | Awaiting transmission |
| Sending | Transmission in progress |
| Received | Server acknowledged receipt |
| External update pending | Required PMS action is unconfirmed |
| Synced | Required destinations confirmed for this operation |
| Needs review | Conflict or policy decision required |
| Failed | Needs corrective action or authorized assistance |

### Retry policy

Use configurable exponential backoff with jitter for temporary failures. Proposed intervals: 1, 5, 15 minutes, then up to hourly with a bounded retry/escalation policy. Respect provider rate limits.

Do not endlessly retry invalid requests or expired authorization. Process independent operations separately while respecting dependencies.

PWA background execution is not guaranteed across browsers. Retry on app reopen, focus recovery, and connectivity restoration. Test supported browsers explicitly.

### Conflict policy

- Room availability and maintenance restrictions: preserve restrictions until authorized reconciliation.
- Checklist execution: preserve both original events and resulting review.
- Notes: retain attributable entries rather than silently overwriting.
- Minibar: determine whether entries represent distinct events; do not blindly add or replace them.
- SOP versions: preserve what was used and flag critical outdated instructions.
- Permissions: the server's current authorization controls acceptance.

## 15. Error and Interruption Scenarios

### A. Network loss during cleaning

Worker continues cached permitted work. A persistent banner shows the last confirmed update and pending items. Locally recorded work time uses event timestamps. Reconnection triggers upload and reconciliation, not a false immediate success message.

### B. Heritage damage while offline

Save report if storage permits. Show: **Report saved locally. Supervisor has not been notified. Use the approved phone/radio channel for urgent issues.** Do not claim a remote room lock was applied.

### C. Attachment upload failure

Track parent report and attachment separately. Example: **Report received; photo pending.** Retry independently. If evidence is mandatory for closure, preserve the report but withhold final closure until the approved evidence/exception path is satisfied.

### D. Concurrent room change

Worker completed cleaning while engineering restricted the room. Preserve work and the restriction. Show both meaningful states and route for review; never turn an OOO room ready through a stale checklist update.

### E. Expired session

Stop rejected transmissions. Preserve permitted drafts securely. Require reauthentication and resume under the correct user identity. Do not expose sensitive cached information after session expiry contrary to policy.

### F. App termination or battery loss

Restore persisted state. Reconstruct time from start/pause/resume events. If elapsed time is ambiguous, request an attributable correction rather than counting the entire outage as productive work.

### G. Full storage or denied camera

Never say saved if storage failed. Explain the issue, provide assistance, and allow non-photo emergency reporting. Do not advise clearing site data while unsent work may exist.

### H. PMS outage

Show last confirmed PMS values with timestamp. Preserve internal task progress. Queue valid integration operations and expose pending status. Apply the property's fallback procedure for commercial room assignment.

### I. Duplicate submission

Double tap, timeout, or retry must not create duplicate work orders, stock movements, minibar charges, or inspection requests. Use operation-level idempotency and button feedback, not button disabling alone.

## 16. Voice Guidance Specification

Voice is optional assistance, not the only delivery channel. Provide visible equivalent text, replay, mute, language preference, and quiet operation defaults.

Target languages: Arabic, English, Tagalog, Hindi, Spanish, subject to property needs and verified translations.

| Event | Example English prompt |
|---|---|
| Shift start | You have nine tasks today. |
| Task assigned | A new task is available. Review the details. |
| Heritage warning | Sensitive material. Follow the approved instructions. |
| Start recorded | Task time is now being recorded on this device. |
| Pause | Work paused. |
| Resume | Work resumed. |
| Damage | Stop work in the affected area and report the issue. |
| Connectivity loss | Connection lost. Check the save status on screen. |
| Local persistence confirmed | Saved on this device. Not yet sent. |
| Persistence failure | This change was not saved. Keep the app open and request help. |
| Server receipt | The system has received your report. |
| Upload failure | Upload unsuccessful. The saved report will be retried. |
| Conflict | This task changed. Review it with your supervisor. |
| Correction | An inspection correction is required. Open the details. |
| Approval | The room inspection has been approved. |

Do not automatically equate inspection approval with external PMS readiness. Use prerecorded cached prompts or verified local playback where necessary; browser/cloud text-to-speech availability must be tested, not assumed.

## 17. PMS Integration Contract

Potential providers include Oracle OPERA/OHIP and Cloudbeds. Selection and exact supported capabilities are OPEN.

Use provider-supported APIs, webhooks, polling, or event mechanisms. WebSockets may be used between Riwaq backend and UI; do not assume the PMS supports the same transport.

### Adapter responsibilities

- Map provider identifiers and status definitions.
- Validate external responses and credentials.
- Deduplicate and order events where required.
- Track intended, sent, acknowledged, failed, and reconciled changes.
- Handle rate limits, timeouts, duplicate callbacks, and out-of-order events.
- Reconcile after gaps or outages.
- Record correlation IDs and integration health without logging secrets.

### Proposed internal API surface

Illustrative routes, not a fixed framework:

- GET /tasks?assignedTo=me
- GET /tasks/{id}
- POST /tasks/{id}/events
- POST /tasks/{id}/checklist-results
- POST /issues
- POST /attachments/initiate
- POST /inspections
- POST /inspections/{id}/decision
- POST /guest-requests
- POST /sync/batch
- GET /sync/changes?cursor=...
- GET /rooms/{id}/state

Mutations should include operation ID and entity version where applicable. Return explicit validation, permission, conflict, and retryability information.

## 18. Inventory, Lost-and-Found, and Minibar

These are expanded scope unless specifically prioritized for MVP.

### Inventory

Track item, location, quantity, unit, movement, reorder policy, and custody where relevant. The previously suggested 1.5 par is a configurable idea, not a universal standard; define the denominator before use.

### Lost-and-found

Capture safe evidence, discovery location/time, finder, secure storage reference, handovers, claimant verification, and authorized release/disposal. Suggested 30/60/90-day retention periods require local legal and policy validation.

### Minibar

Separate discovery of consumption, operational review, and financial posting. Preserve event identity and approvals. Prevent duplicate posting during retries and concurrent work.

## 19. KPIs and Measurement Definitions

| Metric | Definition |
|---|---|
| Active work time | Sum of valid active intervals excluding documented pauses |
| End-to-end readiness time | Defined start of turnover to final required readiness approval |
| Inspection waiting time | Server receipt of inspection request to inspection start/decision, reported separately |
| First-pass approval | Rooms approved without correction on initial inspection |
| SLA compliance | Completion within configured deadline for that request class |
| Sync delay | Server receipt time minus recorded local event time, with clock-quality caveat |
| Heritage procedure compliance | Evaluated execution against applicable approved SOP |
| Repeat damage | Repeated findings linked to the same asset/cause |
| Pending queue size | Unsynchronized operations per device/property |
| Integration health | Failures, lag, unresolved updates, and reconciliation outcomes |

Targets such as 90% inspection score, 100% compliance, or 15-minute review are proposed and configurable. Numeric scores must never override critical findings. More damage reports can indicate improved detection rather than worse staff performance.

## 20. Nonfunctional Requirements

- Responsive mobile and desktop layouts; tablet optional.
- Arabic RTL and English/LTR, including mixed identifiers and room numbers.
- Accessible names, focus order, screen-reader support, contrast, and non-color status cues.
- Primary mobile actions target 64 CSS px; validate on real devices and with gloves.
- Minimize typing and accidental destructive actions.
- Local storage and attachment limits with truthful failure feedback.
- Property timezone-aware operational displays and unambiguous stored timestamps.
- Observability for sync failures, integration latency, and critical review backlog.
- Defined retention, deletion, backups, and restoration testing.
- No hard-coded sub-200ms end-to-end integration guarantee. Define measurable service objectives after architecture and PMS selection.

## 21. Security and BYOD

- Secure transport and server-side access enforcement.
- Keep credentials and PMS secrets on trusted server infrastructure.
- Minimize cached guest information and protect storage according to the selected platform's capabilities and risk model.
- Define session expiry, offline authorization limits, lost-device response, and remote access revocation.
- Do not promise immediate remote deletion from a disconnected BYOD device.
- Apply media access controls, upload validation, and retention policies.
- Redact logs; avoid recording personal guest data in telemetry.
- Audit role changes, approvals, overrides, status releases, and financial postings.
- Country-specific data residency and privacy requirements remain OPEN.

## 22. MVP Delivery Plan

### Phase 0: Decisions and foundations

Choose target country, property policy, supported devices, stack, PMS, identity model, and approved heritage SOP ownership. Produce architecture and state diagrams. Identify risky integration assumptions.

### Phase 1: A complete vertical slice

Worker receives a room-cleaning task, reads approved instructions, starts/pauses work, completes checklist, reports an issue, and requests inspection. Supervisor reviews and approves/rejects. Operations sees confirmed status. Include offline persistence, retries, authorization, and audit records from the start.

### Phase 2: Operational expansion

Guest requests, engineering tickets, review/release controls, queue-room SLAs, basic reports, and production PMS adapter.

### Phase 3: Advanced modules

Inventory, lost-and-found, minibar review/posting, artifact custody, specialist workflows, multilingual audio, and optional gamification.

Do not label a mock PMS adapter as a production-complete integration.

## 23. Acceptance Tests

1. A worker sees only authorized assignments and minimum required room information.
2. A task records work and checklist changes offline after successful local persistence.
3. Reopening the app restores persisted task state and pending operations.
4. A local save failure produces an explicit not-saved state.
5. Repeated delivery of the same operation produces one business effect.
6. A failed image does not erase the report or block unrelated work.
7. A maintenance restriction survives a stale cleaning-completion update.
8. A room cannot be shown PMS-confirmed ready before external confirmation/reconciliation.
9. A worker without engineering permissions cannot approve a repair or release a room.
10. Independent-inspection policy blocks self-approval.
11. An expired session does not cause infinite authentication retries or inappropriate cached-data exposure.
12. A critical offline report instructs the user to use an alternative communication channel.
13. A new guest request is not falsely shown as received on a disconnected device.
14. Concurrent minibar entries are reviewed for duplicates before financial posting.
15. RTL, mixed-language room numbers, keyboard focus, and screen-reader labels work.
16. Muting voice does not hide required information.
17. Pauses are excluded from active time but retained in the audit trail.
18. A critical inspection failure blocks approval even if the numeric score passes.
19. Integration timeouts and out-of-order events reconcile without corrupting room state.
20. Clearing or replacing a device is not recommended without addressing unsent work.

## 24. Definition of Done

A feature is done when its intended UI works, server permissions are enforced, offline behavior is explicit, errors and conflicts are covered, audit records exist, applicable tests pass, and operational assumptions are documented.

For each completed implementation slice, provide:

- Files and behavior changed.
- Tests executed and results.
- Remaining risks and unsupported environments.
- Integration status: mocked, sandbox-tested, or production-verified.
- Any migration, configuration, or operational steps required.

## 25. Open Decisions Register

| Decision | Why it matters |
|---|---|
| Launch country and property | Legal, cultural, privacy, and operational policies |
| PMS provider and version | Supported events, status semantics, credentials, limits |
| Inspection and release authority | Prevents unsafe or unauthorized availability changes |
| Heritage SOP owner | Qualified approval of actual care procedures |
| BYOD policy and browsers | Offline limits, security, support, recovery |
| Tech stack and hosting | Must fit team/repository and deployment constraints |
| Data retention/residency | Guest data, employee data, images, lost-and-found |
| SLA configuration | Arrival windows, guest requests, queue-room review |
| Brand clearance | Riwaq name, domains, trademarks |
| Multi-property rollout | Tenant isolation, permissions, reporting |
| Audio strategy | Translation, quiet modes, offline availability |
| Accessibility target | Required standard and verification process |

## 26. Research Context — Nonbinding

The original discussion referenced Saudi Vision 2030, We the UAE 2031, and Abu Dhabi tourism strategy as strategic context. It cited Boutique Group, Diriyah, Bab Samhan, Capella Diriyah, The Chedi Al Bait, Souq Waqif Boutique Hotels, and Alila Jabal Akhdar as inspiration, not implementation requirements or verified operating manuals.

Previously discussed market estimates included a USD 13.8 billion GCC heritage tourism market in 2025 and USD 26.4 billion by 2031, plus other hospitality revenue, room pipeline, and intergenerational wealth figures. These must be validated against original reports and methodology before investor or public use. Do not embed them in application business logic.

## 27. Reference Links

These references support further review; they do not certify all requirements in this document.

- Offline-first architecture: https://developer.android.com/topic/architecture/data-layer/offline-first
- Accessibility principles: https://developer.android.com/guide/topics/ui/accessibility/principles
- Apple accessibility guidance: https://developer.apple.com/design/human-interface-guidelines/accessibility
- Museum cleaning planning: https://home.nps.gov/subjects/museums/conserve-o-gram-2-21-safer-cleaning-alternatives-for-the-museum-visitor-center.htm
- Abrasive cleaning risks: https://home.nps.gov/orgs/1739/upload/preservation-brief-06-abrasive-cleaning.pdf
- Boutique Group background: https://www.pif.gov.sa/en/our-investments/our-portfolio/boutique-group/
- AI context organization: https://www.anthropic.com/research/effective-context-engineering-for-ai-agents

## 28. Recommended Companion Documents

Keep this file as the detailed product specification. Create a short repository-level AGENTS.md that links here rather than duplicating everything.

Suggested future files:

- AGENTS.md — coding rules, repository conventions, and links.
- docs/architecture.md — chosen stack and integration boundaries.
- docs/state-machines.md — transitions and enforcement rules.
- docs/permissions.md — role grants and property scope.
- docs/api-contract.md — finalized endpoints and payloads.
- docs/offline-sync.md — storage, queue, retries, and reconciliation.
- docs/heritage-sops.md — approved examples, not invented treatments.
- docs/acceptance-tests.md — executable test mapping.
- docs/decision-log.md — assumptions and resolved decisions.

## 29. First Instruction to the Coding Agent

Read this specification and inspect the repository. Summarize the product boundaries, existing technical constraints, and unresolved implementation decisions. Propose the smallest end-to-end slice covering task execution, offline persistence, supervisor inspection, and confirmed room status. Before introducing a new stack or production PMS dependency, request approval. Never invent conservation instructions or represent mock external confirmation as real.
