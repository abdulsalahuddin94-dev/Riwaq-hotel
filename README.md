# Riwaq — رِواق

**Heritage Hospitality Operations Platform**: a clickable demo for Gulf heritage hotels and palaces. It covers housekeeping, inspection, maintenance and heritage-asset care, with quiet-luxury service.

> Demo/prototype only. There is no backend: data is seeded and kept in your browser. Nothing here is confirmed by a real PMS, and heritage care procedures are placeholders awaiting specialist approval.

**Working on this repo with Claude?** Just give Claude the repo link: it reads [`CLAUDE.md`](CLAUDE.md) and [`AGENTS.md`](AGENTS.md) and knows the research, structure, design system and history. See [`docs/workflow.md`](docs/workflow.md) for how we branch, log and merge.

| | |
|---|---|
| Docs index | [`docs/README.md`](docs/README.md) |
| Product spec (primary) | [`docs/specs/riwaq-product-spec.md`](docs/specs/riwaq-product-spec.md) |
| Research | [`docs/research/`](docs/research/README.md) |
| Information architecture | [`docs/information-architecture.md`](docs/information-architecture.md) |
| Sitemap | [`docs/sitemap.md`](docs/sitemap.md) |
| Design system | [`docs/design-system.md`](docs/design-system.md) |
| Decisions | [`docs/decision-log.md`](docs/decision-log.md) |
| Changelog (who did what, why) | [`CHANGELOG.md`](CHANGELOG.md) |

**Arabic font (Thmanyah), one-time setup:** download it yourself from https://font.thmanyah.com and copy the `.woff2` files into [`public/fonts/thmanyah/`](public/fonts/thmanyah/README.md). The folder is git-ignored because the licence forbids sharing the files. Without them, the app shows the free fallbacks (Almarai, Markazi Text).

Team: [@abdulsalahuddin94-dev](https://github.com/abdulsalahuddin94-dev), [@EmG38](https://github.com/EmG38).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://spec-spun-studio.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/51b61f89-497f-465a-8270-0f0828f1c11f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
