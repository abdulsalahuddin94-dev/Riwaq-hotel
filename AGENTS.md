# Riwaq — agent guide

Riwaq (رِواق) is a heritage hospitality operations platform for Gulf heritage hotels. **This repository is a clickable browser demo/prototype. It has no backend.**

Team: **@abdulsalahuddin94-dev** (owner) and **@EmG38**, each working through their own AI session. The repo is their shared memory.

## Read first
- `CHANGELOG.md` (top entries): what the other person changed recently, and why.
- `docs/README.md`: index of every doc below.
- `docs/specs/riwaq-product-spec.md`: the primary product spec. It wins over every other document.
- `docs/specs/hms-supplementary-spec.md`: supplementary only. Treat its hard numbers and material-care steps as proposals.
- `docs/decision-log.md`: decisions taken (with why and by whom) and decisions still OPEN.
- `docs/protected-decisions.md`: reasoned decisions with their basis. **Before changing one, stop, explain why it was built that way, and ask "are you sure?"** (rule at the top of that file).
- `docs/research/`: domain research (OPERA, Cloudbeds, competitors, personas) and raw inputs.
- `docs/information-architecture.md` and `docs/sitemap.md`: structure, status dimensions, every route.
- `docs/design-system.md`, `DESIGN.md`, `docs/design-direction.md`: tokens, components, mood.
- `PRODUCT.md`: product context in the [impeccable](https://github.com/pbakaus/impeccable) format.
- `docs/workflow.md`: how to branch, document, log and merge.

## When you finish a change
1. Update the docs it touches (sitemap, IA, design system, decision log, research, roadmap).
2. Add an entry at the top of `CHANGELOG.md`: what, why, decisions, PR, `@login` of who asked.
3. Pass `npx tsc --noEmit` and `bun run build`.
4. Open a PR (template in `.github/`) and merge it into `main` with a merge commit.

## Design tooling
UI work follows two open design skill sets:
- **impeccable** (pbakaus/impeccable, Apache-2.0): Operate mode for app UI. Run `/impeccable critique` or `/impeccable polish` on a screen before merging UI changes.
- **Intent** (ghaida/intent, CC0): UX evaluation (heuristics, cognitive walkthrough) and WCAG 2.2 inclusion checks.

Each person installs them in Claude Code once (not auto-enabled from this repo):
```
/plugin marketplace add pbakaus/impeccable
/plugin install impeccable@impeccable
/plugin marketplace add ghaida/intent
/plugin install intent@intent
```

## Rules
- Handle mobile scroll chrome in MobileShell with passive listeners and cleaned-up idle timers so all staff roles share compact headers and idle-restored navigation.
- Keep immersive mobile room photography in the app-host layer and scrolling content above it, so back navigation and the collapsed title remain reachable independently of scroll position.
- Opt mobile screens into refined room photography explicitly; do not change desktop wing-photo mapping when refreshing mobile visuals.
- Resolve room-drawer photographs through the wing-photo map using existing room floor assignments, independently of room-type icons, so visual changes cannot alter operational grouping.
- Keep everything client-side (`src/lib/hms-store.ts` uses localStorage). Don't add a server, database, auth provider or real PMS without the owner's approval.
- Label every simulated thing as simulated: sync, server receipt, PMS confirmation. Never show demo data as confirmed by an external system.
- Never invent heritage conservation instructions. Heritage assets show "awaiting specialist approval" and tell staff to report, not treat.
- Never use color alone to convey status. Always pair it with an icon and a text label.
- Housekeeping, occupancy, maintenance and availability are separate dimensions.
- Routing: TanStack Start file routes in `src/routes` (see `src/routes/README.md`).
- Check with `npx tsc --noEmit` and `bun run build` before pushing.
- Never commit font files (Thmanyah licence). Each person keeps their own copy in the git-ignored `public/fonts/thmanyah/` (see its README). Bump `VERSION` in `hms-store.ts` when the seed or state shape changes.

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
