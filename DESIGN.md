---
colors:
  plaster: "#f6f1e8"              # page background (juss)
  surface: "#ffffff"
  ink: "oklch(0.26 0.025 46)"     # neutral-900
  shell: "oklch(0.19 0.02 44)"    # neutral-950, sidebar
  muted: "oklch(0.52 0.034 56)"   # neutral-500, AA on plaster
  brass: "oklch(0.7 0.086 72)"    # brass-500, primary
  brass-strong: "oklch(0.52 0.074 66)"
  ready: "oklch(0.56 0.09 150)"   # palm green
  inspect: "oklch(0.56 0.078 238)"
  cleaning: "oklch(0.78 0.127 58)"
  dirty: "oklch(0.55 0.16 35)"    # terracotta
  dnd: "oklch(0.49 0.21 304)"
  blocked: "oklch(0.43 0.015 50)" # basalt
typography:
  sans: '-apple-system, "SF Pro Text", Inter, "Riwaq Arabic" (Thmanyah, local only), "IBM Plex Sans Arabic", system-ui'
  brand: '"Cormorant Garamond", Georgia, serif'
  brand-ar: '"Riwaq Arabic Display" (Thmanyah Serif Display, local only)'
  h1: 26px / 1.25
  body: 15px
  label: 13px
  caption: 12px
rounded: { sm: 10px, md: 12px, lg: 16px, xl: 20px, 2xl: 24px }
spacing: 4px base; panels pad 20–26px; desktop gutter 28px; mobile gutter 16px
components: [readiness-ribbon, room-tile, status-chip, heritage-notice, m-meter, user-menu, fd-tile]
---

# Riwaq — Design

## Overview
Operate mode. A calm, warm console that lets the work lead. One signature move: the riwaq arch, used as the brand mark and as the heritage marker. Everything else is restraint.

## Colors
Committed shell: deep basalt-brown sidebar (`shell`) with sand type and a brass active marker; content sits on warm plaster with white surfaces. Brass is the single accent (primary buttons, focus, selection). Status colours are functional only and always paired with an icon and a label.

## Typography
System sans for UI, tabular numbers wherever a count or time appears. Cormorant Garamond only for the wordmark. Thmanyah for Arabic, loaded from the user's machine via `local()`.

## Layout
Desktop: sidebar, sticky top bar (title first, date beneath), content. The board opens with the readiness ribbon, then rooms grouped by wing. Mobile: header, scroll area, bottom nav or a 64px footer action.

## Elevation & Depth
Two soft lifts (`--lift-1`, `--lift-2`) plus a 0.5px hairline. No heavy borders, no glass on the shell.

## Shapes
Rounded but not bubbly: 10–24px radii by size. Tiles 12px, panels 24px, pills fully round.

## Components
- **Readiness ribbon:** one proportional bar plus legend buttons that filter the board. Replaces hero-metric cards.
- **Room tile:** number, status icon, accent rail; hatch/dots for out-of-order/out-of-service.
- **Heritage notice:** brass-tinted panel with the arch icon; text only, never a care recipe.
- **Checklist meter:** count plus a linear bar (no progress rings).
- **Account menu:** account switch and "Restore sample data" for presenters.

## Do's and Don'ts
- Do pair every status colour with an icon and words.
- Do keep targets at least 44px (mobile primary 64px) with a visible focus ring.
- Do theme selection, caret and scrollbars.
- Don't add eyebrow/kicker labels above headings, hero-metric card rows, progress rings, gradient text or emoji icons.
- Don't add "Demo" labels, or claim a PMS or server is connected.
- Don't use real hotel logos or photos.
