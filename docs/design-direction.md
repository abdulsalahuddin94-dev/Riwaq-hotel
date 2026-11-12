# Design direction

Riwaq should feel like a shaded Gulf courtyard: calm, warm and precise. Usability comes before ornament, especially on field-worker screens.

## Palette (tokens in `src/styles.css`)
- **Neutrals:** warm juss plaster (`--neutral-50`, page `#f6f1e8`) through sand, down to deep brown text (`--neutral-900`).
- **Brass** (`--brass-*`): a restrained accent for primary actions and the active nav item only.
- **Status:** palm green = ready, terracotta = dirty, ochre = cleaning, muted blue = awaiting inspection, plum = DND, basalt = blocked. Always paired with an icon and a label.

## Type
- The UI uses the system stack / Inter for Latin.
- Arabic uses **Thmanyah**, referenced via `local()` only (see the licence note in `decision-log.md`). Viewers without it installed get the closest free web fonts: **Almarai** (UI) and **Markazi Text** (display).
- The brand wordmark uses Thmanyah Serif Display (web fallback Markazi Text) for «رِواق» and Cormorant Garamond for "Riwaq".

## Mark
`src/assets/riwaq-mark.svg` is an arcade arch under Najdi triangular crenellations (also `public/favicon.svg`).

## References (mood only; copy no logos or photos)
Operating properties come first: Bab Samhan (Diriyah), The Chedi Al Bait (Sharjah), Souq Waqif Boutique Hotels (Doha), Alila Jabal Akhdar (Oman) and Dar Tantora (AlUla). Boutique Group palaces and Diriyah Company are strategic references only. Links are in `docs/specs/hotel-reference-links.md`.
