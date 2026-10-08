# TripAway

Interactive tourism website demo built with plain HTML, CSS, and JavaScript.

## Run locally

On Windows, double-click `Run-TripAway.bat` in this folder. It starts the server if needed and opens `http://127.0.0.1:8125/` in your browser. A separate TripAway server window stays open while the site is running; close that window to stop the server. If port 8125 is already serving TripAway, the launcher reuses it. If another program occupies that port, close it or choose a different port in the launcher and URL.

The launcher requires Python 3 on PATH. Alternatively, open PowerShell in this folder and run `python -m http.server 8125 --bind 127.0.0.1`. Opening `index.html` directly also works for basic static browsing, but browser service workers require HTTPS or localhost. Localhost is only accessible on this computer; to make the site available to other people, deploy the frontend to a static host and add its URL to Supabase Auth's allowed redirect URLs.

## Included demo features

- Destination search across India, including Coorg, Hampi, Gokarna, Ziro, Tawang, Mechuka, Majuli, Mandu, Orchha, Munnar, Kutch, and Dzukou Valley.
- Place cards with attraction-specific or experience-matched images.
- Guest-browsable mobile app preview with consolidated Discover & map, My trips, Budget & expenses, Today’s plan, Community & reviews, Travel translator, and Currency converter sections. Guest browsing is available; Supabase-backed email sign-in and account creation require network access.
- Discover filters for category, indicative spend, and approximate distance from the city centre.
- My trips builder with saved trip snapshots, shareable itinerary links, print-to-PDF, a packing checklist, and travel documents. With Supabase configured and a user signed in, the active itinerary, Budget & expenses data, packing checklist, and saved trip snapshots sync to that account. On first sign-in, guests can choose to import device-only trips and written reviews without replacing account trips; imported reviews enter moderation.
- Signed-in users can sync their interface language, offline phrasebook language, and sample-day planner preferences across devices.
- App-shell service worker for static assets when hosted over HTTPS or localhost. Guest trip data remains in browser storage; signed-in trip data syncs through Supabase. Third-party maps, directions, and weather require internet. Map tiles are not cached.
- Emergency information for India, including the national 112 number and outbound searches for hospitals, police, and embassy contacts. Verify local details; search results are not an emergency service directory.
- Clearly identified outbound accommodation, transport, and ticket searches. TripAway does not process bookings or payments.
- Open-Meteo current conditions and weather caution inside Today’s plan, with visible loading and unavailable states.
- Currency converter for INR, USD, EUR, GBP, JPY, SGD, CAD, AUD, and CHF using the keyless Frankfurter exchange-rate API. Rates are reference estimates, update daily, and require an internet connection; they are not live trading rates.
- Community feed lets guests publish device-local written reviews; signed-in users can submit reviews to Supabase for moderation, with optional videos in private storage.
- Sample itinerary planner with selectable trip styles and city rotation.
- Map demo with OpenStreetMap previews and Google Maps directions for planned stops. These external map services are not available offline.
- Multilingual interface with 60+ selectable locales, saved language preference, and right-to-left layout support.
- Offline travel phrasebook with its own persistent language selector, plus speak and copy actions. Phrase translations are included for English, Hindi, Spanish, French, German, Arabic, Portuguese, Japanese, and Chinese.
- Contact form backed by a validated, rate-limited Supabase submission function.

In guest mode, travel document files are stored in IndexedDB on the current browser/device. Signed-in users can store documents in private Supabase Storage. Neither storage option should be the only copy of important files. TripAway does not process bookings or payments and is not an emergency-response service.

## Supabase backend setup

The Supabase schema is in `supabase/migrations/20261007195000_initial_schema.sql`. The initial schema, saved-trip snapshot migration (`supabase/migrations/20261007204500_saved_trip_snapshots.sql`), contact-submission migration (`supabase/migrations/20261007210000_contact_submissions.sql`), and user-preferences migration (`supabase/migrations/20261008210000_user_preferences.sql`) have been verified in the configured project. Apply all SQL files in `supabase/migrations/` using the Supabase SQL Editor when setting up a new project. They create account profiles, trips and stops, budgets and expenses, saved trip snapshots, packing items, reviews, private document metadata, contact submissions, account preferences, private storage buckets, and row-level security policies.

To enable sign-in in the browser demo:

1. Create a Supabase project and apply all SQL migrations.
2. In `supabase-config.js`, set `tripAwaySupabaseUrl` to the project URL and `tripAwaySupabaseAnonKey` to the project's public anon/publishable key.
3. Configure the Supabase Auth email-confirmation and allowed redirect URL settings for the origin where this app is hosted.
4. Serve the app over HTTPS or localhost and test account creation/sign-in.

Only the public anon/publishable key belongs in the browser. Never put a service-role key in this repository or frontend. The static demo continues to work in guest mode. Signed-in accounts sync their active itinerary, budget/expense data, packing checklist, saved trip snapshots, and interface preferences; reviews are submitted for moderation; and travel documents use private account storage. Contact form messages are validated and stored privately in Supabase with a per-email submission limit. Guest reviews and trips remain device-local unless the user chooses to import them after signing in. Imported guest itineraries become saved snapshots and never overwrite the account's active trip or an existing saved snapshot; imported reviews are submitted as pending.

### Manual review moderation

Review submissions from signed-in users start with `status = 'pending'` and are not visible to other users. Reviewers cannot change that status themselves. To moderate reviews, use the Supabase SQL Editor while connected to the correct project; do not expose an admin or service-role key in the app.

List reviews awaiting a decision:

```sql
select id, created_at, place, rating, body, video_path
from public.reviews
where status = 'pending'
order by created_at asc;
```

After reviewing the content, replace the UUID below with the selected review's `id` to publish it:

```sql
update public.reviews
set status = 'published', updated_at = now()
where id = 'REPLACE-WITH-REVIEW-UUID'
  and status = 'pending';
```

To keep a review out of the public feed without deleting it, set its status to `hidden`:

```sql
update public.reviews
set status = 'hidden', updated_at = now()
where id = 'REPLACE-WITH-REVIEW-UUID'
  and status in ('pending', 'published');
```

The community feed displays published reviews. Authors can see their own pending or hidden submissions, while other users can only read published reviews. If a review includes a video, its object is in the private `review-videos` bucket; remove the object through Supabase Storage if it should also be deleted.

## GitHub upload

Upload all files in this folder to a new GitHub repository. If using GitHub Pages, set the Pages source to the repository root and the site will load from `index.html`.
