# CLAUDE.md

You are working on **Riwaq (رِواق)**, a heritage hospitality operations demo for a fictional Gulf heritage hotel, Dar Al Majlis «دار المجلس». Front-end only, mock data in localStorage, no backend.

Two people work on this repo through their own Claude sessions: **@abdulsalahuddin94-dev** (Abdul, owner) and **@EmG38**. The repo is the shared memory between them. Read before you act, and leave a trail when you finish.

## Read first, in this order
1. `AGENTS.md`: rules, design tooling, Lovable warning (imported below).
2. Top of `CHANGELOG.md`: what the other person did recently and why.
3. `docs/README.md`: index of specs, research, IA, sitemap, design system, decisions.
4. `docs/workflow.md`: branch → docs → changelog → checks → merge.
5. `docs/protected-decisions.md`: choices made on purpose (mobile PIN sign-in, one language per screen, Android phones, hotel brand first, no backend, Thmanyah licence, heritage rules, status dimensions).

## Before changing a reasoned decision: stop, explain, ask
If a request would remove, reverse or weaken anything in `docs/protected-decisions.md` (even as a side effect), **do not edit yet**. In the person's language, say what was decided (with its `PD-xx` ID), why it was built that way, the best-practice basis, and what would get worse. Then ask: "Are you sure you want to change this?" and offer a way that keeps the decision. Proceed only on a clear yes from that person in the conversation, then log a `Supersedes PD-xx` row in `docs/decision-log.md`, update `protected-decisions.md`, and say it in the changelog. Owner sign-off entries need Abdul's OK when someone else asks; licence/safety entries can't be overridden. This applies to everyone, Abdul included.

## First run on a new machine
Check `public/fonts/thmanyah/` for the Thmanyah `.woff2` files. If they are missing, tell the user (in their language) to download the font from https://font.thmanyah.com and copy the files there, as `public/fonts/thmanyah/README.md` explains. **Never commit, upload or send those files** (licence). Without them the app still works with Almarai / Markazi Text.

## Every change you finish must
- Update the docs it touches (sitemap, IA, design system, decision log, research, roadmap). See `docs/workflow.md` §Making a change.
- Add a `CHANGELOG.md` entry at the top: what, why, decisions, PR, and `@login` of the person who asked.
- Pass `npx tsc --noEmit` and `bun run build`.
- Be merged into `main` with a merge commit via PR (owner's rule), never force-pushed.

## Talk to the user
Abdul writes in Egyptian Arabic; reply in Arabic to him. Code, commits, docs and UI copy are in English unless the task is Arabic content.

@AGENTS.md
