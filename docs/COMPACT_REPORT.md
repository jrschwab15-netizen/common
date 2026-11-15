# Compact Quick Report layout

Quick Report keeps its existing Location, Photo, Note and Review steps. The location step starts with safety confirmation, then shows device location, a compact Google map, public location description, confirmation and Continue. A changed safety answer is available through Change. Manual address search, coordinates, place type and agency-context copy expand under Manual location & place details.

The report route has a small brand header without redundant navigation or the site footer. Compact spacing, headings and photo previews reduce scrolling on every step. Actions stay in normal document flow so they cannot cover form fields. The page can scroll when optional sections, warnings, keyboard, accessibility zoom, or long content need more space; no content is clipped or forced into a fixed-height scroll box.

Validation: TypeScript/build and 28 browser checks passed, including explicit on-screen position checks for the location Continue action and note Review action at 390×844 and 320×700. Tests also cover manual-location expansion, safety gating, device location, map selection, photo progression and public-place presets. No intake/backend behavior changed.
