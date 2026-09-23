# Build Companion

CONTEXT INSTRUCTION FOR AI APP BUILDER:

You are building a production-grade web application based strictly on two authoritative specification files provided in this workspace:

1. `SPEC_PRODUCT_PRD.md` (Master PRD built upon SPEC_RESEARCH, SPEC_USER_FLOWS, and SPEC_DATA_SCHEMA)

2. `SPEC_DESIGN_SYSTEM.md` (Visual Design System, Tailwind 2-Layer Tokens [Primitives 50-950 & Semantics], Typography, Component 5 States, Mobile Grid)

RULES TO FOLLOW STRICTLY:

- DO NOT hallucinate arbitrary color schemes or layout systems. Use the exact HSL/HEX color tokens and typography scale defined in `SPEC_DESIGN_SYSTEM.md`.

- Implement mandatory 5 UI states for components (Default, Loading Skeleton, Empty State, Error Fallback, Success Toast).

- Mobile Responsiveness: Follow screen breakpoints (<767px mobile bottom navigation).

BEGIN INITIALIZATION:

Read `SPEC_PRODUCT_PRD.md` and `SPEC_DESIGN_SYSTEM.md` first, summarize the core application structure in 3 sentences, and generate the main layout shell and primary route navigation.

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
