# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **zero-dependency static website** (ABCspareparts landing page) deployed via GitHub Pages (Jekyll). There is nothing to compile or bundle for the app itself.

### Services / how to run
- There is a single "service": the static site. Serve the repo root with any static file server, e.g. `python3 -m http.server 8000`, then open `http://localhost:8000/index.html`.
- Node.js (v22) is preinstalled and is only needed to run the build/generator scripts, not to serve the site.

### Build / generate (Node scripts, see `package.json`)
- `npm run build:brands` — regenerates the ~11,960 `marche/*.html` brand pages from the `brands` array embedded in `index.html` (runs `extract-brands.js` then `generate-brand-pages.js`). This rewrites thousands of files, so only run when intentionally regenerating.
- `npm run build:casi` — regenerates the success-case pages under `casi-di-successo/` from `supply-cases.json`.
- These generators are the closest thing to a "dev/build" step; there is no watch/hot-reload. After editing source data, re-run the relevant generator and reload the page.

### Lint / test / verify
- There is no linter or unit test framework. `npm run verify` (`verify-build.js`) is the check to run: it validates brand page counts, sitemap `<loc>` counts, required SEO markers (canonical, hreflang, related-brands block), and case-page consistency. Run it after any change to `index.html` brands, generators, or sitemaps.

### Gotchas
- `verify-build.js` hardcodes expectations (e.g. the `11960+` marker in `index.html` and exact page counts), so it will fail if brand/case data changes without re-running the generators.
- Brand pages live in `marche/` and must reference site-root pages with `../` (e.g. `href="../index.html"`); `verify-build.js` enforces this.
