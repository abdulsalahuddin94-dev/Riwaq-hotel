# Thmanyah font files (local only, never committed)

The Thmanyah licence does not allow the font files to be uploaded, hosted or shared, so this folder stays empty in git (`.gitignore` blocks font files here).

**One-time setup on your machine:**
1. Download the font yourself from the official site: https://font.thmanyah.com
2. From the download, copy the `.woff2` files of **thmanyahsans** and **thmanyahserifdisplay** into this folder, keeping their names:
   - `thmanyahsans-Light.woff2`, `-Regular`, `-Medium`, `-Bold`, `-Black`
   - `thmanyahserifdisplay-Regular.woff2`, `-Medium`, `-Bold`
3. Run `bun dev` (or `npm run dev`) and open the app on `localhost`. Arabic text now uses Thmanyah.

Notes:
- Only the local dev server loads these files (`src/lib/local-fonts.ts`). The shared Lovable preview never requests them and shows the free fallbacks (Almarai, Markazi Text).
- Installing the font in your OS also works; the app tries the installed copy first.
- Don't run a production build from your machine and deploy it: `public/` would copy the files into `dist/`.
