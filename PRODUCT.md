<!-- impeccable:product-schema 1 -->
# Riwaq (رِواق) — Product

## Platform
Web app (TanStack Start, React 19, Tailwind v4, shadcn/ui). Two surfaces: a desktop operations console (`/app/*`) and a phone app for floor staff (`/m/*`). Browser-only prototype: all state lives in localStorage, there is no backend.

## Users
- **Operations / housekeeping manager:** watches room readiness across wings, assigns work, clears escalations.
- **Front desk:** needs to know which rooms are truly ready for arriving guests.
- **Supervisor:** inspects cleaned rooms and passes or fails them.
- **Housekeeper / attendant:** works a room checklist on a phone, often with gloves and in a hurry.
- **Engineering:** receives work orders and blocks.

## Product Purpose
Make room readiness in a heritage hotel visible and trustworthy, so a guest is never sent to a room that isn't ready and a heritage surface is never "cleaned" the wrong way.

## Positioning
An operations tool for authentic Gulf heritage properties (reference hotels: Bab Samhan, Chedi Al Bait, Souq Waqif, Alila Jabal Akhdar, Dar Tantora). Fictional property: Dar Al Majlis «دار المجلس».

## Operating Context
Busy shift work. Managers on a large screen at a desk; housekeepers on phones in corridors and bathrooms. Glances, not reading sessions.

## Capabilities and Constraints
- No server, no real PMS. PMS confirmation and sync are simulated and must never be presented as real ("Ready (internal)", "PMS sync not connected").
- Arabic brand font is Thmanyah through `local()` only; font files are never committed (licence).
- English UI today; Arabic RTL is a planned next step.

## Brand Commitments
Quiet, warm, crafted. Juss plaster, brass, palm green, terracotta, basalt. The arcade arch (riwaq) is the only ornament.

**Who is on screen:** staff see their hotel first. The front brand is the property, «دار المجلس · Dar Al Majlis»; Riwaq appears only as a quiet "Powered by Riwaq Systems" credit (sidebar, sign-in footer, exports, tab titles end with the hotel name). Riwaq is the vendor; the hotel is the host.

## Evidence on Hand
docs/specs/riwaq-product-spec.md (primary), docs/specs/hms-supplementary-spec.md, docs/specs/hotel-reference-links.md, docs/decision-log.md.

## Product Principles
1. Readiness is earned, never assumed: status changes show who and when.
2. Heritage first: never invent conservation instructions; report, don't treat, until a specialist approves.
3. Looks like a real product: no demo pills or demo wording in the UI; presenter controls live in the account menu.
4. One glance answers "what needs me now?".

## Accessibility & Inclusion
WCAG 2.2 AA. Status is never shown by colour alone (icon + label). Touch targets at least 44px, primary mobile actions 64px. Skip link on desktop. Small text contrast at least 4.5:1.
