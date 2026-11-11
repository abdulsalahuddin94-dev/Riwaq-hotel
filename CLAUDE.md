# CLAUDE.md

You are working on **Riwaq (رِواق)**, a heritage hospitality operations demo for a fictional Gulf heritage hotel, Dar Al Majlis «دار المجلس». Front-end only, mock data in localStorage, no backend.

Two people work on this repo through their own Claude sessions: **@abdulsalahuddin94-dev** (Abdul, owner) and **@EmG38**. The repo is the shared memory between them. Read before you act, and leave a trail when you finish.

## Read first, in this order
1. `AGENTS.md`: rules, design tooling, Lovable warning (imported below).
2. Top of `CHANGELOG.md`: what the other person did recently and why.
3. `docs/README.md`: index of specs, research, IA, sitemap, design system, decisions.
4. `docs/workflow.md`: branch → docs → changelog → checks → merge.

## Every change you finish must
- Update the docs it touches (sitemap, IA, design system, decision log, research, roadmap). See `docs/workflow.md` §Making a change.
- Add a `CHANGELOG.md` entry at the top: what, why, decisions, PR, and `@login` of the person who asked.
- Pass `npx tsc --noEmit` and `bun run build`.
- Be merged into `main` with a merge commit via PR (owner's rule), never force-pushed.

## Talk to the user
Abdul writes in Egyptian Arabic; reply in Arabic to him. Code, commits, docs and UI copy are in English unless the task is Arabic content.

@AGENTS.md
