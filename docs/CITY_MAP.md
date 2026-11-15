# City issue map

Every city page now shows its sourced municipal boundary and published issue locations on a zoomable Leaflet map. Status/category filters apply to the map and list. Marker popups link to individual cases; identical locations share a marker and list all cases. Reports with no valid reviewed public point remain in the list and are counted separately.

The map offers fit-city and fit-reports controls, a concentration layer, category counts for the current viewport, and buttons to zoom to cells with the most open cases. Concentrations use fixed 500 m Web Mercator cells (approximately 370 m on the ground in Massachusetts). These count published cases, not repeat submissions, and are not cleanliness ratings. Density circles are indicative; only reviewed public points are used, never private submission coordinates.

Data access uses the existing public RLS policies without schema or permission changes. Public issues are explicitly selected and paginated in stable date/id order in batches of 1,000. Failures identify potentially incomplete counts. Boundaries come from the existing public municipality records. Map tiles use OpenStreetMap with attribution; tile failures show a notice while the list remains usable.

Validation: TypeScript and Vite build, 11 unit tests, and desktop/mobile Playwright coverage for populated maps with local fixtures, missing public locations, filters, concentration mode, viewport summaries, popup navigation, and actual Cambridge directory lookup/empty map. No fixture reports are inserted into production. The public issues endpoint had no published cases when checked on November 15, 2026.
