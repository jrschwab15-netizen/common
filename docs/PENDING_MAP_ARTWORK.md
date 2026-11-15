# Map artwork and markers — approved November 15, 2026

The user approved publishing the Boston homepage artwork and applying transparent Common pins to Quick Report and city issue maps. The homepage uses public/brand/boston-map-hero.webp, an actual Boston Google Maps basemap with POI/business labels hidden and Google attribution retained. The Common pin is public/brand/common-map-pin.png; its exterior is transparent and its internal white C remains opaque.

Removed concept/demo wording from visible homepage copy and artwork. The invented grade, counts, photos and reports retain clear sample/illustrative-example labels. The homepage artwork is static and makes no Google API request when viewed. Quick Report retains Google Maps device location and draggable marker behavior. City maps retain status dots and co-located case counts alongside the branded pins.

Validation includes production build, 11 unit tests, and desktop/mobile browser checks for artwork, visible copy, branded city markers, report location and navigation. Existing Google imagery source/attribution notes remain with the design assets; the source was acquired through Maps Static API.
