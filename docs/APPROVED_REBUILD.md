# Approved homepage rebuild

Integrated the supplied approved v7 HTML, Concept A brand assets, and React adapter into the existing Common app. The homepage uses an isolated shadow root; other routes retain their existing app shell.

The homepage connects to the existing municipality search and report routes. Search supports keyboard selection and discards stale requests. Prototype scripts are removed before rendering. Issue cards and sample town statistics remain labeled as illustrative examples. The outer shell does not duplicate the homepage header, footer, or mobile report button.

Validation on November 15, 2026:
- TypeScript and Vite production build passed.
- Nine existing unit tests passed.
- Fourteen Playwright checks passed across desktop and mobile projects, including live Cambridge directory lookup, guest reporting, emergency gating, example filters, and horizontal overflow checks at 1440×900, 768×1024, 390×844, and 320×700.
- Screenshots are generated in test-results/approved-home-*/. Typography follows the supplied system/Georgia font stack and varies across operating systems; exact pixel equality with the supplied reference screenshots is not claimed.
- Vite reports the existing large JavaScript bundle warning.

On this Windows runtime, npm is absent from PATH. Equivalent checks run with:

    node node_modules/typescript/bin/tsc --noEmit
    node node_modules/vite/bin/vite.js build
    node node_modules/vitest/vitest.mjs run
    $env:PLAYWRIGHT_BROWSERS_PATH='C:/Users/james/AppData/Local/ms-playwright'
    node scripts/test-browser.mjs

No backend, deployment configuration, or production deployment was changed. Editorial photographs retain the supplied external image URLs and attribution.
