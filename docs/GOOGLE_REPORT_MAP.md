# Google Maps for Quick Report

Quick Report now requests device location when the reporter selects No immediate emergency, provided the draft does not already have a location. The Use my location button retries a fresh, high-accuracy GPS reading. The browser retains control of permission. The form shows estimated accuracy, handles denial/unavailable/timeout, and keeps manual location entry available. A late GPS response cannot overwrite manually edited coordinates or update a draft after leaving the location step.

Google Maps replaces the Quick Report Leaflet map, using a draggable Advanced Marker and map-click coordinate selection. Street/satellite map types, zoom, and fullscreen controls are available. Map errors leave device/manual coordinates usable. City issue maps retain their current provider.

## Required production configuration

1. In Google Cloud, enable billing and Maps JavaScript API for your project.
2. Create a browser API key. Restrict its API access to Maps JavaScript API and its website referrers to https://ourcommon.co/* and https://www.ourcommon.co/*. Add localhost referrers only if needed for local testing.
3. Add the key to the existing GitHub repository Actions secret named GOOGLE_MAPS_API_KEY: https://github.com/jrschwab15-netizen/common/settings/secrets/actions
4. Optionally set the repository Actions variable GOOGLE_MAPS_MAP_ID to your JavaScript map ID. The default DEMO_MAP_ID supports Advanced Markers without custom styling.
5. Rebuild and dispatch the existing Pages workflow. The workflow maps the secret into VITE_GOOGLE_MAPS_API_KEY; this browser key is included in the public frontend, so Google restrictions are essential. No server/service-account credential belongs here.

Local environment names are documented in .env.example. Do not commit real keys. The script loader explicitly sends only an origin referrer for restricted-key validation. Location is requested after the safety action, never on the public homepage.

## Verification

TypeScript, Vite build, 11 unit tests, and 22 desktop/mobile browser tests passed. New tests cover browser geolocation with synthetic coordinates, accuracy display, denied permissions, manual edits, and the Google map event bridge with a local API mock. Actual Google tiles, API-key restrictions, billing, and real-device GPS require the configured browser API key and live verification. The owner supplied the browser API key on November 15, 2026; it was saved as the encrypted GOOGLE_MAPS_API_KEY repository Actions secret. No key value is committed to source. Verify live provider loading after deployment.
