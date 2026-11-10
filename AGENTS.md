# Riwaq — agent guide

Riwaq (رِواق) is a heritage hospitality operations platform for Gulf heritage hotels. **This repository is a clickable browser demo/prototype. It has no backend.**

## Read first
- `docs/specs/riwaq-product-spec.md`: the primary product spec. It wins over every other document.
- `docs/specs/hms-supplementary-spec.md`: supplementary only. Treat its hard numbers and material-care steps as proposals.
- `docs/decision-log.md`: decisions taken and decisions still OPEN.
- `docs/design-direction.md`: the visual direction and its reference hotels.

## Rules
- Keep everything client-side (`src/lib/hms-store.ts` uses localStorage). Don't add a server, database, auth provider or real PMS without the owner's approval.
- Label every simulated thing as simulated: sync, server receipt, PMS confirmation. Never show demo data as confirmed by an external system.
- Never invent heritage conservation instructions. Heritage assets show "awaiting specialist approval" and tell staff to report, not treat.
- Never use color alone to convey status. Always pair it with an icon and a text label.
- Housekeeping, occupancy, maintenance and availability are separate dimensions.
- Routing: TanStack Start file routes in `src/routes` (see `src/routes/README.md`).
- Check with `npx tsc --noEmit` and `bun run build` before pushing.

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
