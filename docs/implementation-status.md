# Review and implementation status — November 15, 2026

## Verified working

- Independent GitHub `jrschwab15-netizen/common` repository and separate Supabase `common` project `mtllkwmmuqmipavnxqpd` in JRS - World / US East. No other application's database was modified.
- Editorial responsive frontend with guest-first Quick Report, accessible keyboard location search, municipality profiles, explicit coverage states, manual coordinates and draggable issue pin, emergency gate, required photo, optional 500-character note, private receipt, optional account claim, My Reports, and policy/safety content.
- Live authoritative MassGIS import: **351 distinct official municipal IDs; 351 valid MultiPolygon geometries; 0 duplicates**. Type counts from source: C=44, T=294, TC=13. This differs from the brief's 50/301 assertion; source classifications take precedence over an invented mapping.
- **4,942** approved distinct parent-linked aliases from **4,947** source rows (five duplicate parent/normalized aliases collapsed); no unmatched parents. East Arlington resolves to Arlington, Jamaica Plain to Boston. Identical aliases in different municipalities remain distinct and disambiguated.
- Alias re-import changed **zero** rows when the source was unchanged. Boundary importer records official owner, fields, original CRS 26986, output CRS 4326, checksum, retrieval/version and public-record terms.
- Wayland (315) has a source ring self-intersection. Live import failed closed first, then repaired it with an explicitly recorded `ST_MakeValid` operation; original source download remains unchanged. All live boundaries validate.
- Real guest intake, signed private image upload, byte/MIME/dimension validation, atomic finalize, persisted under-review receipt, and idempotent intake retries were exercised against the actual project.
- Two real, temporary Supabase Auth accounts tested successful guest claim, idempotent same-account claim retries, revoked guest access, My Reports, and denial of another user's read or claim. Client ownership reassignment was denied. Temporary accounts were deleted.
- Anonymous table reads, claim-hash reads, original bucket enumeration, public original URLs, guessed tokens, unauthenticated My Reports and unauthenticated claims were denied.
- Unit tests: **9 passed**. Desktop/mobile Playwright tests: **6 passed**, including real directory search, keyboard selection, emergency flow, required-photo gate, unknown routes and width checks. Screenshots were inspected at desktop, 390px and 320px; no horizontal overflow.
- TypeScript and production build passed. Dependency audit after updates: **zero known vulnerabilities**. Supabase security advisor reported only informational deny-by-default RLS tables with no client policies; those six tables are intentionally backend-only.
- GitHub Pages Actions and custom domain configured. Domain configuration occurs before any DNS change. Main pushes build and test; production deployment requires manual dispatch.

## Review findings resolved in implementation

- Chose hash routing because Pages lacks SPA rewrite rules; no claim of clean dynamic route reload support.
- Split directory availability from GIS maintenance responsibility, routing and metrics readiness. All readiness flags remain false except directory_loaded; there are no cleanliness grades or invented operational records.
- Accounts use real Supabase Auth rather than the prototype's email-only identity simulation.
- Public/private columns are restricted separately; owner access never includes claim hashes, precise points, original paths or private notes through the public Data API.
- Upload retries cannot overwrite finalized original objects. Private originals are never returned as public images.
- Signed media and receipt responses are no-store. Tokens are carried in request bodies and hash routes, not ordinary URL paths or analytics.
- Publication requires both geographic eligibility and media approval at the database constraint and public-policy levels. No client publication endpoint exists.
- Fixed known dependency advisories before publication of source.

## Not completed / gates before public launch

1. **Approved assets absent:** `common_v7_search_guest_accounts.html`, `common_concept_a_mark.png`, and `common_concept_a_app_icon.png` were not in the workspace or Downloads. The current text-only wordmark is temporary; no substitute logo was invented. Prototype parity and final brand approval remain unverified. No historical NYC image was used, avoiding unsupported evidence or licensing claims.
2. **Authentication operations:** real Auth sessions and claims were tested, but production magic-link/code email delivery, SMTP, site URL and exact redirect allowlist still need configuration and an owner email round-trip. The callback expects the root URL plus `?code=...`; code exchange uses PKCE, then enters the hash-routed app. Pending drafts persist in IndexedDB and resume after sign-in.
3. **Address geocoder:** manual pin/coordinates and explicit-action geolocation work. `GEOCODER_BASE_URL` must point to an approved, licensed, Nominatim-compatible HTTPS provider. No public geocoder is enabled by default. No provider credentials or subscription were invented.
4. **Phase 2:** jurisdiction-specific public ownership/maintenance GIS, moderation staff and console, image privacy transforms/blur/EXIF stripping, AI suggestion, perceptual duplicates and appeals remain unfinished. Every intake therefore stays under review; geographic decisions default to uncertain_review. No public cases have been fabricated.
5. **Phase 3:** official authorized agency adapters, delivery and acknowledgment processing, independent-resolution review rules, verified reopening, notifications/unsubscribe, nearby consent-based checks and sufficient-data statistics remain unfinished. Community yes/no submissions are pending evidence only and never update resolution.
6. **Hardening:** production CAPTCHA/adaptive abuse controls, penetration review, retention/deletion jobs, backups and recovery drill, geocoder caching/provider operations, full assistive-technology audit, actual iOS Safari/Android Chrome device testing and legal/privacy contact review remain required. Playwright's mobile Chromium viewport is not proof of native Safari QA.
7. **Staging:** no separate staging database was provisioned and no additional billable resources were created. Create an isolated staging project with explicit cost approval if needed; PR CI builds do not touch production data.
8. **GoDaddy update:** browser access succeeded during the authorized deployment. The seven-record original zone was inspected. Parking was replaced with four Pages A records and www now points to jrschwab15-netizen.github.io. NS/SOA, _domainconnect and _dmarc were preserved. Authoritative/public DNS and public HTTPS were verified.
9. **Production update:** owner approved deployment; the current build is live at https://ourcommon.co with valid apex/www HTTPS and redirects. Six live browser checks passed. See deployment-2026-11-15.md. Production Auth settings and email round-trip remain pending; later-phase capabilities below are still unfinished.

The complete Open Beta is **not finished**. Phase 0 visual parity and Phase 1 production email/domain gates are still open; later phases must not be described as delivered merely because tables and conservative public readers exist.
