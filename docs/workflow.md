# How we work

Two people build Riwaq, each through their own Claude session: **@abdulsalahuddin94-dev** (Abdul, owner) and **@EmG38**. Lovable is also connected to `main`. This file is the contract that keeps the three in sync.

## Starting a session
1. Give Claude the repo link. Claude reads `CLAUDE.md` → `AGENTS.md` → `docs/README.md` automatically.
2. Pull the latest `main` first. Read the top of `CHANGELOG.md` to see what the other person did and why.
3. Say who you are if Claude can't tell (it uses your GitHub login in the changelog).

## Making a change
1. Branch from the latest `main` (`claude/<topic>` or `<login>/<topic>`). Never commit straight to `main`.
2. Check `docs/protected-decisions.md`. If the change touches one, explain and confirm first.
3. Make the change. Keep the rules in `AGENTS.md` (no backend, honest labels, heritage rules, status = colour + icon + words).
4. Update the docs the change touches, in the same PR:
   - new/renamed route or overlay → `docs/sitemap.md`
   - new entity, state or role → `docs/information-architecture.md`
   - token or component look → `docs/design-system.md` + `DESIGN.md`
   - a choice someone could question → `docs/decision-log.md` (with Why and By)
   - new research → `docs/research/`
   - finished roadmap item → `roadmap.md`
5. **Add a `CHANGELOG.md` entry** at the top (format is in the file): what, why, decisions, PR, and `@login` of the person who asked.
6. Check: `npx tsc --noEmit` and `bun run build` must pass.
7. Open a PR with the template, then merge it into `main` with a **merge commit** once checks pass (owner's standing rule: auto-merge). Merging syncs to Lovable.

## Avoiding collisions
- Pull `main` before starting and again before merging. If `main` moved, merge `main` into your branch (don't rebase pushed commits).
- Never force-push, never rewrite pushed history (it breaks Lovable's history).
- If both people need the same big file (`src/styles.css`, `desktop-pages.tsx`, `hms-store.ts`), keep PRs small and merge often.
- Changelog conflicts: keep both entries, newest first.
- Bump `VERSION` in `src/lib/hms-store.ts` when you change the seed or state shape, so old browser saves reset.

## Disagreeing with a past decision
If it is in `protected-decisions.md`, Claude stops first: it explains why it was built that way and the basis, and asks "are you sure?" before editing (rule at the top of that file). After a yes, or for any other decision: don't silently undo it. Add a new row to `docs/decision-log.md` that supersedes the old one, say why, and mention it in the changelog so the other person sees it.

## Asking the owner
Scope changes (adding a backend, real auth, a real PMS, new brand direction) need Abdul's OK. Everything else: decide, log it, move on.
