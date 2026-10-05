# TripAway

Interactive tourism website demo built with plain HTML, CSS, and JavaScript.

## Run locally

Open `index.html` in a browser. No build tools or API keys are required. For app-shell offline support, serve the folder over HTTPS (or localhost): browsers do not allow service workers from `file://`.

## Included demo features

- Destination search across India, including Coorg, Hampi, Gokarna, Ziro, Tawang, Mechuka, Majuli, Mandu, Orchha, Munnar, Kutch, and Dzukou Valley.
- Place cards with attraction-specific or experience-matched images.
- Guest-browsable mobile app preview with consolidated Discover & map, My trips, Today’s plan, Community & reviews, Travel translator, and Currency converter sections. Sign-in is only a UI demo; no account is required.
- Discover filters for category, indicative spend, and approximate distance from the city centre.
- My trips builder with saved trip snapshots, shareable itinerary links, print-to-PDF, local INR budgets and expense splitting, a packing checklist, and locally stored travel document files.
- App-shell service worker for static assets when hosted over HTTPS or localhost. Saved trips and checklists remain in browser storage; third-party maps, directions, and weather require internet. Map tiles are not cached.
- Emergency information for India, including the national 112 number and outbound searches for hospitals, police, and embassy contacts. Verify local details; search results are not an emergency service directory.
- Clearly identified outbound accommodation, transport, and ticket searches. TripAway does not process bookings or payments.
- Open-Meteo current conditions and weather caution inside Today’s plan, with visible loading and unavailable states.
- Offline currency converter for INR, USD, EUR, GBP, JPY, SGD, CAD, AUD, and CHF using fixed approximate reference rates. No network request is made; displayed amounts are estimates, not live market rates.
- Community feed includes video reviews as a post type, with client-side camera recording or upload, preview, rating, and local published-review state.
- Sample itinerary planner with selectable trip styles and city rotation.
- Map demo with OpenStreetMap previews and Google Maps directions for planned stops. These external map services are not available offline.
- Multilingual interface with 60+ selectable locales, saved language preference, and right-to-left layout support.
- Offline travel phrasebook with its own persistent language selector, plus speak and copy actions. Phrase translations are included for English, Hindi, Spanish, French, German, Arabic, Portuguese, Japanese, and Chinese.
- Contact and sign-in interface demos.

Travel document files are stored in IndexedDB on the current browser/device, not uploaded. The demo is not encrypted document storage; avoid using it as the only copy of important documents. It is not a real booking, authentication, or emergency-response service.

## GitHub upload

Upload all files in this folder to a new GitHub repository. If using GitHub Pages, set the Pages source to the repository root and the site will load from `index.html`.
