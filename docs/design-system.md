# Design system

The working reference for anyone (or any Claude) touching the UI. Three files, one system:

| File | Role |
|---|---|
| `src/styles.css` | **Source of truth.** Tokens (`:root`) and every component class. If this doc and the CSS disagree, the CSS wins; fix the doc. |
| `DESIGN.md` | Short summary in the impeccable format (read by the `/impeccable` skill). |
| `docs/design-direction.md` | The mood: Gulf courtyard, reference hotels, what not to copy. |

**When you change a token, a component's look, or add a component: update this file and `DESIGN.md` in the same commit, and add a `CHANGELOG.md` line.**

## 1. Principles
1. Operate mode: calm, warm, precise. The work leads; ornament is rare.
2. One signature: the riwaq arch (brand mark + heritage marker). Nothing else decorative.
3. Status = colour + icon + words, always.
4. Exceptions get colour; normal stays quiet.
5. Looks like a real product: no "Demo" pills, no fake "connected" claims.

## 2. Colour tokens
Two layers: primitives (OKLCH scales) → semantic tokens (shadcn names). Use semantic tokens in components.

| Primitive | Scale | Meaning |
|---|---|---|
| `--neutral-*` | 50–950 | Juss plaster → sand → deep brown. Page `#f6f1e8`, text `neutral-900`, sidebar `neutral-900/950`. |
| `--brass-*` | 50–950 | The only accent: primary buttons, focus ring (`brass-600`), active nav. |
| `--success-*` | 100/500/800 | Palm green → **Ready** |
| `--info-*` | 100/500/800 | Muted blue → **Awaiting inspection** |
| `--warning-*` | 100/500/800 | Ochre → **Cleaning** |
| `--error-*` | 100/500/800 | Terracotta → **Dirty**, destructive |
| `--dnd-*` | 100/500/800 | Plum → **DND** |
| `--blocked-*` | 100/500/800 | Basalt → **OOO** (hatch) / **OOS** (dots) |

Semantic: `--background`, `--foreground`, `--card`, `--primary` (+ `-hover`, `-press`, `-foreground`), `--secondary`, `--muted`, `--muted-foreground`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--sidebar*`.

Contrast: small text ≥ 4.5:1. Brass on white fails for text, so brass buttons use dark text (`--primary-foreground: neutral-950`).

## 3. Status mapping
Defined once in `statusMeta` (`src/lib/demo-data.ts`) and rendered by `StatusChip` / `StatusDot` (`src/components/hms/status.tsx`). Never hand-roll a status colour.

| Status | Label / Arabic | Icon (lucide) | Class |
|---|---|---|---|
| READY | Ready / جاهزة | CheckCircle2 | `status-ready` |
| AWAITING_INSPECTION | Inspect / بانتظار الفحص | ClipboardCheck | `status-inspect` |
| CLEANING | Cleaning / قيد التنظيف | Sparkles | `status-cleaning` |
| DIRTY | Dirty / غير نظيفة | Bed | `status-dirty` |
| DND | DND / عدم الإزعاج | Moon | `status-dnd` |
| BLOCKED_OOO | Out of order / خارج الخدمة | Wrench | `status-blocked hatch` |
| BLOCKED_OOS | Out of service / خارج الخدمة مؤقتًا | Ban | `status-blocked dotted` |
| OCCUPIED | Occupied / مشغولة | User | `status-occupied` |

## 4. Typography
- UI: `--font-sans` = system / SF Pro / Inter, then **"Riwaq Arabic"** (Thmanyah via `local()`), then **Almarai** (Google Fonts, closest free match).
- Brand: `--font-brand` Cormorant Garamond ("Riwaq"); `--font-brand-ar` Thmanyah Serif Display («رِواق»), then **Markazi Text** (Google Fonts, closest free match).
- Scale: h1 26px/1.25 · body 15px · label 13px · caption 12px. Tabular numbers for counts and times.
- **Thmanyah only renders on machines where it is installed**; everyone else (e.g. the Lovable link) sees Almarai / Markazi Text. Never commit font files (licence). See `decision-log.md`.

## 5. Shape, depth, spacing
- Radii: `--r-sm` 10 · `--r-md` 12 (tiles) · `--r-lg` 16 · `--r-xl` 20 · `--r-2xl` 24 (panels) · pills fully round.
- Depth: `--hairline` (0.5px), `--lift-1`, `--lift-2`. No heavy borders, no glass on the shell.
- Spacing: 4px base; panels pad 20–26px; desktop gutter 28px; mobile gutter 16px.
- Motion: `--ease` cubic-bezier(.2,.8,.2,1); keep it short and functional.

## 6. Buttons
`src/components/ui/button.tsx` adds Riwaq variants: `hmsPrimary` (brass), `hmsSecondary` (dark), `hmsGhost`; sizes `hmsSm`, `hmsMd`, `hmsLg`, `hmsIcon`, `hmsXl` (64px mobile footer action). Targets ≥ 44px, mobile primary 64px, visible focus ring.

## 7. Component inventory
| Component | Code | CSS prefix |
|---|---|---|
| Desktop shell (sidebar, top bar, account menu, skip link) | `desktop-shell.tsx` | `.desktop-*`, `.user-menu-*` |
| Needs-you-now strip | `now-strip.tsx` | `.now-*` |
| Readiness ribbon (filters board) | `desktop-pages.tsx` | `.readiness-ribbon`, `.ribbon-*` |
| Room tile / floor board / room card | `room-components.tsx` | `.room-tile`, `.floor-*` |
| Heritage notice (arch icon, text only) | `room-components.tsx` | `.heritage-notice` |
| Room drawer | `room-drawer.tsx` | `.room-drawer`, `.drawer-*` |
| Arrivals timeline | `arrivals-timeline.tsx` | `.arr-*` |
| Front desk tiles | `desktop-pages.tsx` | `.fd-*` |
| Reports charts | `reports-page.tsx` (Recharts) | `.chart-*`, `.report-*` |
| Dialogs | `desktop-dialogs.tsx` | `.hms-dialog`, `.dialog-*` |
| Mobile shell, bottom tabs, sheet | `mobile-shell.tsx` | `.mobile-*`, `.m-sheet-*` |
| Mobile checklist, meter, inspection | `mobile-detail.tsx` | `.m-check*`, `.m-meter*`, `.m-point*` |
| Empty / skeleton / error states (optional `art` picture) | `demo-states.tsx` | `.empty-state-art` |
| Illustration kit: `CourtyardScene`, `RoomArt`, `StaffAvatar`, `RoleArt`, `EmptyArt`, `Picto` + icon maps | `illustrations.tsx` | `.picto`, `.zone-*`, `.cat-*`, `.tone-*` |
| Welcome hero (Live Board: greeting, courtyard at dusk, readiness gauge) | `desktop-pages.tsx` | `.welcome-*` |
| Desktop sign-in (split: courtyard scene + night form) | `mobile-pages.tsx` `DesktopLoginPage` | `.login-*` |
| Mobile sign-in (job picture → face → PIN) | `mobile-pages.tsx` `MobileLoginPage` | `.m-login-*`, `.m-role-card`, `.m-face-grid` |

## 7a. Pictures and illustrations
Art lives in `illustrations.tsx`. Scene and room photos are AI-generated WebP files in `src/assets/photos/` (fictional property, no people, no text, no real hotel); pictograms, staff avatars, job pictures and empty states are original inline SVG. No stock or real hotel imagery, in the juss/brass/mud palette plus a night palette (`--night-*`) for the login and welcome hero.
- **Field staff read little:** on mobile, every list row and choice carries a picture: room thumbnails show the room type and the bed state (messy → in progress → made), checklist items get a pictogram tinted by zone, issue categories, pause and skip reasons get icons, staff pick themselves by illustrated face.
- A picture never replaces words or status: status chips (colour + icon + text) stay next to it.
- Decorative SVG is `aria-hidden`; the text label beside it is the accessible name.
- The Live Board welcome image is `majlis-luxury.jpg`: a generated daylight lounge with refined arcades, tailored sofas and polished finishes. It replaces the rustic night majlis on this screen only; the existing overlay keeps the greeting legible.

## 8. States every screen needs
Default · loading/skeleton · empty · error with retry · success feedback (toast via sonner).

## 9. Don'ts
No eyebrow/kicker labels above headings, no hero metric-card rows, no progress rings except the one readiness gauge in the welcome hero, no gradient text, no emoji icons, no real hotel logos or photos, no "Demo" labels, no claim that a PMS or server is connected.

## 10. Before merging UI changes
Run `/impeccable critique` (or `polish`) on the changed screen and an Intent accessibility pass (see `AGENTS.md`). Check desktop at 1440px and mobile at 390px.
