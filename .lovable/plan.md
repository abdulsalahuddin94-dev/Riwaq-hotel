# Initialize the TrianglZ Hotel HMS

## Scope
Build the first clickable application shell from the supplied PRD and design system, without adding production authentication or backend persistence.

## Implementation
- Replace the placeholder home screen with a redirect into the demo at `/app/board`.
- Add a shared demo controller that remembers Desktop/Mobile view and persona, supports `Ctrl/⌘ + M`, and renders the specified floating switch button.
- Build the Desktop shell with the 260px navy sidebar, compact top bar, collapsible navigation, Manager demo identity, live-status indicators, and all primary web destinations:
  - Live Board, Team Progress, Assignments, Reports, Front Desk, Work Orders, Escalations, Settings.
- Build the Mobile shell as a distinct interface with Attendant navigation:
  - My Rooms, Alerts, Me.
  - On desktop-sized browsers it appears in the specified iPhone 14 frame; below 768px it becomes a full-screen mobile experience.
- Seed deterministic UI data for 100 rooms, KPI totals, status distribution, staff activity, priority overlays, and assigned mobile rooms so the initial screens are populated.
- Implement reusable status chips, room tiles/cards, skeletons, empty/error fallbacks, retry actions, and 3-second success toasts for the primary board/list surfaces.
- Add route files for every navigation destination in the same change, each with unique metadata; initialization-only destinations use consistent populated summaries rather than dead links.

## Visual system
- Port the exact gold, navy, neutral, READY, inspection, cleaning, dirty, DND, and blocked primitive/semantic tokens from the supplied design system.
- Use Inter for operational Latin text and IBM Plex Sans Arabic for Arabic; reserve Cormorant Garamond for the brand mark only.
- Apply separate `data-platform="desktop"` and `data-platform="mobile"` scales for typography, controls, spacing, radii, and navigation.
- Use the supplied TrianglZ logo in the desktop sidebar and derive the favicon from it.
- Keep room state communication icon + label + color, never color alone, with reduced-motion support and accessible focus states.

## Verification
- Confirm every primary route loads and navigation updates correctly.
- Verify Desktop at 1280px, framed Mobile at desktop width, and true full-screen Mobile below 768px.
- Test view switching by button and keyboard, sidebar collapse/restore, mobile bottom navigation, RTL-safe layout, five-state controls, and no horizontal overflow.
