# COMMON — CODEX MASTER BUILD SPECIFICATION
**Open Beta product catalog | Implementation handoff v3.0 | November 15, 2026**

> **Codex directive:** Build a real, production-oriented web application named **Common**, not a static mockup. The latest approved experience is represented by `common_v7_search_guest_accounts.html`; use it as a visual and interaction reference, **not** as production code. This document supersedes conflicting instructions in earlier Common briefs. Do not resurrect the removed Explore Cleanliness dashboard, weighted-score sliders, or mandatory sign-in.

## 0. Project objective

**Product:** Common — “Public spaces. Public record.”

Common lets anyone document an eligible problem with a public street, sidewalk, park, road, or other shared public asset. A user can open Quick Report, continue as guest, confirm the issue's location, add a photo, and optionally add a short note. The platform privately checks geographic responsibility, safety, duplication and content before making a public issue record and routing it to an appropriate agency when a supported delivery channel exists. The public record shows how long an issue has remained unresolved and whether any fix is independently verified. Residents can search for a city, town, or neighborhood to find local reports and transparent maintenance metrics.

**Mission:** Crowdsourced, constructive public accountability for sanitation and infrastructure maintenance, not private-property shaming or accusations against residents or individual municipal employees.

**Core promises:**
- **Public:** Eligible issue history and defensible aggregate statistics are accessible without login.
- **Fast:** Quick Report targets a 15–30 second active-input experience after permissions, excluding upload/network delays.
- **Guest-first:** Authentication is offered *only when the user enters Quick Report*, not as a homepage gate. A guest can complete a report and optionally save it to an account **after** reporting.
- **Trustworthy:** “Submitted,” “agency notified,” “agency acknowledged,” “agency closed,” and “independently verified fixed” are never conflated.
- **Private by default until vetted:** Unmoderated photos and uncertain geographic issues never appear on public pages or APIs.
- **No manufactured rankings:** Never invent location grades, cleanliness claims, agency response statistics, reported-fix counts, or coverage.

## 1. Source of truth and approved design

### 1.1 Input artifacts
- `common_v7_search_guest_accounts.html` — latest approved interaction prototype.
- `common_concept_a_mark.png` and `common_concept_a_app_icon.png` — approved Concept A branding; if files aren't present in repo, request/provision them rather than drawing a new logo.
- Earlier full Common specification (`Common_Open_Beta_Codex_Specification.md`) is supporting background **only** where consistent with this document.

### 1.2 Look and feel
- Keep Cambridge-inspired editorial homepage rhythm: impactful headline, concise supporting copy, large whitespace, clear story sections, minimal navigation, responsive layouts.
- Approved color family: white/cool-gray backgrounds, deep navy/charcoal text, cobalt-blue primary actions, restrained orange accents and the approved **orange hat brim** in Concept A. **Do not** reintroduce lime/forest-green/beige or improvise a new logo.
- Common brand uses lower-case `common` wordmark, approved acorn/location-pin/C logo.
- Consumer-grade product experience, not an old-fashioned municipal form or an overdecorated generic AI dashboard.
- Responsive mobile-first design (minimum 320px), with an easy-to-reach persistent Quick Report action on mobile; full keyboard and screen reader accessibility; WCAG 2.2 AA target.
- Use genuine licensed New York City sanitation/public-space images **only** as clearly dated/attributed editorial illustrations. They are not evidence of currently open issues and must not imply a specific municipality's present cleanliness.

### 1.3 Navigation and information architecture
Public:
- `/` — editorial homepage, top-level **Quick Report** CTA, **simple search**, relevant public issue highlights.
- `/search?q=` — location results (cities/towns/neighborhoods); results can show coverage status.
- `/places/[slug]` — place profile and eligible public issue feed with data confidence/methodology; **no giant explorer or sliders**.
- `/issues/[publicId]` — individual issue with photos, first reported date, exact/appropriately generalized public location, age, verification, updates, routing, and follow-up.
- `/methodology` — explain eligibility, privacy, report counts and statistical limitations.
- `/privacy`, `/terms`, `/accessibility`, `/safety`.

Private/conditional:
- `/report` — entry point for Quick Report; first presents “Continue as guest” and “Sign in / Create account” **unless already authenticated** (for authenticated users, go straight to report steps). Authentication is optional.
- `/my-reports` — accessible only when authenticated, with reports claimed or submitted by the account.
- `/track/[secureToken]` — guest receipt tracking page; token must be unguessable, revocable, and not exposed to search engines.
- `/auth/callback` — authentication handling.
- `/admin/*` — restricted moderation, jurisdiction source review, routing and audit operations.
- `/agency/*` — later authenticated agency features, disabled until needed.

**Do not put a login CTA as the primary global navigation item.** After login, “My reports” may appear in the navigation. In Quick Report, both pathways must be clear and frictionless.

## 2. Resident user journeys — required behavior

### 2.1 Quick Report, guest pathway
1. User taps/clicks **Quick Report** (header, homepage, or sticky mobile CTA).
2. Entry screen: one primary **Continue as guest** button and one secondary **Sign in / Create an account** option. Include a short assurance that account creation is optional and reports can be saved after submitting.
3. Guest confirms **issue location**: request browser geolocation only on explicit action, with a manual address/place search fallback. Display a map pin, draggable/movable for the precise **issue** position (which may differ from the reporter's position), address/coordinates confirmation and location accuracy guidance.
4. User **takes or uploads one required photo**. On mobile offer camera capture and library upload; validate MIME, byte size, dimensions; handle cancellation and upload retries.
5. User may enter **optional note** (max 500 characters); category is suggested from image, optionally corrected by user, and must not become a mandatory long form.
6. Detect potential duplicate reports within a configurable category/distance/time radius. Explain that adding confirmation to an existing issue avoids duplicate public cases; user may choose an existing issue or proceed to review when appropriate.
7. Submit into private intake. Show an accurate receipt immediately on confirmed server persistence; do **not** claim it is public, routed, or officially acknowledged until those events actually happen.
8. Receipt screen: **Save this report to an account** (prominent) OR **Finish as guest** (equally functional). An account is never required to finish. Guest also gets a secure track/claim link; copying link, sending to an entered email (only if opted in), and a clear “keep this link” notice are appropriate.
9. On guest-to-account conversion, allow secure claim and attach that issue to their profile; do not create a duplicate issue or lose existing timeline. Handle pre-existing accounts and account creation with proper authentication. If the user declines, preserve their receipt token.

### 2.2 Quick Report, authenticated pathway
- When a visitor chooses sign-in inside Quick Report, use secure Supabase Auth (magic link/email OTP, or optional Google provider configured securely). **Do not** implement the prototype's insecure email-only identity simulation.
- Resume the pending report after auth redirect; don't discard unsent photo/note/location.
- Signed-in reports are automatically associated with the account after persistence.
- After submission, show **View in My reports**, not a redundant sign-up flow.
- Browser session persistence until logout or session expiry. Explicit logout.

### 2.3 My Reports
- Show list of the user's own submitted/claimed reports, sorted newest by default.
- Each row: thumbnail if approved, title/category, place, date, current public/private review state, “first reported” age when applicable, agency status and last update.
- Filtering: active, fixed, under review; search own reports.
- Details link to public issue if published; otherwise provide a private owner view with clear privacy-safe status.
- Follow case, notification preferences and unsubscribe.
- Do not expose other reporters' identities or allow unauthorized claims.

### 2.4 Public issue page
Above fold:
- Image(s) that passed privacy review.
- Human-readable issue and location.
- Status labels: **Under review / Open / Agency notified / Acknowledged / Agency closed — not yet verified / Verified fixed / Reopened / Rejected** (display relevant set, not ambiguous “resolved”).
- Prominent accurate **“X days since first reported”** for open cases. Start from earliest accepted non-spam report describing the same physical issue; additional confirmations never reset it.
- When verified fixed, display **“Verified fixed after X days”** and verification date.
- Show reporting/corroboration count in a way that resists vote inflation.
- Timeline of submission, GIS check, moderation, routing, agency response, community verification, closure and reopening with attribution to evidence type (not individual name).

Below fold:
- **“Was this fixed?”** with **Yes, fixed / No, still there**; option to upload fresh evidence.
- A statement that one answer never instantly closes/reopens the case.
- Share public issue permalink.
- Safe reporting instructions (do not enter roads or approach electrical hazards to take photos).

### 2.5 Nearby community checks
- Registered users may opt into occasional “Was this fixed?” verification prompts based on a **privacy-preserving proximity eligibility check**.
- Don't expose users' nearby locations, travel history, identities or the specific reports they previously submitted.
- Limit frequency, require consent, avoid sensitive/private locations, rate-limit abuse.
- A report submitter is eligible for a check-in on their own case; another eligible user may confirm where confidence and safety requirements are met.
- No automatic definitive closure from one vote.

## 3. Simple location search, not an explorer

The latest decision is to **replace the heavy Explore Cleanliness interface** with a **simple search input** prominently visible on the homepage.

### 3.1 Search behavior
- One search field with placeholder like **“Search a city, town or neighborhood”**.
- Autocomplete city/town/neighborhood and disambiguate identical names by state/country.
- Enter submits; suggestions keyboard navigable and accessible.
- Results navigate to the appropriate place profile; don't display fabricated scores in suggestions.
- If an area is not covered, show **“Coverage not yet available”** with a transparent explanation and a way to request coverage; don't show a false zero-issue or an A grade.
- Support area geometry search from authoritative local jurisdiction/administrative boundaries when available; use a documented geocoder provider under appropriate licensing.
- Can support a small interactive issue map within a place profile later, but **no front-page map explorer, no grading-weight sliders, and no neighborhood zoom UI in MVP**.

### 3.2 Public place profile
- Area name/boundary, date last updated, current data coverage and source inventory.
- Published eligible issue count, open vs verified fixed, issue age distribution, agency acknowledged/agency closed/independently verified breakdown.
- Filters by category, date and status; links to individual issues.
- Historical monthly trends only where reliable.
- Transparent metadata and “insufficient data” when necessary.
- A future fixed-methodology cleanliness letter grade may appear only after validated observation sampling, coverage rules, bias checks, and stakeholder review; **no user-adjustable weights and no initial grade based only on raw report counts**.
- Municipal/official performance remains a factual operational display: avoid subjective ranking or judgments about individual officeholders.

## 4. Categories and emergency handling

Initial eligible categories:
- Litter, trash, overflowing **public** bins, illegal dumping on public assets.
- Graffiti on publicly maintained assets.
- Potholes, damaged road surfaces, sidewalk obstacles and public infrastructure.
- Roadkill/animal carcasses on roadways.
- Public park/trail maintenance.
- Signs, drains, lighting and other verified public assets.

Dangerous cases:
- Downed power lines, immediate roadway hazards, fire, injuries or similar emergencies should trigger **“Call 911 / appropriate emergency utility”** guidance; never imply Common is an emergency dispatch service.
- Do not ask the user to move closer to a hazard or take a photograph if unsafe.
- Emergency guidance must be displayed before photo collection when clear from a chosen hazard category or detected text; classification can be supplemented by explicit “Is this an immediate emergency?” gate.

## 5. Geographic/public-responsibility engine

**Hard gate:** Common publishes issues about the condition of shared public infrastructure, **not private homes or neighbors**.

### 5.1 Sources
- Versioned municipality/county assessor parcel boundaries + ownership attributes.
- Public roadway centerlines, verified right-of-way polygons, relevant maintenance authority inventories, public sidewalks, parks and trails.
- City/town/state boundaries, state DOT road ownership/maintenance where applicable.
- Verified local asset managers (including utilities).
- Locally specific maintenance responsibilities and documented exceptions.

### 5.2 Rules
- Distinguish **public access**, **public ownership**, **right-of-way**, and **who must maintain the asset**.
- Where public ROW geometry is absent or uncertain, street centerline proximity alone is **not sufficient** for fully automated publication; send to review.
- A street photo can show something on a neighboring private parcel. User-confirmed pin and image content must correspond to the eligible physical object; do not automatically infer responsibility from the reporter's GPS location.
- Produce one of:
  - `eligible_verified` — authoritative source supports public maintenance obligation.
  - `uncertain_review` — incomplete/conflicting data, possible private ownership or responsibility ambiguity.
  - `ineligible_private` — clearly private or outside scope.
  - `emergency_redirect` — danger requiring immediate separate contact.
- Record data source name, version, timestamp, geometry/feature ID, rule, confidence, and reviewer override reason.
- Public record only after **geographic eligibility + media/privacy moderation** have passed.
- Allow private appeals/requests for correction; reviewer decisions are logged with immutable audit events.
- Roll out municipal GIS support **jurisdiction by jurisdiction**; do not claim nationwide verification at launch.

## 6. Photo moderation, duplicates, abuse resistance

### 6.1 Private first
- Save original images to a private storage bucket. Never distribute direct unrestricted original URLs.
- Strip geolocation EXIF from public derivatives, blur faces/license plates/identifying text, screen for hateful/abusive material or targeted content, and optionally crop sensitive private property context.
- AI assists classification and moderation, with human review for uncertainty or appeal. Keep classifier model and confidence information internally.
- Public images are separately approved/processed derivatives, not client-supplied originals.

### 6.2 Anti-targeting and integrity
- Reject targeted neighbor complaints, personally identifying allegations, speculation about private individuals, household images where context is not public infrastructure.
- Rate limits by anonymous session, account, IP/network where lawful, and abuse fingerprint; CAPTCHA or adaptive friction for suspicious volume.
- Report clustering by spatiotemporal proximity, image perceptual similarity and category; independent supporting reports contribute to corroboration but **not to new issue age**.
- Record moderation reasons and support appeals without showing private allegations publicly.
- Prevent bot-generated confirmation floods and vote brigading.
- Allow notification to verified agency contacts with correction/response mechanism, not powers to edit/hide independent records.

## 7. Issue lifecycle, time calculations and “Was this fixed?”

### 7.1 Event-sourced timeline
Model issue as durable case, reports as submissions/corroborations, and events as append-only history. Core events:
`intake_created`, `geo_verified`, `moderation_approved`, `published`, `duplicate_linked`, `routing_queued`, `agency_delivery_confirmed`, `agency_acknowledged`, `agency_status_updated`, `agency_closed`, `community_check_submitted`, `resolution_evidence_reviewed`, `independently_verified_fixed`, `reopened`, `rejected`, `appeal_submitted`.

Separate:
- `publication_status`
- `maintenance_status`
- `agency_status`
- `verification_status`
- `routing_delivery_status`

### 7.2 Age
- `first_reported_at` = earliest accepted report identifying the same physical issue, UTC.
- When open, age derives from `now() - first_reported_at` (humanized as days/hours).
- When verified fixed, `verified_fixed_at - first_reported_at` is the **total elapsed time to verified resolution**.
- If reopened, retain original first-reported record **and** display current reopened interval; historical timelines cannot be overwritten.
- Use actual timestamps, account for timezone in display.

### 7.3 Community verification
- Yes/No feedback can include a fresh photo, timestamp and location confirmation.
- One answer never definitively changes case resolution; system produces pending evidence reviewed by defined rules/humans.
- Store verifier credentials/eligibility privately; protect against repeat votes.
- Agency status and independently verified status may disagree visibly.
- Record why a resolution was confirmed or disputed.

## 8. Routing to municipalities

Routing is asynchronous and verifiable:
- Use an **authorized Open311 GeoReport v2** adapter when the local agency supports it.
- Otherwise use verified agency reporting interfaces or approved messaging channels.
- Record exact destination, method, payload hash/reference, attempt timestamp, delivery result, agency service ID, acknowledgment and retries.
- Never label as “sent” on merely queuing, and never label as “acknowledged” on delivery alone.
- Unsupported jurisdiction: clearly show **“Agency routing unavailable”** and maintain public report privately/moderated as appropriate; do not invent an agency connection.
- Backoff/retry, per-agency config, health checks, dead-letter queue and manual routing dashboard.
- Avoid mass-blasting officials or targeting named persons.

## 9. Accounts, guest identity and secure claiming

### 9.1 Production auth
- Supabase Auth with email OTP/magic link and/or configured Google OAuth.
- Proper session rotation, secure cookies, CSRF protections, rate limits and verified redirect URLs.
- RLS must enforce that a reporter sees only their own private submissions and tracking settings.
- Avoid guest identity by IP address; IP is not stable account identification and can create privacy problems.

### 9.2 Anonymous receipt/claim
- After successful intake, issue an opaque random high-entropy tracking/claim token.
- Store **hash** of token, expiry/rotation status, claim ownership, and audit event; never store token in plaintext or expose it in analytics/SEO.
- After a guest authenticates, claim transaction verifies token, binds submission to user atomically and invalidates/restricts token to prevent takeover.
- Provide secure claim by entering/pasting link for later account sign-up.
- If guest report duplicates an existing issue, ownership is of their **submission**, not the public aggregate case.
- Users may opt into email updates; explicit opt-in and unsubscribe.
- Demo browser localStorage identity from v7 must be removed in production.

## 10. Recommended tech stack

Use **Vite + React + TypeScript + Tailwind**, a consistent accessible component system, **Supabase PostgreSQL/PostGIS/Auth/Storage/Edge Functions**, MapLibre (only where the actual map is useful), background workers/queues or Supabase scheduled jobs, and Playwright/Vitest.

- Provision a **brand-new, separate** GitHub repository named `common` or `openbeta-common` under the user-authorized GitHub owner (inspect ownership and collision first). Do not use or modify an existing Open Beta repository.
- Provision a **brand-new dedicated Supabase project** and PostgreSQL database for Common; do not reuse any database from another Open Beta app. Obtain explicit user approval for project region, plan and potential charges before creation if not already authorized.
- Deploy the frontend with **GitHub Pages** on the user-owned **`ourcommon.co`** GoDaddy domain, after verifying domain ownership and DNS state. Build and deployment must work without a Node server. Server operations must live in Supabase Edge Functions / governed database functions. Use a GitHub Actions deployment workflow and preserve existing DNS services.
- Supply `.env.example`, secrets guide, migrations, seed only **clearly labeled demo fixtures**, CI scripts, README and operational runbook.
- Avoid embedding third-party geocoder/map credentials in source, except safe public keys with provider-approved restrictions.

## 11. Proposed relational schema

Build SQL migrations, indexes, grants and RLS for at least:

| Table | Representative columns / notes |
|---|---|
| `profiles` | `user_id` PK FK auth.users, notification prefs, created_at |
| `jurisdictions` | id, name, slug, type, polygon geography, jurisdiction parent, coverage status |
| `gis_sources` | id, jurisdiction_id, type, authority, source URL, version, timestamp, license, freshness |
| `gis_features` | id, source_id, asset type, geography indexed, owner/maintainer metadata, validity |
| `agency_destinations` | jurisdiction_id, category, adapter, destination, capability, verified_at, enabled |
| `submissions` | id, reporter_user_id nullable, guest receipt token hash ref, location point, note private, category suggestion, state, submitted_at |
| `submission_media` | id, submission_id, original private path, processed approved path, moderation status, metadata |
| `issues` | id, public_id, canonical location, category, first_reported_at, publication/maintenance/verification statuses, published_at, verified_fixed_at |
| `issue_submissions` | issue_id, submission_id, relationship (initial/corroboration/duplicate) |
| `issue_events` | id, issue_id, event type, actor type/id restricted, event time, evidence refs, metadata |
| `geo_decisions` | submission_id, decision enum, source IDs, confidence, reviewer, reason, created_at |
| `moderation_cases` | submission_id/media_id, decision, flags, reviewer, audit and appeal state |
| `routing_attempts` | issue_id, agency destination, adapter, delivery/ack timestamps, external service id, errors, retry |
| `community_checks` | issue_id, account/anonymous protected verifier, yes/no, optional media, eligibility and moderation state |
| `report_claim_tokens` | submission_id, token hash, expiration, claimed_by, claimed_at, revoked_at |
| `notifications` | user_id/guest consent channel, template, reason, delivery state, unsubscribed |
| `place_metrics_snapshots` | jurisdiction_id, period, numerators, denominators, source coverage, methodology version, data freshness |
| `admin_audit_log` | actor, action, object, old/new references, timestamp, immutable |

**Schema rules:**
- Enable PostGIS and GIST spatial indexes for issue points/boundaries/assets.
- Index public issues by place, category, status and first_reported_at.
- Keep original photo paths and private submission notes invisible to public SELECT policies.
- Keep moderation state, claim token hashes, private verifier identities and delivery credentials server-only.
- Provide foreign keys, constraints, enums/checks, timestamps with timezone, and explicit deletion/retention policy.
- Data model must support multiple submissions mapping to a single issue, case reopens and multiple jurisdictions/agencies where justified.

## 12. API / application services

**Deployment override:** the application runs on GitHub Pages, so these are **conceptual API contracts implemented as Supabase Edge Functions and authorized Supabase Data API access**, NOT Next.js request handlers or server actions. The browser calls HTTPS Supabase endpoints and never handles privileged keys.

Implement typed endpoints/Edge Functions with request validation, authorization and structured errors:
- `GET /api/places/search?q=`
- `GET /api/places/[slug]`
- `GET /api/places/[slug]/issues`
- `GET /api/issues/[publicId]`
- `GET /api/issues/[publicId]/events`
- `POST /api/report/intake` — authenticated or guest, idempotent, private
- `POST /api/report/[submissionId]/media` — secure staged image upload
- `POST /api/report/[submissionId]/submit` — finalize and queue review
- `GET /api/track/[token]` — private guest status with rate limits
- `POST /api/report/claim` — securely bind guest to account
- `GET /api/me/reports` — authenticated only
- `POST /api/issues/[publicId]/community-check` — verification candidate
- Admin endpoints for moderation, source verification, routing, review appeals and audit retrieval.

Treat these as **recommended contracts**; Codex can refine paths if documented and covered by integration tests.

## 13. Public statistics / future cleanliness measurement

- Search/location profiles should expose **actual** data where coverage is established; otherwise show `Not enough verified data`.
- Distinguish:
  1. `published_reports_count`: reported conditions, not an objective cleanliness census.
  2. `open_cases_count`: deduplicated public cases.
  3. `median_age_open`: time since first reported for open cases.
  4. `agency_delivery_rate`: verified delivery only.
  5. `acknowledgment_time`: submission/delivery to observed acknowledgment, where present.
  6. `verified_resolution_time`: elapsed to independently verified fix; separately show agency closure time.
  7. `coverage`: geographic/source and reporter penetration limitations.
- No “A–F cleanliness grade” in MVP and no scoring sliders. For future validated letter grades, define a fixed published methodology that accounts for report density, opportunity to report, severity, road mileage, public space area, sampling and data sufficiency. Do not give a clean grade to a location with few users.
- Do not attach evaluative political grades, personal assessments, or rankings of officials to this product. Provide factual operational statistics about maintenance systems.

## 14. UX copy and content requirements

Recommended homepage:
- Hero: **“A better street starts with someone noticing.”**
- Supporting: **“See trash, potholes or damaged public spaces? Take a photo, make it visible, and follow what happens next.”**
- CTA **“Quick Report”**
- Search field **“Search a city, town or neighborhood”**
- Issue feed: title, category, “X days since first reported,” number of independent supporting reports, real status.
- Process: “Spot it → Report it → Follow the fix.”
- Community positioning: **“Good neighbors. Better streets.”**
- Avoid slogans implying “officials are failing” or unsourced claims about a city; transparency and evidence are the accountability mechanism.

### NYC images
Use legitimately licensed/attributed, dated photography to illustrate public-space sanitation problems. Keep editorial images **outside** the live issue database and explicitly label them historical or illustrative. Prefer original/Commons images that satisfy license terms; preserve photographer, source, publication date and license URL metadata. Never claim they depict a current problem unless real evidence supports that claim.

## 15. Admin operations

Build a private admin console with:
- Incoming review queue: geographic status, image/AI flags, potential duplicates, moderator actions with reason.
- Jurisdiction source coverage, data freshness, conflicting owner/maintainer facts, GIS corrections.
- Routing queue / retry history / agency endpoints.
- Community “fixed?” review queue and evidence history.
- Abuse flags, rate-limit review, appeals and correction process.
- Public metrics publication review, coverage thresholds and data lineage.
- Role based access (`moderator`, `gis_admin`, `routing_admin`, `super_admin`), least privilege and audit logs.

## 16. Security and privacy invariants

Must pass before real deployment:
- RLS on every relevant Supabase table; client cannot read private intake, unapproved media, guest tokens, other users' report list, moderator notes or routing secrets.
- Private Storage buckets plus server-issued short-lived signed URLs only where justified.
- Server-side validation of point geometry, media MIME and size, note text, category, token, and identity. Antivirus/content checks as feasible.
- Strict output encoding; prevent XSS, SQL injection, SSRF from image URLs, IDOR and access bypass.
- Rate-limit intake, guest tracking, account login, claim, geocoding, and community checks.
- Privacy-preserving observability: no raw precise visitor location, claim token, or email in generic analytics.
- Safe handling of geolocation permissions and declined camera access.
- Define retention and deletion of rejected/private submissions, original images and logs.
- All public pages/caches and search indexing exclude unapproved material and tracking routes.
- Clear distinction that this is not an emergency service.

## 17. Build sequence — Codex must execute incrementally

### Phase 0 — Repo, separate Supabase project, and design system
- Inspect available GitHub/repo and Supabase settings first; create a brand-new dedicated GitHub repository and dedicated Supabase project/database, never overwrite unrelated Open Beta properties.
- Set up the GitHub Pages build workflow with production custom domain `ourcommon.co` and a staging preview approach.
- Create dedicated app, configuration, CI, formatting and typed design tokens.
- Implement approved Concept A brand assets *exactly as provided*, nav, responsive homepage, search area, Quick Report entry UI, and accessible components.
- Verify mobile and desktop against prototype reference; remove fake functioning claims.

**Gate:** Visually approved prototype parity, stable local startup, no broken route or import.

### Phase 1 — Massachusetts directory, real authentication and guest-first Quick Report
- Load and validate all 351 Massachusetts city/town records from official MassGIS source before claiming the directory is complete; enable fast public search by official name and supported aliases.
- Production Supabase Auth with account association and session persistence.
- Location/drag pin, camera/file upload, optional note and consent.
- Private intake and secure media storage, durable submission/receipt, secure guest tracking and post-submit claim.
- My Reports for saved/authored issues.
- Explicit issue receipt state; no unmoderated publication.

**Gate:** Guest can submit real intake and finish; can later securely claim it. Registered user can sign in and see saved own reports. Another user cannot.

### Phase 2 — GIS verification, moderation and public issue pages
- Versioned GIS ingestion for initial pilot jurisdiction(s).
- Eligibility engine with hold/reject/approve states and reviewer controls.
- Blur/strip/examine media; duplicate correlation.
- Publish eligible issues only, with real age clock, status, public timeline and proof of decision.
- Appeals and source audit.

**Gate:** Private parcel reports and unreviewed photos cannot leak, even by direct URL or API. First-reported time survives duplicates and reopens.

### Phase 3 — Official routing, follow-up, public profiles
- Verified Open311/agency adapter and delivery status.
- Community yes/no verification workflow, evidence reviews and audit.
- Location search backed by true geographies and coverage metadata.
- Public municipal profiles with sourced, transparent metrics and no fabricated grades.
- Notification opt-in, failed message handling and operational monitoring.

**Gate:** External delivery/agency acknowledgment/independent resolution appear as separate truthful states. Search finds supported places; unsupported places show coverage notices.

### Phase 4 — Hardening and rollout
- Usability/mobile accessibility QA, real-world data freshness tests, image provenance checks.
- Security penetration-oriented cases, RLS tests, performance, backups, data repair, incident response.
- Staging and production deployment playbook; domain/DNS only with permission.
- Operate controlled pilot before expanding jurisdictions.

## 18. UAT / acceptance tests

| ID | Given / When | Then |
|---|---|---|
| QR-01 | Anonymous opens Quick Report | Can choose Continue as guest, without forced login |
| QR-02 | Guest chooses Continue as guest | Can complete location → photo → optional note |
| QR-03 | Geolocation denied | Manual pin/address path works |
| QR-04 | Photo omitted | Cannot submit ordinary Quick Report; accessible message |
| QR-05 | Guest submission persists | Receipt and unguessable tracking link created; no false publication claim |
| QR-06 | Guest chooses Finish as guest | Flow completes without account |
| QR-07 | Guest chooses Save to account after reporting | Secure auth + atomic claim associates prior submission once |
| QR-08 | Already signed-in user starts Quick Report | No redundant guest/auth prompt; save automatically |
| AUTH-01 | User visits homepage | No forced login popup or persistent sign-up gate |
| AUTH-02 | Signed-in user opens My Reports | Sees only their own/claimed submissions |
| AUTH-03 | Other account guesses submission ID | RLS blocks access |
| SEARCH-01 | User searches “Brooklyn” | Appropriate disambiguated place result appears |
| SEARCH-02 | Unsupported place searched | Clear “Coverage not yet available,” not fake zero or A grade |
| SEARCH-03 | Search with keyboard / screen reader | Works predictably and accessibly |
| GIS-01 | Pin on clearly private residential property | Never automatically publicly published |
| GIS-02 | Right-of-way uncertain | Held for human review |
| GIS-03 | Publicly owned yet privately maintained asset | Responsibility verified or review, no ownership shortcut |
| MEDIA-01 | Unmoderated original image URL requested | Access denied |
| MEDIA-02 | Photo includes identifiable bystanders | Approved derivative redacted before publication |
| DEDUP-01 | Two reports same eligible issue | One public case, two corroborations, stable first report date |
| AGE-01 | Issue open 18 days | Correct “18 days since first reported” display |
| AGE-02 | Agency says closed without independent evidence | Displays agency closed, NOT verified fixed |
| FIX-01 | One community participant says fixed | Creates pending check, does not auto-close |
| FIX-02 | Verified evidence confirms fix | Records verified time, elapsed days and event provenance |
| REOPEN-01 | Verified issue reopens | Historical age and both resolution cycles retained |
| ROUTE-01 | Adapter queued then fails | UI never claims agency notified |
| ROUTE-02 | Agency endpoint acknowledges | Records true external acknowledgment |
| STATS-01 | Area has inadequate coverage | Suppresses misleading grades and marks insufficient data |
| NYC-01 | Historical NYC image appears on homepage | Date/credit/license shown, not represented as a current report |
| MOBILE-01 | iOS Safari and Android Chrome report flows | Responsive, camera fallback, accessible and error-tolerant |
| SEC-01 | Token shared or leaked to analytics | No token appears in analytics/logging; token can be revoked |
| SEC-02 | No logged-in session on protected endpoint | Authorization fails securely |

Automate as many as possible with Vitest/integration tests, SQL/RLS tests, and Playwright browser tests. Record unautomated manual GIS and accessibility checks.

## 19. Deliverables Codex must produce

1. Full GitHub Pages-compatible Vite/React/TypeScript static frontend with reusable UI and approved brand.
2. Supabase migrations, RLS policies, storage bucket configuration, sample GIS loader + refresh process.
3. Auth, guest receipts, account claiming, report submission and My Reports.
4. Moderation, GIS decisions, public case timeline, community checks, and agency routing adapters.
5. Real simple place search and data coverage/error states.
6. Automated test suite, CI, seed fixtures clearly marked as demo, README and local startup guide.
7. Staging deployment process, operational security/deployment checklist, runbook.
8. Concise change log and honest list of unfinished items, blockers, credentials or approvals needed.

## 20. Exact Codex kickoff prompt

> Build Common as the production-oriented Open Beta civic issue reporting web app defined in this specification. First inspect the repository and attached approved Concept A branding and `common_v7_search_guest_accounts.html`. The latest approved UX is a simple place search plus guest-first Quick Report; do not rebuild the discarded cleanliness explorer or require sign-in. Implement Phase 0 and Phase 1 end-to-end before proceeding to later phases. Use GitHub Pages-compatible Vite/React/TypeScript and Supabase Auth/Postgres/PostGIS/Storage/Edge Functions with strict RLS, durable private guest submissions, secure claim tokens, My Reports, and testable responsive UI. Treat all city data and imagery as provisional until sourced. Never publish private/unmoderated intake or make fictitious claims of routing, verification, or municipal performance. Run tests and report exactly what works, what is simulated, what remains, and any permissions/secrets required. Do not modify unrelated Open Beta applications or deploy to production without approval.

---
**Implementation precedence:** This spec, including the v3.0 deployment and municipality appendix, > approved v7 UI behavior > earlier Common requirements > developer defaults. Maintain traceability for exceptions and never silently replace documented trust/privacy rules.


---

# 21. MASSACHUSETTS MUNICIPALITY DIRECTORY — REQUIRED INITIAL DATASET

**New requirement:** On launch, Common must have a real, prepopulated, searchable directory of **all 351 Massachusetts municipalities** (50 cities, 301 towns), even if no residents have filed reports. Directory coverage is not the same as eligibility verification or official routing coverage. MassGIS is the authority for initial seed data.

**Authoritative sources (retrieve from origin, inspect actual file fields, and record downloaded version):**
- MassGIS Municipalities: https://www.mass.gov/info-details/massgis-data-municipalities
- MassGIS Massachusetts Community Names Lookup Table: https://www.mass.gov/info-details/massgis-data-massachusetts-community-names-lookup-table
- MassGIS data catalog: https://www.mass.gov/info-details/massgis-data-layers

## 21.1 Data import and provenance
1. Create a reproducible `scripts/import-massgis` pipeline (Python, ogr2ogr, Node, or SQL as appropriate) that downloads or imports the official municipal geodata. Do **not** manually invent 351 names, IDs, city/town status or geometries.
2. Inspect dataset field names and classifications before mapping; persist original source identifiers, normalized display names, county where supported, city/town designation, GIS geometry and original source provenance. Normalize geometry to WGS84 (EPSG:4326) for browser search and PostGIS query while preserving original CRS metadata. Validate and repair only documented invalid geometry; do not silently alter boundaries.
3. Create stable, URL-safe slugs. Disambiguate duplicates using state/official ID; do not use municipality display name as sole primary key. Support Unicode, punctuation, historical name changes and deprecations.
4. Import town neighborhoods/villages and name variants as **separate aliases** with source/parent municipality linkage; aliases must never be treated as independent municipalities. Add common user search phrases only where grounded in a source or curated/approved list.
5. Preserve source URL, retrieved_at, source last-modified/version, license/terms, import batch, checksum, and record counts. Provide a refresh command and documented dry run/diff option. Make the import **idempotent** (upsert by official ID; no duplicate municipalities or alias drift).
6. Fail the import with a clear diagnostic if official unique municipalities are not exactly 351 or if geometries/IDs cannot be validated. Record unmatched community aliases for human review rather than fabricating parent assignments.
7. **Do not claim database seeded until tests actually query all 351 records in the new Supabase project.**

## 21.2 Directory schema requirements
Extend the core `jurisdictions` table or add a normalized `municipalities` table with:
- `id` UUID PK; `state_code` (`MA`), `official_state_id` unique within state, `name`, `slug`, `municipality_type`, `county` when authoritative, `boundary` PostGIS MultiPolygon/geometry with GiST index; `data_source_id`, `source_version`, `imported_at`, `updated_at`.
- `place_aliases`: `id`, `municipality_id`, `alias`, `alias_normalized`, `alias_type` (`neighborhood`/`village`/`alternate`/`historic`), `source_id`, `review_status`.
- `coverage`: independent flags `directory_loaded`, `public_reporting_enabled`, `gis_responsibility_ready`, `agency_routing_ready`, `metrics_sufficient`, `last_verified_at`; no false implication that directory availability means full service availability.
- Search indexes for trigram (`pg_trgm`) / full-text or comparable typo-tolerant matching. Public lookup should be optimized for typeahead and return disambiguated labels (e.g., `Arlington, MA · Middlesex County`).
- Public RLS `SELECT` on safe directory rows and approved aliases; editing/import only from privileged backend role, never client code.

## 21.3 Search UX and behavior
- One simple, prominent homepage input: **“Search a city, town or neighborhood”**, not a big map explorer.
- A matching municipality opens `/places/[slug]`; a neighborhood alias opens the linked parent municipality and may display the neighborhood name as context. Do not silently claim it has an independently calculated grade.
- Query is case/diacritic-insensitive with fast autocomplete; keyboard navigation; zero-results states; search by alias and official name.
- Every municipality has a precreated or lazily resolved public profile even with zero reported cases. Display **“No Common reports yet”** and **“Insufficient information to assess cleanliness”** as appropriate, not “clean”/A grade. Show a separate status if GIS intake or agency integration is not yet supported.
- Do not bulk-import 351 profiles as hard-coded HTML or static routes; resolve place data on client from Supabase using stable slugs and GitHub Pages-safe routing.

## 21.4 Massachusetts acceptance tests
- SQL queries establish **exactly 351** distinct official MA municipality IDs and **no duplicate** `(state_code, official_state_id)` pairs.
- Geometry is non-null, valid, appropriately typed and retrievable for each row (flag edge cases for review).
- Known municipalities including Arlington, Cambridge, Boston, Springfield and Worcester return correct official objects.
- Known alias searches (e.g., East Arlington, Jamaica Plain) resolve to the correct parent only when the MassGIS alias dataset or documented curated list supports them; no invented alias assertions.
- Re-import changes zero row counts for unchanged authoritative data; version/update logic is tested.
- For newly seeded places with no issues, interface says zero reports/insufficient evidence rather than a cleanliness grade.
- Coverage readiness fields are independently configurable and correctly displayed.

# 22. CREATE NEW GITHUB REPOSITORY + NEW SUPABASE PROJECT

**Explicit user instruction:** Common must be a **new and independently managed** Open Beta application, with its own GitHub repository and new Supabase project/database. Production frontend must live on **GitHub Pages** at **https://ourcommon.co** (GoDaddy registrar/DNS provider). Do not reuse the existing project or database of another app.

## 22.1 Repository provisioning
1. Using the **authorized GitHub integration**, inspect which GitHub account/organization the user can create repositories under; confirm repository name availability. Prefer `common` or `openbeta-common` as a new repo. Do not modify an existing same-named repo; request an alternate name if conflict.
2. Create the new repo (visibility based on user's preference and Pages/plan capabilities; don't assume a private repo is supported for free Pages hosting). Initialize README, `.gitignore`, license decision, application source, GitHub Actions workflow, migrations, configuration, tests and asset files.
3. Use `main` as deploy source, protect it where possible, ensure GitHub Pages Actions deployment permissions are scoped, and publish source via CI only after build/test success.
4. GitHub Pages **deployments** must use the repository's Pages Actions publishing mechanism, not GitHub repository raw-file URLs. GitHub Pages is static hosting: there is **no** always-on Node server, API Routes, Next.js Server Actions, secret backend process, or automatic server-side routing.
5. Create `.github/workflows/deploy-pages.yml` that builds Vite static assets (`npm ci && npm run test && npm run build`) and publishes `dist/` through `actions/upload-pages-artifact` and `actions/deploy-pages`. Set `permissions: contents: read; pages: write; id-token: write`, appropriate environment concurrency and branch rules. Commit lockfiles and pin dependencies/action versions to trustworthy maintained releases.
6. The build must support **root-level custom domain** `ourcommon.co`, with correct root asset URLs and browser refresh/deep-link behavior. Prefer static-site-safe React routing using hash routes for dynamic `/issues/:id` and `/places/:slug`, or a tested alternative for Pages' lack of rewrite rules. If hash routes are chosen, the public URLs become `/#/issues/:id` etc.; document this and the future upgrade path for crawlable clean URLs. Use actual static `/report/`, `/privacy/` pages only if built as concrete HTML outputs. **Do not promise clean client-side routes will refresh correctly on GitHub Pages without implementing a fallback.**
7. Confirm built asset references and images work on `https://ourcommon.co/` with no path-prefix errors.

## 22.2 Supabase provisioning
1. Using the **authorized Supabase integration** or approved CLI flow, create a **new project named `common` / `openbeta-common`** under the correct user organization. Select an appropriate region near the pilot market, subject to user approval and available plans. **If project creation would incur charges, require the user's approval before committing to a paid plan.**
2. The new project includes a new PostgreSQL database and must be isolated from all other apps. Record the new project reference URL and public publishable key in environment config; do not expose service keys.
3. Enable/setup `postgis`, `pg_trgm` and other required extensions based on the new project's supported environment. Commit migration files for tables, indexes, RLS, storage policies and privileged role boundaries. Validate policies with SQL tests for anon and user roles.
4. Create private buckets for original images and limited public approved derivatives; use signed limited uploads and server-side moderation workflows. Configure Supabase Auth (email OTP/magic link, optional Google OAuth) with **site URL `https://ourcommon.co`** and precise allowed redirect URLs that match actual SPA callback routes. Do not rely on a Node-based `/auth/callback` server path.
5. Use **Supabase Edge Functions** for privileged flows: intake/validation, anonymous guest claim tokens, image transformation/moderation coordination, GIS checks, agency routing, webhook signature verification, scheduled jobs and secure auditing. Store privileged keys and provider credentials solely as **Supabase function secrets** or approved protected environment secrets; never in GitHub Pages JavaScript or publicly build-time exposed values.
6. Frontend uses only safe Supabase project URL and **publishable key**. Enforce strict RLS and bucket policies; never assume client-side route protection is sufficient. Use browser-side auth PKCE-compatible flows and verify redirect/deep-link behavior on Pages.
7. Apply Massachusetts geodata migration and seed from §21. Verify in **new project's actual DB** that all 351 official municipalities are imported.
8. Store app environment keys in GitHub Actions variables/secrets appropriately, keeping in mind anything compiled into `dist/` is public. Avoid writing production tokens into logs.
9. Register separate production and staging environment settings; preview can use a non-production project or isolated staging schema with access control. Do not seed fake operational statistics in production.

## 22.3 GitHub Pages custom domain and GoDaddy DNS
**Target:** `ourcommon.co` (apex canonical) with `www.ourcommon.co` redirected to apex, HTTPS enabled.

Codex must:
1. Verify the domain is owned by and accessible to the user in GoDaddy and **inspect the current DNS zone**; avoid overriding mail/MX/TXT/SPF/DKIM/other unrelated records.
2. Verify domain ownership in GitHub settings where supported and **set the GitHub Pages custom domain before changing DNS**, to avoid subdomain takeover risk.
3. Ensure the published build includes a root-level `CNAME` file containing exactly `ourcommon.co` (for GitHub Pages workflows, copy `public/CNAME` into `dist/CNAME`; or configure custom domain in Pages settings as applicable).
4. Set GoDaddy **A records at `@`** to GitHub Pages IPv4 addresses (check current GitHub docs before changes):

   ```text
   @  A  185.199.108.153
   @  A  185.199.109.153
   @  A  185.199.110.153
   @  A  185.199.111.153
   ```

5. Add **`www` CNAME -> `<GITHUB_OWNER>.github.io`** based on the actual repository owner (do not invent the owner). Configure canonical domain in Pages and test www-to-apex redirect. Optional apex AAAA records only after checking current GitHub Docs and avoiding conflicts.
6. Check for conflicting apex A/AAAA/ALIAS and www records before adding/removing anything; preserve unrelated DNS and confirm potentially destructive changes. Never point DNS to a nonexistent Pages site.
7. Wait until DNS resolves and GitHub certificate provision completes; enable **Enforce HTTPS** once offered. Verify TLS for apex and www, correct redirect, static assets, route reload, logins/redirects, geolocation permission, uploads and reporting receipt.
8. If GoDaddy cannot be modified through authorized tools, generate an exact copy-paste DNS change table and clearly mark **manual actions still required**; never claim live deployment without actual DNS and HTTPS evidence.

Useful official references:
- GitHub Pages custom domains: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- GitHub Pages HTTPS and IPs: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- Supabase Auth architecture: https://supabase.com/docs/guides/auth/architecture
- Next.js static export restrictions (if developer proposes Next): https://nextjs.org/docs/app/guides/static-exports

## 22.4 Definition of deployed
**Deployment is NOT considered complete just because code has been pushed.** Complete only when:
- New GitHub repo exists with a passing test/build/deploy workflow.
- New Supabase project exists, independent of other Open Beta applications, and all migrations are applied.
- Official MassGIS import validated **351** searchable municipalities and correct coverage indicators.
- `ourcommon.co` resolves to the Common Pages build, with working HTTPS, root assets, and domain redirects.
- A real anonymous intake safely persists in the new Supabase project; user can finish as guest and optionally securely claim it through Auth; My Reports works with proper RLS.
- Privileged APIs exist only in Supabase backend services, never as exposed code/secrets on GitHub Pages.
- Independent testing of direct issue/place routes, authentication callback, image upload, privacy/storage security, mobile layout and failures passes.
- Codex provides the actual repo URL, Supabase project reference, public deployment URL, deployment workflow run, DNS outcome, test results and honest list of unfinished capabilities.

# 23. REVISED EXECUTION PROMPT FOR CODEX — COPY DIRECTLY

> Build and deploy **Common**, a new Open Beta civic-reporting web application, following this entire v3.0 master specification. You are authorized to prepare the infrastructure workflow, and should **create a brand-new, separate GitHub repository and new Supabase project/database** using connected accounts and approved actions, not modify other Open Beta projects. Host the production **static React/Vite/TypeScript frontend on GitHub Pages** at the existing GoDaddy domain **`ourcommon.co`**, with GitHub Actions deployment and correct DNS, domain verification and HTTPS. Put all backend operations, secure image intake, GIS checks, guest claim/auth, municipal routing and moderation in Supabase Postgres/PostGIS/RLS/Storage/Edge Functions; GitHub Pages cannot run Next.js server routes or private backend services. First seed a reproducible, official MassGIS directory of **all 351 MA cities and towns** with a typo-tolerant name/alias search. Directory availability must remain distinct from actual GIS/routing/report coverage. Preserve the approved Concept A brand and v7 guest-first Quick Report flow: optional sign-in only when Quick Report opens, location → required photo → optional note, then guest completion or optional account save; maintain issue history, first-reported age and community fix checks. Use simple homepage municipality search instead of the discarded explorer. Build incrementally, test for privacy/security, and never fabricate reports/grades/official acknowledgments. Before paid project provisioning or destructive DNS edits, request approval as required. Validate real deployment and tell me exactly what works, what is staged, and any remaining permissions/steps. Do not claim deployment success without confirming public `https://ourcommon.co` accessibility and functioning backend.
