# Common

Public spaces. Public record.

Common is an independently managed Vite / React / TypeScript application for **GitHub Pages**, with **Supabase** Auth, Postgres/PostGIS, private Storage and Edge Functions. GoDaddy remains the DNS provider for `ourcommon.co`. No ChatGPT Sites project or hosting is used.

**Status: working prelaunch core, not the completed Open Beta.** See [implementation status](docs/implementation-status.md) for exact verified behavior, remaining gates and review findings. Production deployment requires owner approval; pushes run CI, while the Pages deploy job runs only on an explicit workflow dispatch.

## Local development

Node 24 and npm are required.

```sh
npm ci --ignore-scripts
cp .env.example .env.local
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

On PowerShell use `Copy-Item .env.example .env.local`. The example contains only the public project URL and publishable key. Never put a service role, secret key or provider credential in any `VITE_` variable. The frontend bundle is public.

## Independent infrastructure

- Repository: https://github.com/jrschwab15-netizen/common
- Supabase project: `mtllkwmmuqmipavnxqpd`, `common`, JRS - World, `us-east-1`.
- API: `https://mtllkwmmuqmipavnxqpd.supabase.co/functions/v1/common-api`.
- Intended domain: `https://ourcommon.co` (live on GitHub Pages with HTTPS; see [deployment evidence](docs/deployment-2026-11-15.md)).
- Routing uses hash URLs: `/#/report`, `/#/places/cambridge-ma-49`, `/#/issues/<publicId>`. These reload safely on static hosting. Clean URL migration needs hosting rewrites or prerendered routes; it is not promised on Pages.

## Backend

Apply `supabase/migrations` in order to a **new, dedicated** project. The existing Common project already has the schema and directory. Deploy `supabase/functions/common-api` with JWT gateway verification disabled because guests use capability tokens; the function independently validates authenticated actions with `auth.getUser()`. Do not change that into a client-side authorization check.

The original and approved-media buckets are private, with no client Storage policies. Only the backend signs uploads or reviewed derivative reads. Original uploads cannot overwrite existing objects. Intake is idempotent, and finalize creates media and a geographic-review hold transactionally. No automatic publication or agency notification is implemented.

Public frontend calls directory tables/RPC through RLS. Privileged API operations use the server's environment-provided service role. Guest tokens are 256-bit HMAC capabilities stored only as hashes; claim is atomic and revokes guest tracking. No raw token, email or precise reporter location is logged by application code. Tokens live in the URL fragment and are excluded from HTTP paths/referrers.

## Authoritative Massachusetts imports

```sh
npm run import:massgis -- --dry-run
npm run import:massgis
node scripts/import-aliases.mjs
node scripts/apply-import.mjs
```

Alias ZIP extraction currently uses PowerShell `Expand-Archive`; the municipality importer is portable Node. `apply-import` requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the operator's process environment, never in the frontend or source control. It imports only after migrations are present. Record source manifests under `data/`; original downloads and generated SQL are ignored. Inspect diffs and run `supabase/tests/security.sql` after refresh. For aliases, compare the generated manifests and `aliases-unmatched.json` before applying. Imports upsert official IDs and normalized aliases; missing source aliases are retained as rejected, not silently reassigned.

Live validation established **351** municipalities, all with valid MultiPolygons, and **4,942** approved aliases from the official MassGIS lookup. MassGIS's TYPE values are preserved (`C`, `T`, `TC`) rather than forcing a city/town total. Wayland's source polygon has a self-intersection; `ST_MakeValid` and polygon extraction are recorded with the source reason in `data_sources.metadata.geometry_repairs`.

## Operations and launch

Read [runbook](docs/runbook.md), [DNS changes](docs/dns.md), [test results](docs/implementation-status.md), and the [source specification](docs/build-spec.md). Configure Auth redirects, a delivery-ready email provider, an approved geocoder, retention operations, moderators and verified GIS responsibility sources before launch. A directory boundary is not maintenance responsibility evidence.

No open-source license has been selected. Source is publicly inspectable; the owner must choose the intended distribution license. Third-party font licenses are included separately.
