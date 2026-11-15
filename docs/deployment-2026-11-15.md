# Deployment — November 15, 2026

Owner approved deployment in chat.

- Source commit: `9cdc5f6` in `jrschwab15-netizen/common`.
- [Successful production Pages workflow](https://github.com/jrschwab15-netizen/common/actions/runs/43741293703). Build, tests, artifact upload and deployment all succeeded.
- Supabase backend: dedicated `common` project `mtllkwmmuqmipavnxqpd`; existing migrations, private Storage and common-api Edge Function remain deployed.
- Directory verified live: 351 municipalities and 4,942 approved source-backed aliases.
- GoDaddy zone was inspected: parked apex, www alias, NS/SOA, _domainconnect and _dmarc. Parking was replaced; unrelated records preserved.
- Applied apex A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153. Applied www CNAME: jrschwab15-netizen.github.io.
- Authoritative GoDaddy nameservers and Cloudflare resolver returned the new records.
- Direct GitHub Pages origin returned HTTP 200; deployed HTML, JS and CSS were byte-for-byte equal to the tested dist build. This check deliberately avoided a stale local DNS cache and is not proof of HTTPS readiness.
- TLS: GitHub approved a certificate for apex and www, expiring 2027-02-13. HTTPS enforcement is enabled. Public verification passed: HTTP apex, HTTPS apex, HTTP www and HTTPS www all reach https://ourcommon.co/ with valid certificate verification and the Common build.
- Auth: dashboard Save actions reverted Site URL and callback allowlist to defaults. CLI has no authenticated session. Owner was given exact settings and dashboard link; persistence and email round-trip remain unverified. Guest capabilities are independent of Auth.

Six desktop/mobile browser acceptance tests passed against the public HTTPS origin, including live directory search, hash-route navigation, emergency gating and required-photo validation. Full production sign-in remains unverified until Auth settings persist and the email round-trip is tested. Later-phase moderation/GIS/routing limitations remain as recorded in implementation-status.md.
