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
  sans: '-apple-system, "SF Pro Text", Inter, "Riwaq Arabic" (Thmanyah, local only), Almarai, system-ui'
  brand: '"Cormorant Garamond", Georgia, serif'
  brand-ar: '"Riwaq Arabic Display" (Thmanyah Serif Display, local only), "Markazi Text"'
  h1: 26px / 1.25
  body: 15px
  label: 13px
  caption: 12px
rounded: { sm: 10px, md: 12px, lg: 16px, xl: 20px, 2xl: 24px }
spacing: 4px base; panels pad 20–26px; desktop gutter 28px; mobile gutter 16px
components: [now-strip, readiness-ribbon, arrivals-timeline, room-tile, status-chip, heritage-notice, m-meter, user-menu, fd-tile]
---

# Riwaq — Design

## Overview
Operate mode. A calm, warm console that lets the work lead. One signature move: the riwaq arch, used as the brand mark and as the heritage marker. Everything else is restraint.

## Colors
Committed shell: deep basalt-brown sidebar (`shell`) with sand type and a brass active marker; content sits on warm plaster with white surfaces. Brass is the single accent (primary buttons, focus, selection). Status colours are functional only and always paired with an icon and a label.

## Typography
System sans for UI, tabular numbers wherever a count or time appears. Cormorant Garamond only for the hotel name and the RIWAQ credit. The hotel («دار المجلس · Dar Al Majlis») is the front brand; Riwaq is "Powered by Riwaq Systems". Thmanyah for Arabic, loaded from the user's machine via `local()`.

## Layout
Desktop: sidebar, sticky top bar (title first, date beneath), content. The board opens with the readiness ribbon, then rooms grouped by wing. Mobile: header, scroll area, bottom nav or a 64px footer action.

## Elevation & Depth
Two soft lifts (`--lift-1`, `--lift-2`) plus a 0.5px hairline. No heavy borders, no glass on the shell.

## Shapes
Rounded but not bubbly: 10–24px radii by size. Tiles 12px, panels 24px, pills fully round.

## Components
- **Needs-you-now strip:** first thing on the Live Board. Up to four items (escalations, guests waiting, arrivals at risk), each with the one action that resolves it. An "All clear" line when empty.
- **Readiness ribbon:** one proportional bar plus legend buttons that filter the board. Replaces hero-metric cards.
- **Room tile:** white, with a status rail and a coloured status icon. A tinted fill is reserved for rooms that need someone (queue guest or accountability signal). Hatch/dots for out-of-order/out-of-service.
- **Room drawer header:** wing-specific photography fades into the page background. Wing name, room number and status stay readable; room type, task and existing VIP/Queue/Alert/Re-clean flags use compact icon-and-text tags. Images identify wings, not room types.
- **Arrivals timeline (Front Desk):** one row per arrival; a bar from now to the estimated ready time and a pin at the arrival time. Risk is written in words (Ready, On track, Tight, At risk). Estimates come from standard clean times and are labelled internal.
- **Heritage notice:** brass-tinted panel with the arch icon; text only, never a care recipe.
- **Checklist meter:** count plus a linear bar.
- **Photos (`src/assets/photos/`):** generated courtyard (dawn/dusk), majlis at night and one photo per room type, via `photos` and `RoomPhoto`.
- **Illustrations (`illustrations.tsx`):** hand-drawn SVG courtyard scene (fallback), room interiors with bed state (progress card), illustrated staff portraits, job pictures for sign-in, empty-state art and tinted pictograms. Always next to words.
- **Welcome hero (Live Board):** daylight luxury heritage lounge photograph, greeting by name and one readiness gauge (rooms ready of sellable). The only ring in the product. Dark left-side overlay preserves text contrast.
- **Sign-in:** desktop is a split screen (scene left, night form right); mobile is picture-first: pick your job, tap your face, enter PIN.
- **Account menu:** account switch and "Restore sample data" for presenters.
- **Mobile room cards:** full-card photography with compact overlay data, labelled status and checklist progress. Shift completion uses refined hotel photography rather than illustrated bed art.
- **Mobile detail:** fixed phone-local photograph behind scrolling content; always-visible 48px back control; room title remains start-aligned in the collapsed top bar.
- **Mobile navigation and PIN:** light floating dock with all tab labels visible; four masked PIN slots and 64px keys, preserving job → photo → PIN sign-in.
- **Language selection:** equal 44px targets, centered labels and a raised selected segment; fixed geometry in English and Arabic, without inheriting settings-row button heights.
- **Mobile scrolling:** compact title header after scrolling; navigation slides out during movement and returns on idle. Room cards retain full-image presentation at a reduced 224px minimum height.
- **Unified staff roles:** inspection and maintenance use housekeeping-style full-photo task cards and shift summaries; wing tiles use photo surfaces with labelled status. Detail screens share photo headers, quiet data rows, 16px item radii and 44px inspection controls. Login, filters, sheets, profiles and alerts use the same type and surface hierarchy.

## Do's and Don'ts
- Do pair every status colour with an icon and words.
- Do keep targets at least 44px (mobile primary 64px) with a visible focus ring.
- Do theme selection, caret and scrollbars.
- Don't add eyebrow/kicker labels above headings, hero-metric card rows, progress rings, gradient text or emoji icons.
- Don't add "Demo" labels, or claim a PMS or server is connected.
- Don't use real hotel logos or photos.
