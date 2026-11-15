# Public places, hazards, and responsible-agency routing

## Available in this update

Reporters can identify a street/sidewalk, park/trail/playground, airport/public terminal, train/subway/bus station, public building/plaza, public waterfront/beach, or other/unsure public place. The selected type prefixes the existing private place description when submitted, keeping it available in private receipts and reviewer records without exposing precise private coordinates. It is reporter-provided context, not proof of ownership, jurisdiction, or permission to enter a site. The directory still covers Massachusetts municipalities; this update does not add a searchable national facility directory.

Issue categories now include Stinging insects / nests and Other non-emergency safety hazard in both client and Edge Function validation. A normal nest observation remains eligible for intake review; immediate danger, injury, and serious reaction wording are diverted from ordinary intake. Server checks are aligned with client checks. Photos are still required and must be taken from a safe public-access position; a reporter must not approach a hazard to obtain one.

Homepage photos show Boston Common (2012), a New York sidewalk (2017), and Chicago bins (2017), with Common-branded interactive category overlays. Starting from an example presets the selected category and place type while preserving a saved draft/photo. The historical photos are not represented as current incidents or evidence of jurisdiction. Small attribution and license links sit beneath each photo; see PHOTO_CREDITS.md.

## Agency delivery goal and current limitation

No email, 311 ticket, or message is sent to an agency in this update. Directory membership and a reporter-selected facility type are insufficient to identify the legally responsible operator. Airport and transit properties may be managed by authorities rather than their containing municipality. Existing publication/privacy review and coverage gates remain in force.

The next delivery phase should verify service-area GIS, facility/operator responsibility, category-specific agency destinations, and an approved delivery integration/contact. Store delivery attempts and receipts separately from intake acceptance, agency acknowledgment, closure, and independently verified fixes. Retry delivery idempotently, label unsupported destinations clearly, and keep original photos/private reporter details out of public payloads. Existing agency/service-area and routing-attempt structures can support this, but real contacts/integrations must be configured and validated first.

## Validation

TypeScript, Vite production build, 18 unit tests, and 24 desktop/mobile browser checks passed. Intake Edge Function deployed with existing independent authentication and guest capability behavior unchanged. Live validation confirmed new categories reach photo validation and a severe-allergic-reaction case reaches the emergency gate. All live test requests used deliberately invalid photo types and stopped before any submission/photo creation. Rate-limit counters were exercised normally.

Safety references: https://www.nyc.gov/site/doh/health/health-topics/bees.page and https://www.cdc.gov/niosh/outdoor-workers/about/insects-and-scorpions.html .
