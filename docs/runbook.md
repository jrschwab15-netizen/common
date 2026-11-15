# Operations and deployment runbook

## Before launch

1. Resolve the missing approved prototype/logo assets; compare all breakpoints and entry/receipt states.
2. In Common's Supabase Auth URL settings, set site URL `https://ourcommon.co`; allow exactly the actual root callback `https://ourcommon.co/` plus explicitly approved staging/local URLs. Do not add broad wildcard redirects. Enable email auth and configure SMTP/OTP delivery. If using a code template, include the actual OTP; magic-link callback also works with PKCE on the same browser. Test the complete email round-trip and pending draft restoration.
3. Store approved geocoder configuration only in Supabase secrets. `GEOCODER_BASE_URL` is a Nominatim-compatible HTTPS search URL (without query). The built-in server throttles this action globally to one request/second and per network; before enabling a public provider, add a backend cache and verify provider terms and licensing. Municipality typeahead is local MassGIS/Postgres search and never calls a geocoder. [OSMF public Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) prohibits autocomplete, bulk extraction and generic platform use; public Nominatim is deliberately not configured.
4. Assign actual maintenance GIS sources, trained moderators, private-media processing and manual-review policies. Never publish private intake as a shortcut. Agency endpoints require affirmative authorization; queueing is never delivery.
5. Confirm retention/deletion schedules: awaiting uploads should be swept after 24h; private rejected/unclaimed submissions have a 90-day review horizon. Delete originals through Storage first and dependent private rows transactionally; preserve or anonymize public audit events as appropriate. Expiration fields currently revoke capability access only; they do not perform deletion. Purge expired rate-limit counters regularly. Set up jobs before traffic begins.
6. Run npm tests/build/audit, browser acceptance tests, SQL security tests and live smoke checks. Do not run `--intake` unattended against production; it creates a synthetic private test fixture. Keep all fixture metadata explicit and never route/publish it. Delete QA media through privileged Storage and remove private fixture rows after verification.
7. Inspect advisors. Backend-only tables intentionally have RLS and no client policy. Do not add permissive policies merely to remove INFO notices.
8. Obtain production approval, then manually run the GitHub deployment workflow. DNS instructions are in `dns.md`; changes that replace current records require approval after the full zone is inspected. No deployment is complete until domain TLS and the real end-to-end flow pass.

## Secrets and access

Only the public Supabase URL and publishable key enter Pages JavaScript. All service keys come from Supabase's Edge runtime environment. No service key belongs in repository files, VITE variables, logs or Pages secrets compiled into the app. Import credentials belong only in the operator's process environment.

Guest receipt tokens grant access to a minimized private status, expire after 90 days, and are revoked atomically on claim. To revoke a leaked receipt without claiming, an authorized operator sets `claim_revoked_at` in the privileged backend; audit the reason. Do not copy raw tokens into tickets or dashboards.

Signed original uploads are insert-only. Retry finalization if a network failure follows a successful upload; do not overwrite a finalized original. Future moderation must fingerprint reviewed media and publish only separately generated, reviewed derivatives. No derivative processor or publish control is currently enabled.

## Deployment / rollback

Main pushes run the pinned Actions build/test jobs. Pull requests never deploy. The deploy job runs only with `workflow_dispatch`; it uploads `dist` through Pages artifact/deploy actions. Custom domain is already reserved in Pages. There is no always-on Node backend, Next server route or secret process in GitHub Pages.

Before enabling wider access, create a separate staging Supabase project; do not use other Open Beta databases. Costs require approval. Test Auth redirects and Storage independently there. Staging frontend previews need their own explicit Vite base/CORS/Auth allowlists; do not claim the root-domain production build works under a repository subpath unchanged.

Rollback frontend by reverting the bad commit and dispatching a passing build. Restore backend via reviewed forward migrations/backups; never drop/reseed operational tables to fix UI behavior. Preserve durable first-report timestamps and append-only history.

## Incident response

If private material is exposed, stop new intake if necessary, revoke affected tokens/URLs, remove derivative access, preserve restricted audit evidence and notify affected users through an approved channel. Rotate any exposed backend credentials and redeploy. Existing receipt token hashes remain valid for tracking; service-key rotation changes retry-token derivation, so handle in-flight pre-rotation drafts through a controlled support flow. Investigate RLS/storage authorization before restoring publication.

The one-time bootstrap Edge Function is disabled (JWT required, body returns 410). It must never be re-enabled as an anonymous importer in normal operation.
