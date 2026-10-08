const $ = s => document.querySelector(s);
const communityReviewStorageKey = 'tripaway-community-reviews';
const places = { Jaipur: [['Hawa Mahal', 'Landmark', 'The iconic Palace of Winds with its extraordinary honeycomb façade.'], ['Rambagh Palace', 'Stay', 'A royal residence transformed into an opulent heritage stay.'], ['Laxmi Misthan Bhandar', 'Food', 'A Jaipur institution for Rajasthani sweets and vegetarian classics.']], Mumbai: [['Gateway of India', 'Landmark', 'An iconic waterfront arch overlooking Mumbai Harbour.'], ['Taj Mahal Palace', 'Stay', 'Historic luxury hotel beside the Gateway.'], ['Bademiya', 'Food', 'Late-night kebabs and Mughlai favourites.']], Delhi: [['India Gate', 'Landmark', 'War memorial set among broad ceremonial boulevards.'], ['The Imperial', 'Stay', 'Heritage hotel in the heart of New Delhi.'], ['Karim’s', 'Food', 'Classic Mughlai restaurant near Jama Masjid.']] };
function search(e) { e?.preventDefault(); let city = $('#city').value.trim(), kind = $('#kind').value, key = Object.keys(places).find(x => x.toLowerCase() === city.toLowerCase()), list = key ? places[key].filter(x => !kind || x[1] === kind) : []; $('#searchStatus').textContent = list.length ? `${list.length} curated places in ${key}.` : `We’re still gathering stories for ${city}. Try Jaipur, Mumbai, or Delhi.`; $('#results').innerHTML = list.map(x => `<article><small>${x[1].toUpperCase()}</small><h3>${x[0]}</h3><p>${x[2]}</p><a href="#appdemo">Save to a trip ↗</a></article>`).join('') }
$('#searchForm').onsubmit = search; $('#cities').onclick = e => { let city = e.target.closest('[data-city]')?.dataset.city; if (city) { $('#city').value = city; search(); location.hash = 'discover' } };
const itineraryData = {
    Jaipur: [['08:00', '☕', 'Breakfast at Tapri Central', 'Food · 1.6 km away'], ['10:00', '♜', 'Explore Hawa Mahal', 'Sightseeing · 1.2 km away'], ['13:00', '🍛', 'Lunch at LMB', 'Food · 0.8 km away'], ['16:30', '✦', 'Golden hour at Nahargarh', 'Explorer pick · 5.4 km away']],
    Mumbai: [['08:30', '☕', 'Breakfast at Kala Ghoda Cafe', 'Food · 1.1 km away'], ['10:30', '♜', 'Explore Gateway of India', 'Sightseeing · 0.9 km away'], ['13:00', '🍛', 'Lunch at Bademiya', 'Food · 1.3 km away'], ['17:00', '✦', 'Sunset at Marine Drive', 'Explorer pick · 3.8 km away']],
    Delhi: [['08:00', '☕', 'Breakfast at Indian Coffee House', 'Food · 1.4 km away'], ['10:00', '♜', 'Explore India Gate', 'Sightseeing · 2.1 km away'], ['13:00', '🍛', 'Lunch at Karim’s', 'Food · 2.7 km away'], ['16:30', '✦', 'Discover Lodhi Garden', 'Explorer pick · 4.2 km away']]
};
let plannerCity = 'Jaipur';
let plannerStyle = 'Balanced day';
function plannerMarkup(style = plannerStyle) { let plan = [...itineraryData[plannerCity]]; if (style === 'Food first') plan = [plan[0], plan[2], plan[1], plan[3]]; if (style === 'Slow explorer') plan = [plan[0], plan[1], plan[3], plan[2]]; return `<div class="day"><small>SUNDAY, 13 OCTOBER · DAY PLANNER</small><h3>Your day<br>in ${plannerCity}.</h3></div><div class="planner-controls"><label>TRIP STYLE<select id="plannerStyle"><option${style === 'Balanced day' ? ' selected' : ''}>Balanced day</option><option${style === 'Food first' ? ' selected' : ''}>Food first</option><option${style === 'Slow explorer' ? ' selected' : ''}>Slow explorer</option></select></label><button id="regeneratePlan">✦ Plan my day</button></div><div class="planner-note">Your sample day plan for ${plannerCity}. Add or change stops in My trips.</div><section class="weather-card" id="weatherCard" aria-live="polite"><b>Local weather</b><p>Loading current conditions…</p></section><div class="timeline">${plan.map(x => `<div><span>${x[0]}</span><i>${x[1]}</i><section><b>${x[2]}</b><small>${x[3]}</small></section></div>`).join('')}</div>` }
async function loadPlannerWeather() {
    const card = $('#weatherCard');
    if (!card) return;
    const coordinates = destinationCoordinates?.[plannerCity];
    if (!coordinates) {
        card.innerHTML = '<b>Weather unavailable</b><p>No coordinates are available for this destination.</p>';
        return;
    }
    try {
        const [latitude, longitude] = coordinates;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Weather request failed (${response.status}).`);
        const data = await response.json();
        const current = data.current;
        if (!current || typeof current.temperature_2m !== 'number') throw new Error('Weather response did not include current conditions.');
        const rainChance = data.hourly?.precipitation_probability?.[0];
        const warning = current.weather_code >= 95 || current.wind_speed_10m >= 40 || (typeof rainChance === 'number' && rainChance >= 70)
            ? '<strong class="weather-alert">Caution: forecast suggests possible severe conditions. Check official local advisories.</strong>'
            : '<small>Forecast guidance only; this is not an official warning service.</small>';
        card.innerHTML = `<b>Weather in ${escapeHtml(plannerCity)}</b><p>${Math.round(current.temperature_2m)}°C · feels like ${Math.round(current.apparent_temperature)}°C · wind ${Math.round(current.wind_speed_10m)} km/h${typeof rainChance === 'number' ? ` · rain chance ${rainChance}%` : ''}</p>${warning}`;
    } catch (error) {
        console.error('Could not load destination weather.', error);
        card.innerHTML = '<b>Weather unavailable</b><p>Live conditions need an internet connection. Check a local forecast before heading out.</p>';
    }
}
function bindPlanner() {
    $('#plannerStyle').onchange = event => {
        plannerStyle = event.target.value;
        persistUserPreferences({ planner_style: event.target.value });
        $('#screen').innerHTML = plannerMarkup();
        bindPlanner();
    };
    $('#regeneratePlan').onclick = () => {
        const cities = Object.keys(itineraryData);
        plannerCity = cities[(cities.indexOf(plannerCity) + 1) % cities.length];
        persistUserPreferences({ planner_city: plannerCity });
        $('#screen').innerHTML = plannerMarkup();
        bindPlanner();
    };
    loadPlannerWeather();
}
const tripStorageKey = 'tripaway-trip-builder';
const plannerPreferencesKey = 'tripaway-planner-preferences';
function createTrip(city = 'Jaipur', days = 2) {
    const destinationStops = itineraryData[city] || (places[city] || []).map(place => ['09:00', '✦', place[0], `${place[1]} · ${city}`]);
    const stopsPerDay = Math.ceil(destinationStops.length / 2);
    return { city, days, budget: 0, expenses: [], stops: destinationStops.map((stop, index) => ({ name: stop[2], detail: stop[3], time: stop[0], day: Math.min(Math.floor(index / stopsPerDay) + 1, days) })) };
}
function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
let tripPlan = createTrip();
let tripPlanLoaded = false;
let authenticatedUser = null;
let accountPreferencesReady = false;
let preferenceSyncQueue = Promise.resolve();
let guestPreferencesOnSignIn = null;
let remoteTripId = null;
let remoteTripOwnerId = null;
let tripPlanRevision = 0;
let accountTripReady = Promise.resolve();
let tripSyncQueue = Promise.resolve();
let tripSyncStatus = 'Trip data is stored on this device until you sign in.';
const savedTripsKey = 'tripaway-saved-trips';
const packingKey = 'tripaway-packing-list';
const accountPreferencesKey = 'tripaway-account-preferences';
const guestImportKey = 'tripaway-guest-import';
let guestImportOffer = null;
const packingItems = ['Travel documents', 'Phone & charger', 'Medication', 'Comfortable shoes', 'Weather-ready layer', 'Reusable water bottle'];
function userScopedStorageKey(key) {
    return authenticatedUser ? `${key}:${authenticatedUser.id}` : key;
}
function normalizeUserPreferences(value = {}) {
    const appLanguageOptions = [...($('#languageSelect')?.options || [])];
    const supportedAppLanguage = typeof value.app_language === 'string'
        && /^[a-z]{2,3}$/.test(value.app_language)
        && (!appLanguageOptions.length || appLanguageOptions.some(option => option.value === value.app_language));
    const appLanguage = supportedAppLanguage ? value.app_language : 'en';
    const translatorLanguages = ['en', 'hi', 'es', 'fr', 'de', 'ar', 'pt', 'ja', 'zh'];
    const translatorLanguage = translatorLanguages.includes(value.translator_language) ? value.translator_language : 'en';
    const plannerCityValue = Object.keys(itineraryData).includes(value.planner_city) ? value.planner_city : 'Jaipur';
    const plannerStyles = ['Balanced day', 'Food first', 'Slow explorer'];
    const plannerStyleValue = plannerStyles.includes(value.planner_style) ? value.planner_style : 'Balanced day';
    return {
        app_language: appLanguage,
        translator_language: translatorLanguage,
        planner_city: plannerCityValue,
        planner_style: plannerStyleValue
    };
}
function readClientPreferences(overrides = {}) {
    let savedPlannerPreferences = {};
    try {
        savedPlannerPreferences = JSON.parse(localStorage.getItem(plannerPreferencesKey) || '{}');
        if (!savedPlannerPreferences || typeof savedPlannerPreferences !== 'object' || Array.isArray(savedPlannerPreferences)) savedPlannerPreferences = {};
    } catch (error) {
        console.error('Could not read planner preferences from this device.', error);
    }
    return normalizeUserPreferences({
        app_language: localStorage.getItem('tripaway-language') || document.documentElement.lang,
        translator_language: localStorage.getItem('tripaway-translator-language') || localStorage.getItem('tripaway-language'),
        planner_city: savedPlannerPreferences.planner_city || plannerCity,
        planner_style: savedPlannerPreferences.planner_style || plannerStyle,
        ...overrides
    });
}
try {
    const savedPlannerPreferences = JSON.parse(localStorage.getItem(plannerPreferencesKey) || '{}');
    if (Object.keys(itineraryData).includes(savedPlannerPreferences.planner_city)) plannerCity = savedPlannerPreferences.planner_city;
    if (['Balanced day', 'Food first', 'Slow explorer'].includes(savedPlannerPreferences.planner_style)) plannerStyle = savedPlannerPreferences.planner_style;
} catch (error) {
    console.error('Could not read planner preferences from this device.', error);
}
const localInitialPreferences = readClientPreferences();
plannerCity = localInitialPreferences.planner_city;
plannerStyle = localInitialPreferences.planner_style;
function applyClientPreferences(value) {
    const preferences = normalizeUserPreferences(value);
    plannerCity = preferences.planner_city;
    plannerStyle = preferences.planner_style;
    localStorage.setItem('tripaway-translator-language', preferences.translator_language);
    localStorage.setItem(plannerPreferencesKey, JSON.stringify({
        planner_city: plannerCity,
        planner_style: plannerStyle
    }));
    if (typeof window.setTripAwayLanguage === 'function') window.setTripAwayLanguage(preferences.app_language);
    else localStorage.setItem('tripaway-language', preferences.app_language);
    return preferences;
}
function showPreferenceSyncError(error) {
    console.error('Could not sync account preferences.', error);
    const status = $('#authStatus') || $('#screen');
    if (status) status.textContent = 'Your preferences are saved on this device, but account sync failed.';
}
function persistUserPreferences(overrides) {
    const preferences = readClientPreferences(overrides);
    try {
        localStorage.setItem(plannerPreferencesKey, JSON.stringify({
            planner_city: preferences.planner_city,
            planner_style: preferences.planner_style
        }));
    } catch (error) {
        console.error('Could not save planner preferences on this device.', error);
    }
    if (!authenticatedUser) {
        try {
            localStorage.setItem('tripaway-guest-preferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Could not save guest preferences on this device.', error);
        }
        return;
    }
    if (!accountPreferencesReady || !window.tripAwaySupabase) return;
    const userId = authenticatedUser.id;
    try {
        localStorage.setItem(`${accountPreferencesKey}:${userId}`, JSON.stringify(preferences));
    } catch (error) {
        console.error('Could not cache account preferences on this device.', error);
    }
    preferenceSyncQueue = preferenceSyncQueue.catch(() => {}).then(async () => {
        if (authenticatedUser?.id !== userId) return;
        const { error } = await window.tripAwaySupabase.from('user_preferences').upsert({
            owner_id: userId,
            ...preferences,
            updated_at: new Date().toISOString()
        }, { onConflict: 'owner_id' });
        if (error) throw error;
        if (authenticatedUser?.id === userId) $('#authStatus').textContent = 'Preferences synced with your account.';
    }).catch(showPreferenceSyncError);
}
async function loadAccountPreferences(userId, fallbackPreferences) {
    const { data, error } = await window.tripAwaySupabase.from('user_preferences')
        .select('app_language,translator_language,planner_city,planner_style')
        .eq('owner_id', userId)
        .maybeSingle();
    if (error) throw error;
    let preferences = data ? normalizeUserPreferences(data) : normalizeUserPreferences(fallbackPreferences);
    if (!data) {
        const { error: saveError } = await window.tripAwaySupabase.from('user_preferences').upsert({
            owner_id: userId,
            ...preferences,
            updated_at: new Date().toISOString()
        }, { onConflict: 'owner_id' });
        if (saveError) throw saveError;
    }
    if (authenticatedUser?.id !== userId) return;
    accountPreferencesReady = false;
    preferences = applyClientPreferences(preferences);
    accountPreferencesReady = true;
    try {
        localStorage.setItem(`${accountPreferencesKey}:${userId}`, JSON.stringify(preferences));
    } catch (storageError) {
        console.error('Could not cache account preferences on this device.', storageError);
    }
    if (activeView === 'today') {
        $('#screen').innerHTML = plannerMarkup();
        bindPlanner();
    } else if (activeView === 'translate') {
        $('#screen').innerHTML = translatorMarkup();
    }
}
function normalizeTrip(value) {
    if (!value || !places[value.city] || ![1, 2, 3].includes(value.days) || !Array.isArray(value.stops)) return null;
    const knownStops = [...(itineraryData[value.city] || []).map(stop => ({ name: stop[2], detail: stop[3] })), ...places[value.city].map(place => ({ name: place[0], detail: itineraryData[value.city] ? place[1] : `${place[1]} · ${value.city}` }))];
    const stops = value.stops.filter(stop => stop && typeof stop.name === 'string' && knownStops.some(known => known.name === stop.name && known.detail === stop.detail) && Number.isInteger(stop.day) && stop.day >= 1 && stop.day <= value.days && typeof stop.time === 'string' && /^\d{2}:\d{2}$/.test(stop.time));
    const expenses = Array.isArray(value.expenses) ? value.expenses.filter(item => item && typeof item.description === 'string' && item.description.length <= 80 && Number.isFinite(item.amount) && item.amount > 0 && item.amount <= 10000000 && Number.isInteger(item.people) && item.people >= 1 && item.people <= 100).slice(0, 100) : [];
    return { city: value.city, days: value.days, stops, budget: Number.isFinite(value.budget) && value.budget > 0 ? Math.min(value.budget, 100000000) : 0, expenses };
}
function loadTripPlan() {
    if (tripPlanLoaded) return;
    tripPlanLoaded = true;
    try {
        const shared = new URLSearchParams(location.search).get('trip');
        if (shared) {
            const bytes = Uint8Array.from(atob(shared.replace(/-/g, '+').replace(/_/g, '/')), character => character.charCodeAt(0));
            tripPlan = normalizeTrip(JSON.parse(new TextDecoder().decode(bytes))) || tripPlan;
        } else tripPlan = normalizeTrip(JSON.parse(localStorage.getItem(userScopedStorageKey(tripStorageKey)))) || tripPlan;
    } catch (error) {
        console.warn('Could not load the saved trip plan.', error);
    }
}
function saveTripPlan() {
    try {
        localStorage.setItem(userScopedStorageKey(tripStorageKey), JSON.stringify(tripPlan));
        tripPlanRevision++;
        if (authenticatedUser && window.tripAwaySupabase) queueTripPlanSync();
        return true;
    } catch (error) {
        console.error('Could not save the trip plan.', error);
        return false;
    }
}
function loadSavedTrips() {
    try {
        const saved = JSON.parse(localStorage.getItem(userScopedStorageKey(savedTripsKey)) || '[]');
        return Array.isArray(saved) ? saved.map(normalizeTrip).filter(Boolean).slice(0, 20) : [];
    } catch (error) {
        console.error('Could not load saved trips.', error);
        return [];
    }
}
function readGuestImportData() {
    const trips = new Map();
    const reviews = [];
    let skippedTrips = 0;
    let skippedReviews = 0;
    try {
        const savedTrips = JSON.parse(localStorage.getItem(savedTripsKey) || '[]');
        if (!Array.isArray(savedTrips)) throw new TypeError('Saved guest trips are not a list.');
        for (const value of savedTrips) {
            const trip = normalizeTrip(value);
            if (trip) trips.set(`${trip.city}:${trip.days}`, trip);
            else skippedTrips++;
        }
    } catch (error) {
        console.error('Could not read saved guest trips for import.', error);
        skippedTrips++;
    }
    try {
        const activeTripValue = localStorage.getItem(tripStorageKey);
        if (activeTripValue) {
            const trip = normalizeTrip(JSON.parse(activeTripValue));
            if (trip) trips.set(`${trip.city}:${trip.days}`, trip);
            else skippedTrips++;
        }
    } catch (error) {
        console.error('Could not read the active guest trip for import.', error);
        skippedTrips++;
    }
    try {
        const savedReviews = JSON.parse(localStorage.getItem(communityReviewStorageKey) || '[]');
        if (!Array.isArray(savedReviews)) throw new TypeError('Saved guest reviews are not a list.');
        for (const review of savedReviews) {
            const place = typeof review?.place === 'string' ? review.place.trim() : '';
            const body = typeof review?.text === 'string' ? review.text.trim() : '';
            const rating = Number(review?.rating);
            if (!place || place.length > 160 || !body || body.length > 500 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
                skippedReviews++;
                continue;
            }
            reviews.push({ place, body, rating });
        }
    } catch (error) {
        console.error('Could not read saved guest reviews for import.', error);
        skippedReviews++;
    }
    return { trips: [...trips.values()].slice(0, 20), reviews, skippedTrips, skippedReviews };
}
function prepareGuestImportOffer(userId, data) {
    guestImportOffer = null;
    if (!data) return;
    try {
        if (localStorage.getItem(`${guestImportKey}:${userId}`)) return;
    } catch (error) {
        console.error('Could not check the guest data import status.', error);
        return;
    }
    if (!data.trips.length && !data.reviews.length && !data.skippedTrips && !data.skippedReviews) return;
    guestImportOffer = { userId, ...data, busy: false, error: '', result: '' };
}
async function importGuestData() {
    const offer = guestImportOffer;
    if (!offer || offer.busy || offer.userId !== authenticatedUser?.id || !window.tripAwaySupabase) return;
    offer.busy = true;
    offer.error = '';
    renderGuestImportOffer();
    try {
        let importedTrips = 0;
        let importedReviews = 0;
        if (offer.trips.length) {
            const { data: accountTrips, error: listError } = await window.tripAwaySupabase.from('saved_trips')
                .select('city,days')
                .eq('owner_id', offer.userId)
                .limit(100);
            if (listError) throw listError;
            const existingTrips = new Set(accountTrips.map(trip => `${trip.city}:${trip.days}`));
            const newTrips = offer.trips.filter(trip => !existingTrips.has(`${trip.city}:${trip.days}`));
            if (newTrips.length) {
                const { data, error } = await window.tripAwaySupabase.from('saved_trips').upsert(
                    newTrips.map(snapshot => ({
                        owner_id: offer.userId,
                        city: snapshot.city,
                        days: snapshot.days,
                        snapshot
                    })),
                    { onConflict: 'owner_id,city,days', ignoreDuplicates: true }
                ).select('city');
                if (error) throw error;
                importedTrips = data.length;
            }
        }
        if (offer.reviews.length) {
            const accountReviews = [];
            for (let offset = 0; ; offset += 1000) {
                const { data, error } = await window.tripAwaySupabase.from('reviews')
                    .select('place,rating,body')
                    .eq('author_id', offer.userId)
                    .range(offset, offset + 999);
                if (error) throw error;
                accountReviews.push(...data);
                if (data.length < 1000) break;
            }
            const existingReviews = new Map();
            const signature = review => `${review.place}\u0000${review.rating}\u0000${review.body}`;
            for (const review of accountReviews) {
                const key = signature(review);
                existingReviews.set(key, (existingReviews.get(key) || 0) + 1);
            }
            const newReviews = [];
            for (const review of offer.reviews) {
                const key = signature(review);
                const duplicates = existingReviews.get(key) || 0;
                if (duplicates > 0) existingReviews.set(key, duplicates - 1);
                else newReviews.push(review);
            }
            for (let offset = 0; offset < newReviews.length; offset += 50) {
                const { data, error } = await window.tripAwaySupabase.from('reviews').insert(
                    newReviews.slice(offset, offset + 50).map(review => ({
                        author_id: offer.userId,
                        place: review.place,
                        rating: review.rating,
                        body: review.body,
                        status: 'pending'
                    }))
                ).select('id');
                if (error) throw error;
                importedReviews += data.length;
            }
        }
        localStorage.setItem(`${guestImportKey}:${offer.userId}`, 'done');
        offer.result = `Imported ${importedTrips} saved trip snapshot${importedTrips === 1 ? '' : 's'} and ${importedReviews} review${importedReviews === 1 ? '' : 's'}. Reviews are pending moderation. Your original guest data remains on this device.`;
        if (importedReviews && activeView === 'community') renderCommunityReviews();
    } catch (error) {
        console.error('Could not import guest data to the account.', error);
        offer.error = error.message || 'Could not import guest data. Please try again.';
    } finally {
        offer.busy = false;
        renderGuestImportOffer();
    }
}
function renderGuestImportOffer() {
    const screen = $('#screen');
    if (!screen) return;
    screen.querySelector('.guest-import-banner')?.remove();
    const offer = guestImportOffer;
    if (!offer || offer.userId !== authenticatedUser?.id) return;
    const banner = document.createElement('section');
    banner.className = 'guest-import-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Guest data import');
    banner.setAttribute('aria-live', 'polite');
    const title = document.createElement('b');
    const message = document.createElement('p');
    const actions = document.createElement('div');
    actions.className = 'guest-import-actions';
    if (offer.result) {
        title.textContent = 'Guest data imported';
        message.textContent = offer.result;
        const done = document.createElement('button');
        done.type = 'button';
        done.textContent = 'Done';
        done.onclick = () => { guestImportOffer = null; banner.remove(); };
        actions.append(done);
    } else {
        title.textContent = 'Bring your guest data into your account?';
        const itineraryLabel = offer.trips.length === 1 ? 'itinerary' : 'itineraries';
        message.textContent = `${offer.trips.length} ${itineraryLabel} and ${offer.reviews.length} review${offer.reviews.length === 1 ? '' : 's'} found. Itineraries are added as saved snapshots (existing account trips are never replaced); imported reviews go to moderation. Original guest data stays on this device.${offer.skippedTrips || offer.skippedReviews ? ` ${offer.skippedTrips + offer.skippedReviews} invalid item${offer.skippedTrips + offer.skippedReviews === 1 ? ' was' : 's were'} skipped.` : ''}`;
        const importButton = document.createElement('button');
        importButton.type = 'button';
        importButton.textContent = offer.busy ? 'Importing…' : 'Import guest data';
        importButton.disabled = offer.busy;
        importButton.onclick = importGuestData;
        const skipButton = document.createElement('button');
        skipButton.type = 'button';
        skipButton.textContent = 'Not now';
        skipButton.disabled = offer.busy;
        skipButton.onclick = () => {
            try {
                localStorage.setItem(`${guestImportKey}:${offer.userId}`, 'skipped');
                guestImportOffer = null;
                banner.remove();
            } catch (error) {
                console.error('Could not save the guest import choice.', error);
                offer.error = 'Could not save this choice on the device. Please try again.';
                renderGuestImportOffer();
            }
        };
        actions.append(importButton, skipButton);
        if (offer.error) {
            const error = document.createElement('p');
            error.className = 'guest-import-error';
            error.textContent = offer.error;
            banner.append(title, message, error, actions);
            screen.prepend(banner);
            return;
        }
        if (offer.skippedTrips || offer.skippedReviews) {
            const warning = document.createElement('p');
            warning.className = 'guest-import-error';
            warning.textContent = 'Some saved guest items were invalid and will not be imported.';
            banner.append(title, message, warning, actions);
            screen.prepend(banner);
            return;
        }
    }
    banner.append(title, message, actions);
    screen.prepend(banner);
}
function saveTripToCollection() {
    const savedTrips = loadSavedTrips();
    const index = savedTrips.findIndex(saved => saved.city === tripPlan.city && saved.days === tripPlan.days);
    if (index >= 0) savedTrips[index] = JSON.parse(JSON.stringify(tripPlan));
    else savedTrips.unshift(JSON.parse(JSON.stringify(tripPlan)));
    try {
        localStorage.setItem(userScopedStorageKey(savedTripsKey), JSON.stringify(savedTrips.slice(0, 20)));
        return true;
    } catch (error) {
        console.error('Could not save trip to My trips.', error);
        return false;
    }
}
async function loadAccountSavedTrips(userId) {
    const { data, error } = await window.tripAwaySupabase.from('saved_trips')
        .select('city,days,snapshot')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false })
        .limit(20);
    if (error) throw error;
    const saved = data.map(row => normalizeTrip(row.snapshot)).filter(Boolean);
    localStorage.setItem(userScopedStorageKey(savedTripsKey), JSON.stringify(saved));
}
async function saveAccountTripSnapshot(userId) {
    const snapshot = normalizeTrip(JSON.parse(JSON.stringify(tripPlan)));
    if (!snapshot) throw new Error('The current trip cannot be saved as a valid snapshot.');
    const { error } = await window.tripAwaySupabase.from('saved_trips').upsert({
        owner_id: userId,
        city: snapshot.city,
        days: snapshot.days,
        snapshot,
        updated_at: new Date().toISOString()
    }, { onConflict: 'owner_id,city,days' });
    if (error) throw error;
    await loadAccountSavedTrips(userId);
}
function savedTripCards() {
    const trips = loadSavedTrips();
    return `<section class="trip-collection"><h4>Saved trips <small>${trips.length} on this device</small></h4>${trips.length ? trips.map((trip, index) => `<button type="button" class="saved-trip" data-saved-trip="${index}"><b>${escapeHtml(trip.city)}</b><small>${trip.days} days · ${trip.stops.length} planned stops</small></button>`).join('') : '<p class="trip-empty">Save a trip below and it will be ready on this device, even without an internet connection.</p>'}</section>`;
}
function packingMarkup() {
    let checked = [];
    try { checked = JSON.parse(localStorage.getItem(userScopedStorageKey(packingKey)) || '[]'); if (!Array.isArray(checked)) checked = []; }
    catch (error) { console.error('Could not load packing checklist.', error); }
    return `<section class="trip-tools"><h4>Packing checklist</h4>${packingItems.map((item, index) => `<label class="packing-item"><input type="checkbox" data-packing="${index}"${checked.includes(index) ? ' checked' : ''}>${item}</label>`).join('')}<p class="trip-empty">${authenticatedUser ? 'Checklist syncs to your account and is cached on this device.' : 'Checklist is stored on this device. Sign in to sync it to your account.'}</p></section>`;
}
async function loadAccountPackingItems(userId) {
    const { data, error } = await window.tripAwaySupabase.from('packing_items')
        .select('label,is_checked')
        .eq('owner_id', userId)
        .is('trip_id', null);
    if (error) throw error;
    const checked = data.filter(item => item.is_checked).map(item => packingItems.indexOf(item.label)).filter(index => index >= 0);
    localStorage.setItem(userScopedStorageKey(packingKey), JSON.stringify(checked));
}
async function syncPackingItem(index, isChecked) {
    if (!authenticatedUser || !window.tripAwaySupabase || !packingItems[index]) return;
    const userId = authenticatedUser.id;
    const label = packingItems[index];
    try {
        const { data, error } = await window.tripAwaySupabase.from('packing_items')
            .select('id')
            .eq('owner_id', userId)
            .is('trip_id', null)
            .eq('label', label)
            .limit(1);
        if (error) throw error;
        const result = data.length
            ? await window.tripAwaySupabase.from('packing_items').update({ is_checked: isChecked }).eq('id', data[0].id).eq('owner_id', userId)
            : await window.tripAwaySupabase.from('packing_items').insert({ owner_id: userId, label, is_checked: isChecked });
        if (result.error) throw result.error;
        if (authenticatedUser?.id === userId) {
            const status = $('#tripStatus');
            if (status) status.textContent = 'Packing checklist synced with your account.';
        }
    } catch (error) {
        console.error('Could not sync packing checklist item.', error);
        const status = $('#tripStatus');
        if (status) status.textContent = 'Checklist saved on this device, but account sync failed.';
    }
}
function budgetMarkup() {
    const spent = tripPlan.expenses.reduce((total, expense) => total + expense.amount, 0);
    return `<section class="trip-tools budget-panel"><h4>Trip budget</h4><label class="budget-field">TRIP BUDGET (INR)<input id="tripBudget" type="number" min="0" max="100000000" step="100" value="${tripPlan.budget || ''}" placeholder="Set your trip budget"></label><p class="budget-total">₹${spent.toLocaleString('en-IN')} spent${tripPlan.budget ? ` of ₹${tripPlan.budget.toLocaleString('en-IN')}` : ''}</p></section><section class="trip-tools expense-panel"><h4>Expense splitter</h4><p class="trip-empty">Add a shared cost to see each traveller’s share.</p><form id="expenseForm" class="expense-form"><input id="expenseName" maxlength="80" required placeholder="Expense (e.g. lunch)"><input id="expenseAmount" type="number" min="1" max="10000000" step="1" required placeholder="Amount ₹"><input id="expensePeople" type="number" min="1" max="100" value="1" required aria-label="Split between people"><button type="submit">Add</button></form><div class="expense-list">${tripPlan.expenses.length ? tripPlan.expenses.map((expense, index) => `<article><div class="expense-detail"><strong>${escapeHtml(expense.description)}</strong><span>${expense.people} ${expense.people === 1 ? 'person' : 'people'}</span></div><b>₹${expense.amount.toLocaleString('en-IN')} total · ₹${Math.ceil(expense.amount / expense.people).toLocaleString('en-IN')} each</b><button type="button" class="expense-remove" data-expense="${index}" aria-label="Remove expense">×</button></article>`).join('') : '<p class="trip-empty">No expenses added yet.</p>'}</div></section>`;
}
function budgetViewMarkup(status = '') {
    return `<div class="trip-builder-head budget-head"><small>BUDGET & EXPENSES${authenticatedUser ? ' · ACCOUNT' : ' · GUEST MODE'}</small><h3>Travel well,<br>spend wisely.</h3><p>${escapeHtml(tripPlan.city)} trip · ${authenticatedUser ? 'Your trip budget and shared costs sync to your account.' : 'Budget and shared costs are saved on this device.'}</p></div><div class="trip-builder-content">${budgetMarkup()}<p class="trip-status" id="budgetStatus" role="status" aria-live="polite">${escapeHtml(status || tripSyncStatus)}</p></div>`;
}
function bookingsMarkup() {
    const city = encodeURIComponent(`${tripPlan.city}, India`);
    return `<section class="trip-tools"><h4>Booking links</h4><p class="trip-empty">These are outbound searches; TripAway does not take bookings or payments.</p><div class="booking-links"><a href="https://www.booking.com/searchresults.html?ss=${city}" target="_blank" rel="noopener noreferrer">Find stays ↗</a><a href="https://www.google.com/maps/search/transport+${city}" target="_blank" rel="noopener noreferrer">Find transport ↗</a><a href="https://www.google.com/search?q=${encodeURIComponent(`${tripPlan.city} attraction tickets`)}" target="_blank" rel="noopener noreferrer">Find tickets ↗</a></div></section>`;
}
function openDocumentStore() {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error('Secure browser storage is not available.')); return; }
        const request = indexedDB.open('tripaway-documents', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Could not open document storage.'));
    });
}
const documentDownloadUrls = new Set();
async function refreshDocuments() {
    const list = $('#documentList');
    if (!list) return;
    if (authenticatedUser && window.tripAwaySupabase) {
        list.onclick = async event => {
            const button = event.target.closest('.document-remove');
            if (!button) return;
            button.disabled = true;
            const { error: storageError } = await window.tripAwaySupabase.storage
                .from('travel-documents')
                .remove([button.dataset.path]);
            if (storageError) {
                console.error('Could not remove private travel document.', storageError);
                $('#tripStatus').textContent = 'Could not remove the cloud document.';
                button.disabled = false;
                return;
            }
            const { error } = await window.tripAwaySupabase.from('travel_documents')
                .delete()
                .eq('id', button.dataset.document)
                .eq('owner_id', authenticatedUser.id);
            if (error) {
                console.error('Could not remove travel document metadata.', error);
                $('#tripStatus').textContent = 'The file was removed, but its document record could not be deleted.';
                return;
            }
            refreshDocuments();
        };
        try {
            const { data, error } = await window.tripAwaySupabase.from('travel_documents')
                .select('id,storage_path,file_name')
                .eq('owner_id', authenticatedUser.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            list.replaceChildren();
            for (const documentRecord of data) {
                const { data: signed, error: urlError } = await window.tripAwaySupabase.storage
                    .from('travel-documents')
                    .createSignedUrl(documentRecord.storage_path, 300);
                if (urlError) {
                    console.error('Could not create a private document link.', urlError);
                    continue;
                }
                const article = document.createElement('article');
                const link = document.createElement('a');
                link.href = signed.signedUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = `${documentRecord.file_name} · Open`;
                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'document-remove';
                remove.dataset.document = documentRecord.id;
                remove.dataset.path = documentRecord.storage_path;
                remove.textContent = 'Remove';
                article.append(link, remove);
                list.append(article);
            }
            if (!data.length) list.textContent = 'No documents saved to your account yet.';
            else if (!list.childElementCount) list.textContent = 'Could not create private links for your documents.';
        } catch (error) {
            console.error('Could not load private travel documents.', error);
            list.textContent = 'Could not load documents from your account.';
        }
        return;
    }
    list.onclick = async event => {
        const button = event.target.closest('.document-remove');
        if (!button) return;
        try {
            const db = await openDocumentStore();
            const transaction = db.transaction('documents', 'readwrite');
            transaction.objectStore('documents').delete(Number(button.dataset.document));
            transaction.oncomplete = () => { db.close(); refreshDocuments(); };
            transaction.onerror = () => { db.close(); console.error('Could not remove saved document.', transaction.error); };
        } catch (error) { console.error('Could not remove saved document.', error); }
    };
    try {
        const db = await openDocumentStore();
        const request = db.transaction('documents', 'readonly').objectStore('documents').getAll();
        request.onsuccess = () => {
            documentDownloadUrls.forEach(url => URL.revokeObjectURL(url));
            documentDownloadUrls.clear();
            list.innerHTML = request.result.map(doc => {
                const url = URL.createObjectURL(doc.file);
                documentDownloadUrls.add(url);
                return `<article><a href="${url}" download="${escapeHtml(doc.name)}">${escapeHtml(doc.name)} · Download</a><button type="button" class="document-remove" data-document="${doc.id}">Remove</button></article>`;
            }).join('') || '<p class="trip-empty">No documents saved on this device.</p>';
            db.close();
        };
        request.onerror = () => { db.close(); list.textContent = 'Could not read saved documents.'; console.error('Could not read saved documents.', request.error); };
    } catch (error) {
        console.error('Could not load travel documents.', error);
        list.textContent = 'Document storage is unavailable in this browser or file:// preview.';
    }
}
function documentsMarkup() {
    const storageNote = authenticatedUser
        ? 'Files are uploaded to your private account storage. Keep another copy of important documents.'
        : 'Files are stored in this browser on this device only. Sign in to use private account storage.';
    return `<section class="trip-tools"><h4>Travel documents</h4><p class="trip-empty">${storageNote}</p><label class="document-picker">Add ticket, passport copy, or other file<input id="documentUpload" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"></label><div id="documentList" class="document-list">Loading saved documents…</div></section>`;
}
function tripBuilderMarkup(status = '') {
    const cityOptions = Object.keys(places).map(city => `<option value="${city}"${tripPlan.city === city ? ' selected' : ''}>${city}</option>`).join('');
    const dayOptions = Array.from({ length: tripPlan.days }, (_, index) => `<option value="${index + 1}">Day ${index + 1}</option>`).join('');
    const placeOptions = places[tripPlan.city].map(place => `<option value="${place[0]}">${place[0]} · ${place[1]}</option>`).join('');
    const dayCards = Array.from({ length: tripPlan.days }, (_, index) => {
        const day = index + 1;
        const stops = tripPlan.stops.filter(stop => stop.day === day);
        return `<section class="trip-day"><h4>Day ${day}<small>${stops.length} ${stops.length === 1 ? 'stop' : 'stops'}</small></h4>${stops.length ? stops.map(stop => `<article class="trip-stop"><span>${escapeHtml(stop.time)}</span><div><b>${escapeHtml(stop.name)}</b><small>${escapeHtml(stop.detail)}</small></div><button class="trip-remove" type="button" data-stop="${tripPlan.stops.indexOf(stop)}" aria-label="Remove ${escapeHtml(stop.name)}">×</button></article>`).join('') : '<p class="trip-empty">Add a place to this day.</p>'}</section>`;
    }).join('');
    return `<div class="trip-builder-head"><small>MY TRIPS${authenticatedUser ? ' · ACCOUNT' : ' · GUEST MODE'}</small><h3>Build your<br>own trip.</h3><p>Plan your itinerary, save offline, and share your trip.</p></div><div class="trip-builder-content">${savedTripCards()}<div class="trip-settings"><label>DESTINATION<select id="tripCity">${cityOptions}</select></label><label>DAYS<select id="tripDays">${[1, 2, 3].map(days => `<option value="${days}"${tripPlan.days === days ? ' selected' : ''}>${days} ${days === 1 ? 'day' : 'days'}</option>`).join('')}</select></label></div><form class="trip-add-form" id="tripAddForm"><label for="tripPlace">ADD A PLACE</label><div><select id="tripPlace">${placeOptions}</select><select id="tripDay" aria-label="Choose trip day">${dayOptions}</select><button type="submit" aria-label="Add place">+</button></div></form><div class="trip-days">${dayCards}</div><div class="trip-actions"><button type="button" id="saveTripPlan">Save to My trips</button><button type="button" id="shareTripPlan">Share link</button><button type="button" id="printTripPlan">Print / PDF</button></div><p class="trip-status" id="tripStatus" role="status" aria-live="polite">${escapeHtml(status || tripSyncStatus)}</p>${packingMarkup()}${documentsMarkup()}${bookingsMarkup()}</div>`;
}
function bindTripBuilder() {
    $('#tripCity').onchange = event => { tripPlan = createTrip(event.target.value, tripPlan.days); const saved = saveTripPlan(); renderTripBuilder(saved ? '' : 'Your changes could not be saved on this device.') };
    $('#tripDays').onchange = event => {
        const previousDays = tripPlan.days;
        tripPlan.days = Number(event.target.value);
        tripPlan.stops = tripPlan.stops.map(stop => ({ ...stop, day: Math.min(stop.day, tripPlan.days) }));
        for (let day = previousDays; day < tripPlan.days; day++) {
            const sourceStops = tripPlan.stops.filter(stop => stop.day === day);
            sourceStops.slice(Math.ceil(sourceStops.length / 2)).forEach(stop => { stop.day = day + 1 });
        }
        const saved = saveTripPlan();
        renderTripBuilder(saved ? '' : 'Your changes could not be saved on this device.');
    };
    $('#tripAddForm').onsubmit = event => {
        event.preventDefault();
        const place = places[tripPlan.city].find(item => item[0] === $('#tripPlace').value);
        const day = Number($('#tripDay').value);
        if (!place || !Number.isInteger(day) || day < 1 || day > tripPlan.days) return;
        const times = ['09:00', '12:00', '15:00', '18:00', '20:00'];
        const stopCount = tripPlan.stops.filter(stop => stop.day === day).length;
        tripPlan.stops.push({ name: place[0], detail: place[1], time: times[Math.min(stopCount, times.length - 1)], day });
        const saved = saveTripPlan();
        renderTripBuilder(saved ? 'Place added to your trip.' : 'Place added, but this trip could not be saved on this device.');
    };
    $('#screen').querySelectorAll('.trip-remove').forEach(button => button.onclick = () => {
        tripPlan.stops.splice(Number(button.dataset.stop), 1);
        const saved = saveTripPlan();
        renderTripBuilder(saved ? 'Place removed from your trip.' : 'Place removed, but this trip could not be saved on this device.');
    });
    $('#saveTripPlan').onclick = async () => {
        const saved = saveTripPlan() && saveTripToCollection();
        if (!saved) {
            $('#tripStatus').textContent = 'Could not save this trip on this device.';
            return;
        }
        if (authenticatedUser && window.tripAwaySupabase) {
            $('#tripStatus').textContent = 'Saving trip to your account…';
            try {
                await saveAccountTripSnapshot(authenticatedUser.id);
                renderTripBuilder('Trip saved on this device and to your account.');
            } catch (error) {
                console.error('Could not save trip snapshot to Supabase.', error);
                $('#tripStatus').textContent = 'Trip saved on this device, but account snapshot sync failed.';
            }
            return;
        }
        renderTripBuilder('Trip saved to My trips on this device.');
    };
    $('#shareTripPlan').onclick = shareTripPlan;
    $('#printTripPlan').onclick = printTripPlan;
    $('#screen').querySelectorAll('.saved-trip').forEach(button => button.onclick = () => {
        tripPlan = loadSavedTrips()[Number(button.dataset.savedTrip)] || tripPlan;
        const saved = saveTripPlan();
        renderTripBuilder(saved ? `Loaded your ${tripPlan.city} trip.` : 'Trip loaded, but could not be saved as the active itinerary.');
    });
    $('#screen').querySelectorAll('[data-packing]').forEach(input => input.onchange = () => {
        try {
            const checked = [...$('#screen').querySelectorAll('[data-packing]:checked')].map(item => Number(item.dataset.packing));
            localStorage.setItem(userScopedStorageKey(packingKey), JSON.stringify(checked));
            if (authenticatedUser) syncPackingItem(Number(input.dataset.packing), input.checked);
        } catch (error) {
            console.error('Could not save packing checklist.', error);
            $('#tripStatus').textContent = 'Could not save the packing checklist on this device.';
        }
    });
    $('#documentUpload').onchange = async event => {
        const file = event.target.files[0];
        if (!file) return;
        const allowedDocumentTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (file.size > 15 * 1024 * 1024 || !allowedDocumentTypes.includes(file.type)) {
            $('#tripStatus').textContent = 'Choose an image or PDF smaller than 15 MB.';
            event.target.value = '';
            return;
        }
        if (authenticatedUser && window.tripAwaySupabase) {
            if (!crypto.randomUUID) {
                $('#tripStatus').textContent = 'Secure file IDs are not supported in this browser.';
                return;
            }
            const userId = authenticatedUser.id;
            const extension = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
            const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
            try {
                const { error: uploadError } = await window.tripAwaySupabase.storage
                    .from('travel-documents')
                    .upload(storagePath, file, { contentType: file.type, upsert: false });
                if (uploadError) throw uploadError;
                const { error } = await window.tripAwaySupabase.from('travel_documents').insert({
                    owner_id: userId,
                    trip_id: remoteTripOwnerId === userId ? remoteTripId : null,
                    storage_path: storagePath,
                    file_name: file.name,
                    mime_type: file.type,
                    size_bytes: file.size
                });
                if (error) {
                    const { error: cleanupError } = await window.tripAwaySupabase.storage.from('travel-documents').remove([storagePath]);
                    if (cleanupError) console.error('Could not clean up an unlinked travel document.', cleanupError);
                    throw error;
                }
                $('#tripStatus').textContent = 'Document uploaded to your private account storage.';
                await refreshDocuments();
            } catch (error) {
                console.error('Could not upload private travel document.', error);
                $('#tripStatus').textContent = `Could not upload document: ${error.message || 'check your connection and storage setup.'}`;
            }
            return;
        }
        try {
            const db = await openDocumentStore();
            const transaction = db.transaction('documents', 'readwrite');
            transaction.objectStore('documents').add({ name: file.name, file, savedAt: new Date().toISOString() });
            transaction.oncomplete = () => { db.close(); refreshDocuments(); $('#tripStatus').textContent = 'Document saved in this browser on this device.'; };
            transaction.onerror = () => { db.close(); $('#tripStatus').textContent = 'Could not save this document.'; console.error('Could not save travel document.', transaction.error); };
        } catch (error) {
            console.error('Could not save travel document.', error);
            $('#tripStatus').textContent = 'Document storage is unavailable in this browser or file:// preview.';
        }
    };
    refreshDocuments();
}
function showTripSyncStatus(message) {
    tripSyncStatus = message;
    const status = $('#tripStatus') || $('#budgetStatus');
    if (status) status.textContent = message;
}
async function loadAccountTrip(userId) {
    const { data: rows, error } = await window.tripAwaySupabase
        .from('trips')
        .select('id,city,days,budget,updated_at')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);
    if (error) throw error;
    if (!rows.length) {
        remoteTripId = null;
        remoteTripOwnerId = userId;
        return null;
    }
    const row = rows[0];
    const [stopResult, expenseResult] = await Promise.all([
        window.tripAwaySupabase.from('trip_stops').select('name,detail,trip_day,stop_time,sort_order').eq('trip_id', row.id).order('sort_order'),
        window.tripAwaySupabase.from('expenses').select('description,amount,people_count,created_at').eq('trip_id', row.id).order('created_at')
    ]);
    if (stopResult.error) throw stopResult.error;
    if (expenseResult.error) throw expenseResult.error;
    const restored = normalizeTrip({
        city: row.city,
        days: Number(row.days),
        budget: Number(row.budget),
        stops: stopResult.data.map(stop => ({ name: stop.name, detail: stop.detail, day: Number(stop.trip_day), time: stop.stop_time })),
        expenses: expenseResult.data.map(expense => ({ description: expense.description, amount: Number(expense.amount), people: Number(expense.people_count) }))
    });
    if (!restored) throw new Error('The saved trip contains data this version of TripAway cannot display.');
    remoteTripId = row.id;
    remoteTripOwnerId = userId;
    return restored;
}
async function writeAccountTrip(userId, snapshot) {
    const supabase = window.tripAwaySupabase;
    if (!supabase || authenticatedUser?.id !== userId) return;
    const updatedAt = new Date().toISOString();
    if (remoteTripOwnerId !== userId) remoteTripId = null;
    if (!remoteTripId) {
        const { data: rows, error: findError } = await supabase
            .from('trips')
            .select('id')
            .eq('owner_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1);
        if (findError) throw findError;
        remoteTripId = rows[0]?.id || null;
        remoteTripOwnerId = userId;
    }
    const tripRow = { owner_id: userId, city: snapshot.city, days: snapshot.days, budget: snapshot.budget, updated_at: updatedAt };
    if (remoteTripId) {
        const { error } = await supabase.from('trips').update(tripRow).eq('id', remoteTripId).eq('owner_id', userId);
        if (error) throw error;
    } else {
        const { data, error } = await supabase.from('trips').insert(tripRow).select('id').single();
        if (error) throw error;
        remoteTripId = data.id;
        remoteTripOwnerId = userId;
    }
    const tripId = remoteTripId;
    const [deleteStops, deleteExpenses] = await Promise.all([
        supabase.from('trip_stops').delete().eq('trip_id', tripId),
        supabase.from('expenses').delete().eq('trip_id', tripId)
    ]);
    if (deleteStops.error) throw deleteStops.error;
    if (deleteExpenses.error) throw deleteExpenses.error;
    const stopRows = snapshot.stops.map((stop, index) => ({
        trip_id: tripId, name: stop.name, detail: stop.detail, trip_day: stop.day, stop_time: stop.time, sort_order: index
    }));
    const expenseRows = snapshot.expenses.map(expense => ({
        trip_id: tripId, description: expense.description, amount: expense.amount, people_count: expense.people
    }));
    const results = await Promise.all([
        stopRows.length ? supabase.from('trip_stops').insert(stopRows) : Promise.resolve({ error: null }),
        expenseRows.length ? supabase.from('expenses').insert(expenseRows) : Promise.resolve({ error: null })
    ]);
    if (results[0].error) throw results[0].error;
    if (results[1].error) throw results[1].error;
}
function queueTripPlanSync() {
    if (!authenticatedUser || !window.tripAwaySupabase) return;
    const userId = authenticatedUser.id;
    const snapshot = JSON.parse(JSON.stringify(tripPlan));
    tripSyncStatus = 'Saved on this device · syncing to your account…';
    const status = $('#tripStatus') || $('#budgetStatus');
    if (status) status.textContent = tripSyncStatus;
    tripSyncQueue = tripSyncQueue.catch(() => {}).then(async () => {
        await accountTripReady;
        if (authenticatedUser?.id !== userId) return;
        await writeAccountTrip(userId, snapshot);
        if (authenticatedUser?.id === userId && JSON.stringify(snapshot) === JSON.stringify(tripPlan)) {
            showTripSyncStatus('Synced with your account.');
        }
    }).catch(error => {
        console.error('Could not sync the trip with Supabase.', error);
        if (authenticatedUser?.id === userId) showTripSyncStatus('Saved on this device, but cloud sync failed. Check your connection and try again.');
    });
}
function renderCurrentTripView(status) {
    if (activeView === 'trips') renderTripBuilder(status);
    else if (activeView === 'budget') renderBudgetManager(status);
    else if (activeView === 'discover') renderMapView(status);
    else if (activeView === 'community') view('community');
    renderGuestImportOffer();
}
async function handleSupabaseSession(session) {
    const nextUser = session?.user || null;
    if (authenticatedUser?.id === nextUser?.id) return;
    if (nextUser && !authenticatedUser) {
        try {
            const storedGuestPreferences = JSON.parse(localStorage.getItem('tripaway-guest-preferences') || 'null');
            guestPreferencesOnSignIn = storedGuestPreferences
                ? normalizeUserPreferences(storedGuestPreferences)
                : readClientPreferences();
            localStorage.setItem('tripaway-guest-preferences', JSON.stringify(guestPreferencesOnSignIn));
        } catch (error) {
            console.error('Could not preserve guest preferences before sign-in.', error);
            guestPreferencesOnSignIn = readClientPreferences();
        }
    }
    const guestData = nextUser && !authenticatedUser ? readGuestImportData() : null;
    authenticatedUser = nextUser;
    accountPreferencesReady = false;
    prepareGuestImportOffer(nextUser?.id, guestData);
    remoteTripId = null;
    remoteTripOwnerId = null;
    const revisionAtLoad = tripPlanRevision;
    if (!nextUser) {
        let guestPreferences = guestPreferencesOnSignIn;
        if (!guestPreferences) {
            try {
                guestPreferences = JSON.parse(localStorage.getItem('tripaway-guest-preferences') || 'null');
            } catch (error) {
                console.error('Could not restore guest preferences after sign-out.', error);
            }
        }
        applyClientPreferences(guestPreferences || readClientPreferences());
        guestPreferencesOnSignIn = null;
        try {
            tripPlan = normalizeTrip(JSON.parse(localStorage.getItem(tripStorageKey))) || createTrip();
        } catch (error) {
            console.error('Could not restore guest trip data after sign-out.', error);
            tripPlan = createTrip();
        }
        tripSyncStatus = 'Trip data is stored on this device until you sign in.';
        renderCurrentTripView();
        return;
    }
    try {
        tripPlan = normalizeTrip(JSON.parse(localStorage.getItem(userScopedStorageKey(tripStorageKey)))) || createTrip();
    } catch (error) {
        console.error('Could not restore account trip data.', error);
        tripPlan = createTrip();
    }
    accountTripReady = (async () => {
        try {
            await loadAccountPreferences(nextUser.id, guestPreferencesOnSignIn || readClientPreferences());
        } catch (preferencesError) {
            console.error('Could not load account preferences from Supabase.', preferencesError);
            try {
                const cachedPreferences = JSON.parse(localStorage.getItem(`${accountPreferencesKey}:${nextUser.id}`) || 'null');
                if (cachedPreferences) {
                    applyClientPreferences(cachedPreferences);
                    if (activeView === 'today') {
                        $('#screen').innerHTML = plannerMarkup();
                        bindPlanner();
                    } else if (activeView === 'translate') {
                        $('#screen').innerHTML = translatorMarkup();
                    }
                }
            } catch (cacheError) {
                console.error('Could not restore cached account preferences.', cacheError);
            }
            accountPreferencesReady = true;
            if (authenticatedUser?.id === nextUser.id) {
                $('#authStatus').textContent = 'Preferences are available on this device; account sync needs the latest preferences migration.';
            }
        }
        if (authenticatedUser?.id !== nextUser.id) return;
        try {
            const cloudTrip = await loadAccountTrip(nextUser.id);
            if (authenticatedUser?.id !== nextUser.id) return;
            await loadAccountPackingItems(nextUser.id);
            if (authenticatedUser?.id !== nextUser.id) return;
            let savedTripMessage = '';
            try {
                await loadAccountSavedTrips(nextUser.id);
            } catch (savedTripError) {
                console.error('Could not load saved trip snapshots from Supabase.', savedTripError);
                savedTripMessage = ' Saved trip snapshots need the latest database migration.';
            }
            if (authenticatedUser?.id !== nextUser.id) return;
            if (tripPlanRevision === revisionAtLoad) {
                tripPlan = cloudTrip || tripPlan;
                try {
                    localStorage.setItem(userScopedStorageKey(tripStorageKey), JSON.stringify(tripPlan));
                } catch (storageError) {
                    console.error('Could not cache the account trip on this device.', storageError);
                }
            }
            tripSyncStatus = cloudTrip
                ? `Loaded and synced with your account.${savedTripMessage}`
                : `No cloud trip yet. Changes will sync to your account.${savedTripMessage}`;
            renderCurrentTripView(tripSyncStatus);
        } catch (error) {
            console.error('Could not load the account trip from Supabase.', error);
            if (authenticatedUser?.id === nextUser.id) {
                tripSyncStatus = 'Could not load cloud trip data. Your account-scoped device copy is shown.';
                renderCurrentTripView(tripSyncStatus);
            }
        }
    })();
    await accountTripReady;
}
function renderBudgetManager(status = '') {
    loadTripPlan();
    $('#screen').innerHTML = budgetViewMarkup(status);
    $('#screen').classList.add('budget-screen');
    bindBudgetManager();
    renderGuestImportOffer();
}
function bindBudgetManager() {
    $('#tripBudget').onchange = event => {
        const value = Number(event.target.value);
        if (!Number.isFinite(value) || value < 0 || value > 100000000) {
            $('#budgetStatus').textContent = 'Enter a budget between ₹0 and ₹100,000,000.';
            return;
        }
        tripPlan.budget = value;
        const saved = saveTripPlan();
        renderBudgetManager(saved ? 'Trip budget updated.' : 'Budget updated, but could not be saved on this device.');
    };
    $('#expenseForm').onsubmit = event => {
        event.preventDefault();
        const description = $('#expenseName').value.trim();
        const amount = Number($('#expenseAmount').value);
        const people = Number($('#expensePeople').value);
        if (!description || !Number.isFinite(amount) || amount <= 0 || amount > 10000000 || !Number.isInteger(people) || people < 1 || people > 100) {
            $('#budgetStatus').textContent = 'Enter an expense, a valid amount, and a group size from 1 to 100.';
            return;
        }
        tripPlan.expenses.push({ description, amount, people });
        const saved = saveTripPlan();
        renderBudgetManager(saved ? 'Expense added and split.' : 'Expense added, but could not be saved on this device.');
    };
    $('#screen').querySelectorAll('.expense-remove').forEach(button => button.onclick = () => {
        tripPlan.expenses.splice(Number(button.dataset.expense), 1);
        const saved = saveTripPlan();
        renderBudgetManager(saved ? 'Expense removed.' : 'Expense removed, but could not be saved on this device.');
    });
}
function renderTripBuilder(status = '') {
    loadTripPlan();
    $('#screen').innerHTML = tripBuilderMarkup(status);
    $('#screen').classList.add('trip-builder-screen');
    bindTripBuilder();
    renderGuestImportOffer();
}
async function shareTripPlan() {
    const sharedTrip = normalizeTrip(tripPlan);
    const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify({ city: sharedTrip.city, days: sharedTrip.days, stops: sharedTrip.stops }))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const shareUrl = new URL(location.href);
    shareUrl.searchParams.set('trip', encoded);
    try {
        await navigator.clipboard.writeText(shareUrl.href);
        $('#tripStatus').textContent = 'Shareable trip link copied. It includes itinerary stops only—not budgets, expenses, or documents.';
    } catch (error) {
        const buffer = document.createElement('textarea');
        buffer.value = shareUrl.href;
        buffer.setAttribute('readonly', '');
        buffer.style.position = 'fixed';
        buffer.style.opacity = '0';
        document.body.append(buffer);
        buffer.select();
        const copied = document.execCommand('copy');
        buffer.remove();
        $('#tripStatus').textContent = copied ? 'Shareable trip link copied. It includes itinerary stops only—not budgets, expenses, or documents.' : 'Could not copy the link. Please try again.';
        if (!copied) console.error('Could not copy the trip link.', error);
    }
}
function printTripPlan() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { $('#tripStatus').textContent = 'Allow pop-ups to print or save this trip as a PDF.'; return; }
    const days = Array.from({ length: tripPlan.days }, (_, index) => {
        const stops = tripPlan.stops.filter(stop => stop.day === index + 1);
        return `<section><h2>Day ${index + 1}</h2>${stops.map(stop => `<p><b>${escapeHtml(stop.time)} · ${escapeHtml(stop.name)}</b><br>${escapeHtml(stop.detail)}</p>`).join('') || '<p>No places planned.</p>'}</section>`;
    }).join('');
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(tripPlan.city)} itinerary</title><style>body{font:16px Arial,sans-serif;max-width:760px;margin:40px auto;color:#172b3b}h1{font-size:32px}section{break-inside:avoid;border-top:1px solid #ccc;padding:12px 0}p{line-height:1.6}</style></head><body><h1>${escapeHtml(tripPlan.days)}-day trip to ${escapeHtml(tripPlan.city)}</h1>${days}<script>addEventListener('load',()=>print())<\/script></body></html>`);
    printWindow.document.close();
}
const destinationCoordinates = {
    Jaipur: [26.9239, 75.8267], Mumbai: [18.9220, 72.8347], Delhi: [28.6129, 77.2295],
    Coorg: [12.4244, 75.7382], Hampi: [15.3350, 76.4600], Gokarna: [14.5479, 74.3188],
    Ziro: [27.5450, 93.8193], Tawang: [27.5860, 91.8594], Mechuka: [28.6010, 94.1260],
    Majuli: [26.9500, 94.1666], Mandu: [22.3333, 75.4000], Orchha: [25.3519, 78.6417],
    Munnar: [10.0889, 77.0595], Kutch: [23.8170, 69.1230], Dzukou: [25.5500, 94.0830]
};
const travelModes = [['driving', 'Drive'], ['walking', 'Walk'], ['transit', 'Transit'], ['bicycling', 'Cycle']];
let directionsMode = 'driving';
function directionsPlaceName(stopName) {
    const placeNames = {
        'Breakfast at Tapri Central': 'Tapri Central',
        'Explore Hawa Mahal': 'Hawa Mahal',
        'Lunch at LMB': 'Laxmi Misthan Bhandar',
        'Golden hour at Nahargarh': 'Nahargarh Fort',
        'Breakfast at Kala Ghoda Cafe': 'Kala Ghoda Cafe',
        'Explore Gateway of India': 'Gateway of India',
        'Lunch at Bademiya': 'Bademiya',
        'Sunset at Marine Drive': 'Marine Drive',
        'Breakfast at Indian Coffee House': 'Indian Coffee House',
        'Explore India Gate': 'India Gate',
        'Lunch at Karim’s': 'Karim’s',
        'Discover Lodhi Garden': 'Lodhi Garden'
    };
    return placeNames[stopName] || stopName;
}
function mapViewMarkup(status = '') {
    const [latitude, longitude] = destinationCoordinates[tripPlan.city];
    const bbox = `${longitude - 0.04},${latitude - 0.025},${longitude + 0.04},${latitude + 0.025}`;
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
    const cityOptions = Object.keys(destinationCoordinates).map(city => `<option value="${city}"${tripPlan.city === city ? ' selected' : ''}>${city}</option>`).join('');
    const modeOptions = travelModes.map(([mode, label]) => `<option value="${mode}"${directionsMode === mode ? ' selected' : ''}>${label}</option>`).join('');
    const routes = tripPlan.stops.map(stop => {
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${directionsPlaceName(stop.name)}, ${tripPlan.city}, India`)}&travelmode=${directionsMode}`;
        return `<article class="map-stop"><span>${escapeHtml(stop.time)}</span><div><b>${escapeHtml(stop.name)}</b><small>Day ${stop.day} · ${escapeHtml(stop.detail)}</small></div><a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" aria-label="Get directions to ${escapeHtml(stop.name)}">Go ↗</a></article>`;
    }).join('');
    const discovery = (places[tripPlan.city] || []).map((place, index) => {
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${place[0]}, ${tripPlan.city}, India`)}&travelmode=${directionsMode}`;
        return `<article class="map-stop"><span>${place[1] === 'Food' ? 'Food' : place[1] === 'Stay' ? 'Stay' : 'Visit'}</span><div><b>${escapeHtml(place[0])}</b><small>${escapeHtml(place[2])}</small></div><a href="${directionsUrl}" target="_blank" rel="noopener noreferrer">Go ↗</a><button type="button" class="discover-add" data-discover-place="${index}">Add</button></article>`;
    }).join('');
    return `<div class="map-app-head"><small>DISCOVER · MAP & DIRECTIONS</small><h3>Explore ${escapeHtml(tripPlan.city)}.</h3><p>Browse nearby ideas, map your trip, and find directions.</p></div><div class="map-app-content"><label class="map-city-picker">DESTINATION<select id="mapCity" aria-label="Map destination">${cityOptions}</select></label><iframe class="trip-map-frame" title="Map centered on ${escapeHtml(tripPlan.city)}, India" src="${mapUrl}" loading="lazy" referrerpolicy="no-referrer"></iframe><p class="map-credit">Map data © OpenStreetMap contributors. Map tiles and directions need an internet connection; saved itineraries remain on this device.</p><div class="map-routes-heading"><h4>Planned places <small>${tripPlan.stops.length} stops</small></h4><label>TRAVEL BY<select id="directionsMode" aria-label="Travel mode">${modeOptions}</select></label></div>${routes ? `<div class="map-stops">${routes}</div>` : '<p class="map-empty">No places planned yet. Add stops in My trips to see them here.</p>'}<div class="map-discovery"><h4>Places to discover in ${escapeHtml(tripPlan.city)}</h4>${discovery || '<p class="map-empty">No curated places are listed for this destination yet.</p>'}</div><p class="map-app-status" id="mapStatus" role="status" aria-live="polite">${status || 'Google Maps can use your current location when available.'}</p><button type="button" class="map-build-link" id="openMyTrips">Edit My trips</button><section class="emergency-panel"><h4>Emergency information · India</h4><p>Call <a href="tel:112">112</a> for the national emergency response number. If safe, also contact local services.</p><div><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/hospitals+near+${encodeURIComponent(tripPlan.city)}">Find hospitals ↗</a><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/police+station+near+${encodeURIComponent(tripPlan.city)}">Find police ↗</a><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/search?q=MEA+India+embassies+and+consulates">Embassy contacts ↗</a></div><small>Search results may be incomplete or outdated. Confirm local emergency services.</small></section></div>`;
}
function renderMapView(status = '') {
    loadTripPlan();
    $('#screen').innerHTML = mapViewMarkup(status);
    $('#mapCity').onchange = event => {
        tripPlan = createTrip(event.target.value, tripPlan.days);
        const saved = saveTripPlan();
        renderMapView(saved ? '' : 'Destination changed, but your trip could not be saved on this device.');
    };
    $('#directionsMode').onchange = event => {
        directionsMode = event.target.value;
        renderMapView();
    };
    $('#openMyTrips').onclick = () => view('trips');
    $('#screen').querySelectorAll('.discover-add').forEach(button => button.onclick = () => {
        const place = places[tripPlan.city][Number(button.dataset.discoverPlace)];
        if (!place) return;
        const stops = tripPlan.stops.filter(stop => stop.day === 1);
        const times = ['09:00', '12:00', '15:00', '18:00', '20:00'];
        tripPlan.stops.push({ name: place[0], detail: itineraryData[tripPlan.city] ? place[1] : `${place[1]} · ${tripPlan.city}`, time: times[Math.min(stops.length, times.length - 1)], day: 1 });
        const saved = saveTripPlan();
        renderMapView(saved ? `${place[0]} added to My trips.` : 'Place added but could not be saved on this device.');
    });
    renderGuestImportOffer();
}
const views = {
    discover: '',
    trips: '',
    budget: '',
    today: plannerMarkup(),
    community: `<div class="community-head"><small>TRIPAWAY COMMUNITY · ${authenticatedUser ? 'YOUR ACCOUNT' : 'GUEST MODE'}</small><h3>Stories from<br>the road.</h3></div><div class="community-feed"><article class="community-review"><div class="review-top"><small>TRIP COMPLETED · VERIFIED</small><h3>How was Jaipur?</h3></div><div class="app-body"><div class="video-review"><div class="review-play">▶</div><div class="review-person"><span>SK</span><div><b>Shreya Kapoor</b><small><strong>✓ Verified visitor</strong> · Hawa Mahal</small></div></div></div><div class="ai-note"><b>✦ Review highlights</b><p>“Go early for the quietest views. The surrounding streets are the real experience.”</p></div></div></article><div id="communityReviews"></div><article><div class="community-photo photo-one"><span>♥ 124</span></div><div class="community-person"><i>RM</i><div><b>Riya Mehta</b><small>Jaipur · 2 days ago</small></div></div><p>Sunrise from Nahargarh felt like the whole city was waking up at once. ✦</p></article><article><div class="community-photo photo-two"><span>♥ 86</span></div><div class="community-person"><i>AK</i><div><b>Arjun Khanna</b><small>Mumbai · 4 days ago</small></div></div><p>Found my favourite chai stop through the TripAway community.</p></article><button class="record-button">＋ Share a review</button></div>`,
    translate: '',
    currency: ''
};
const phrasebook = {
    hi: [['नमस्ते', 'Hello'], ['यह कितने का है?', 'How much is this?'], ['शाकाहारी भोजन कहाँ मिलेगा?', 'Where can I find vegetarian food?'], ['मुझे मदद चाहिए।', 'I need help.'], ['निकटतम अस्पताल कहाँ है?', 'Where is the nearest hospital?']],
    es: [['Hola', 'Hello'], ['¿Cuánto cuesta?', 'How much is this?'], ['¿Dónde hay comida vegetariana?', 'Where can I find vegetarian food?'], ['Necesito ayuda.', 'I need help.'], ['¿Dónde está el hospital más cercano?', 'Where is the nearest hospital?']],
    fr: [['Bonjour', 'Hello'], ['Combien ça coûte ?', 'How much is this?'], ['Où trouver de la nourriture végétarienne ?', 'Where can I find vegetarian food?'], ["J'ai besoin d'aide.", 'I need help.'], ["Où est l'hôpital le plus proche ?", 'Where is the nearest hospital?']],
    de: [['Hallo', 'Hello'], ['Wie viel kostet das?', 'How much is this?'], ['Wo gibt es vegetarisches Essen?', 'Where can I find vegetarian food?'], ['Ich brauche Hilfe.', 'I need help.'], ['Wo ist das nächste Krankenhaus?', 'Where is the nearest hospital?']],
    ar: [['مرحباً', 'Hello'], ['كم السعر؟', 'How much is this?'], ['أين أجد طعاماً نباتياً؟', 'Where can I find vegetarian food?'], ['أحتاج إلى مساعدة.', 'I need help.'], ['أين أقرب مستشفى؟', 'Where is the nearest hospital?']],
    pt: [['Olá', 'Hello'], ['Quanto custa?', 'How much is this?'], ['Onde encontro comida vegetariana?', 'Where can I find vegetarian food?'], ['Preciso de ajuda.', 'I need help.'], ['Onde fica o hospital mais próximo?', 'Where is the nearest hospital?']],
    ja: [['こんにちは', 'Hello'], ['これはいくらですか？', 'How much is this?'], ['ベジタリアン料理はどこですか？', 'Where can I find vegetarian food?'], ['助けが必要です。', 'I need help.'], ['最寄りの病院はどこですか？', 'Where is the nearest hospital?']],
    zh: [['你好', 'Hello'], ['这个多少钱？', 'How much is this?'], ['哪里有素食？', 'Where can I find vegetarian food?'], ['我需要帮助。', 'I need help.'], ['最近的医院在哪里？', 'Where is the nearest hospital?']]
};
const defaultPhrases = [['Hello', 'Hello'], ['How much is this?', 'How much is this?'], ['Where can I find vegetarian food?', 'Where can I find vegetarian food?'], ['I need help.', 'I need help.'], ['Where is the nearest hospital?', 'Where is the nearest hospital?']];
const phrasebookLanguages = [['en', 'English'], ['hi', 'हिन्दी'], ['es', 'Español'], ['fr', 'Français'], ['de', 'Deutsch'], ['ar', 'العربية'], ['pt', 'Português'], ['ja', '日本語'], ['zh', '中文']];
function translatorMarkup() {
    const code = localStorage.getItem('tripaway-translator-language') || localStorage.getItem('tripaway-language') || 'en';
    const language = phrasebookLanguages.find(([languageCode]) => languageCode === code) || phrasebookLanguages[0];
    const phrases = phrasebook[language[0]] || defaultPhrases;
    const options = phrasebookLanguages.map(([languageCode, name]) => `<option value="${languageCode}"${languageCode === language[0] ? ' selected' : ''}>${name}</option>`).join('');
    return `<div class="translator-head"><div class="translator-language"><small>TRIPAWAY LANGUAGE KIT</small><label class="visually-hidden" for="phraseLanguage">Phrase language</label><select id="phraseLanguage" aria-label="Choose phrase language">${options}</select></div><h3>Travel with<br>confidence.</h3><p>Offline phrases for moments when words get difficult.</p></div><div class="phrase-list">${phrases.map(x => `<article><div><b>${x[0]}</b><small>${x[1]}</small></div><button class="speak-phrase" data-phrase="${x[0]}" data-language="${language[0]}" aria-label="Speak phrase">🔊</button><button class="copy-phrase" data-phrase="${x[0]}" aria-label="Copy phrase">▣</button></article>`).join('')}</div><p id="translatorStatus" class="translator-status">Tap the speaker to say a phrase aloud.</p>`;
}
const currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'CAD', 'AUD', 'CHF'];
function currencyMarkup() {
    const options = currencies.map(currency => `<option value="${currency}">${currency}</option>`).join('');
    return `<div class="translator-head currency-head"><small>ONLINE CURRENCY CONVERTER</small><h3>Know what<br>it costs.</h3><p>Convert with the latest available exchange rates.</p></div><form id="currencyForm" class="currency-form"><label>AMOUNT<input id="currencyAmount" type="number" min="0.01" max="100000000" step="any" value="100" required></label><label>FROM<select id="currencyFrom">${options}</select></label><label>TO<select id="currencyTo">${options.replace('value="INR"', 'value="INR" selected')}</select></label><button type="submit">Convert</button><p id="currencyResult" role="status" aria-live="polite">Rates are provided by Frankfurter and require an internet connection.</p><small>Reference rates update daily. They are estimates, not live trading rates.</small></form>`;
}
function renderCurrency() {
    $('#screen').innerHTML = currencyMarkup();
    $('#screen').classList.add('translator-screen');
    const form = $('#currencyForm');
    const button = form.querySelector('button[type="submit"]');
    let activeRequest;
    let requestId = 0;
    form.onsubmit = async event => {
        event.preventDefault();
        const amount = Number($('#currencyAmount').value);
        const from = $('#currencyFrom').value;
        const to = $('#currencyTo').value;
        const result = $('#currencyResult');
        if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
            result.textContent = 'Enter an amount greater than 0 and no more than 100,000,000.';
            return;
        }
        activeRequest?.abort();
        const controller = new AbortController();
        activeRequest = controller;
        const currentRequestId = ++requestId;
        button.disabled = true;
        button.textContent = 'Getting latest rate…';
        result.textContent = 'Fetching the latest available exchange rate…';
        if (from === to) {
            result.textContent = `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to} (same currency).`;
            button.disabled = false;
            button.textContent = 'Convert';
            return;
        }
        try {
            const response = await fetch(`https://api.frankfurter.dev/v2/rates?base=${encodeURIComponent(from)}&quotes=${encodeURIComponent(to)}`, { signal: controller.signal });
            const data = await response.json();
            if (!response.ok) {
                const reason = typeof data?.message === 'string' ? ` ${data.message}` : '';
                throw new Error(`Exchange-rate service returned ${response.status}.${reason}`);
            }
            const rate = Array.isArray(data) ? data.find(item => item.base === from && item.quote === to) : null;
            if (!rate || !Number.isFinite(rate.rate) || rate.rate <= 0 || typeof rate.date !== 'string') {
                throw new Error('The exchange-rate service returned an invalid rate.');
            }
            const converted = amount * rate.rate;
            const rateDate = new Date(`${rate.date}T00:00:00`).toLocaleDateString();
            if (currentRequestId === requestId) {
                result.textContent = `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${from} ≈ ${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to} · rate dated ${rateDate}`;
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Could not fetch the currency exchange rate.', error);
            if (currentRequestId === requestId) result.textContent = 'Could not get the exchange rate. Check your internet connection and try again.';
        } finally {
            if (currentRequestId === requestId) {
                button.disabled = false;
                button.textContent = 'Convert';
            }
        }
    };
}
let activeView = 'discover';
function view(n) {
    activeView = n;
    $('#screen').innerHTML = views[n];
    $('#signIn').innerHTML = authenticatedUser ? 'Sign out <i>↗</i>' : 'Sign in <i>↗</i>';
    $('#screen').classList.toggle('translator-screen', n === 'translate');
    $('#screen').classList.toggle('trip-builder-screen', n === 'trips');
    $('#screen').classList.toggle('budget-screen', n === 'budget');
    $('#screen').classList.toggle('map-app-screen', n === 'discover');
    $('#screen').classList.toggle('community-screen', n === 'community');
    if (n === 'community') {
        $('#screen .community-head small').textContent = `TRIPAWAY COMMUNITY · ${authenticatedUser ? 'YOUR ACCOUNT' : 'GUEST MODE'}`;
        renderCommunityReviews();
    }
    if (n === 'translate') $('#screen').innerHTML = translatorMarkup();
    if (n === 'trips') renderTripBuilder();
    if (n === 'budget') renderBudgetManager();
    if (n === 'discover') renderMapView();
    if (n === 'currency') renderCurrency();
    renderGuestImportOffer();
    document.querySelectorAll('.tabs button').forEach(button => button.classList.toggle('active', button.dataset.view === n));
    if (n === 'today') {
        $('#screen').innerHTML = plannerMarkup();
        bindPlanner();
    }
}
view('discover');
document.querySelectorAll('.tabs button').forEach(button => button.onclick = () => view(button.dataset.view));
document.addEventListener('click', event => {
    const speak = event.target.closest('.speak-phrase'), copy = event.target.closest('.copy-phrase');
    if (speak) { if ('speechSynthesis' in window) { const utterance = new SpeechSynthesisUtterance(speak.dataset.phrase); utterance.lang = speak.dataset.language; speechSynthesis.cancel(); speechSynthesis.speak(utterance) } else $('#translatorStatus').textContent = 'Speech is not supported in this browser.' }
    if (copy) navigator.clipboard?.writeText(copy.dataset.phrase).then(() => { $('#translatorStatus').textContent = 'Phrase copied. Show it to someone nearby.' }).catch(() => { $('#translatorStatus').textContent = 'Select the phrase manually to copy it.' });
});
document.addEventListener('languageChanged', event => {
    $('#signIn').innerHTML = authenticatedUser ? 'Sign out <i>↗</i>' : 'Sign in <i>↗</i>';
    if (activeView === 'translate') $('#screen').innerHTML = translatorMarkup();
    persistUserPreferences({ app_language: event.detail?.code || localStorage.getItem('tripaway-language') });
});
document.addEventListener('change', event => {
    if (event.target.id !== 'phraseLanguage') return;
    localStorage.setItem('tripaway-translator-language', event.target.value);
    persistUserPreferences({ translator_language: event.target.value });
    $('#screen').innerHTML = translatorMarkup();
});
const dialog = $('#dialog');
let authMode = 'signin';
function renderAuthMode() {
    const creatingAccount = authMode === 'signup';
    $('#authSubmit').innerHTML = creatingAccount ? 'Create account <span>→</span>' : 'Sign in <span>→</span>';
    $('#authPassword').autocomplete = creatingAccount ? 'new-password' : 'current-password';
    $('#authModeToggle').textContent = creatingAccount ? 'Already have an account? Sign in' : 'New to TripAway? Create an account';
    $('#authStatus').textContent = window.tripAwaySupabase
        ? 'Your account lets you access your saved TripAway data.'
        : 'Guest mode is available now. Configure Supabase to enable account-backed features.';
}
function renderAuthState(session) {
    const user = session?.user || null;
    $('#signIn').innerHTML = user ? 'Sign out <i>↗</i>' : 'Sign in <i>↗</i>';
    if (user && dialog.open) {
        $('#authStatus').textContent = `Signed in as ${user.email || 'your account'}.`;
        setTimeout(() => { if (dialog.open) dialog.close() }, 700);
    }
}
$('#signIn').onclick = async () => {
    if (authenticatedUser && window.tripAwaySupabase) {
        $('#signIn').disabled = true;
        const { error } = await window.tripAwaySupabase.auth.signOut();
        $('#signIn').disabled = false;
        if (error) {
            console.error('Could not sign out.', error);
            return;
        }
    } else {
        renderAuthMode();
        dialog.showModal();
    }
};
$('[data-dialog]').onclick = () => { renderAuthMode(); dialog.showModal() };
$('#closeAuth').onclick = () => dialog.close();
$('#authModeToggle').onclick = () => { authMode = authMode === 'signin' ? 'signup' : 'signin'; renderAuthMode() };
$('#authForm').onsubmit = async event => {
    event.preventDefault();
    const status = $('#authStatus');
    const submit = $('#authSubmit');
    if (!window.tripAwaySupabase) {
        status.textContent = 'Supabase is not configured yet. Add the project URL and public anon key to supabase-config.js.';
        return;
    }
    submit.disabled = true;
    status.textContent = authMode === 'signup' ? 'Creating your account…' : 'Signing in…';
    try {
        const credentials = { email: $('#authEmail').value.trim(), password: $('#authPassword').value };
        const { data, error } = authMode === 'signup'
            ? await window.tripAwaySupabase.auth.signUp(credentials)
            : await window.tripAwaySupabase.auth.signInWithPassword(credentials);
        if (error) throw error;
        if (authMode === 'signup' && !data.session) {
            status.textContent = 'Account created. Check your email to confirm it, then sign in.';
        } else if (data.session) {
            renderAuthState(data.session);
            status.textContent = 'Signed in successfully.';
        } else {
            status.textContent = 'Authentication completed without an active session. Please sign in.';
        }
    } catch (error) {
        console.error('Could not authenticate with Supabase.', error);
        status.textContent = error.message || 'Could not authenticate. Please try again.';
    } finally {
        submit.disabled = false;
    }
};
if (window.tripAwaySupabase) {
    window.tripAwaySupabase.auth.getSession().then(async ({ data, error }) => {
        if (error) {
            console.error('Could not restore the Supabase session.', error);
            $('#authStatus').textContent = 'Could not restore your session. Please sign in again.';
            return;
        }
        renderAuthState(data.session);
        await handleSupabaseSession(data.session);
    });
    window.tripAwaySupabase.auth.onAuthStateChange((_event, session) => {
        renderAuthState(session);
        setTimeout(() => { handleSupabaseSession(session).catch(error => console.error('Could not load account data.', error)); }, 0);
    });
}
$('#contactForm').onsubmit = async event => {
    event.preventDefault();
    const form = event.target;
    const submit = form.querySelector('button[type="submit"]');
    const status = $('#message');
    if (!window.tripAwaySupabase) {
        status.textContent = 'Contact submissions are unavailable right now. Please try again later.';
        return;
    }
    submit.disabled = true;
    status.textContent = 'Sending your note…';
    try {
        const { error } = await window.tripAwaySupabase.rpc('submit_contact_message', {
            p_name: $('#contactName').value.trim(),
            p_email: $('#contactEmail').value.trim(),
            p_message: $('#contactMessage').value.trim()
        });
        if (error) throw error;
        status.textContent = 'Thanks — your message has been sent.';
        form.reset();
    } catch (error) {
        console.error('Could not submit the contact message.', error);
        status.textContent = error.message || 'Could not send your message. Please try again later.';
    } finally {
        submit.disabled = false;
    }
}; let io = new IntersectionObserver(x => x.forEach(y => { if (y.isIntersecting) { y.target.classList.add('in'); io.unobserve(y.target) } }), { threshold: .12 }); document.querySelectorAll('.reveal').forEach(x => io.observe(x)); addEventListener('scroll', () => $('#header').classList.toggle('scroll', scrollY > 30), { passive: true });
const reviewDialog = $('#reviewDialog'), reviewPreview = $('#reviewPreview'), reviewStatus = $('#reviewCaptureStatus');
let reviewStream, reviewRecorder, reviewChunks = [], reviewVideo;
document.addEventListener('click', event => { if (event.target.closest('.record-button')) reviewDialog.showModal() });
$('#closeReview').onclick = () => { if (reviewStream) reviewStream.getTracks().forEach(track => track.stop()); reviewDialog.close() };
let communityRenderVersion = 0;
async function renderCommunityReviews() {
    const container = $('#communityReviews');
    if (!container) return;
    const renderVersion = ++communityRenderVersion;
    let reviews = [];
    if (authenticatedUser && window.tripAwaySupabase) {
        container.textContent = 'Loading community reviews…';
        try {
            const { data, error } = await window.tripAwaySupabase.from('reviews')
                .select('id,author_id,place,rating,body,video_path,status,created_at')
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            reviews = data.map(review => ({
                ...review,
                text: review.body,
                publishedAt: review.created_at,
                isOwn: review.author_id === authenticatedUser.id
            }));
        } catch (error) {
            console.error('Could not load community reviews from Supabase.', error);
            if (renderVersion === communityRenderVersion) container.textContent = 'Could not load community reviews. Please try again.';
            return;
        }
    } else {
        try {
            reviews = JSON.parse(localStorage.getItem(communityReviewStorageKey) || '[]');
            if (!Array.isArray(reviews)) throw new TypeError('Saved reviews are not a list.');
        } catch (error) {
            console.error('Could not load saved community reviews.', error);
            container.textContent = 'Saved community reviews could not be loaded.';
            return;
        }
    }
    if (renderVersion !== communityRenderVersion || !container.isConnected) return;
    container.replaceChildren();
    for (const review of reviews) {
        if (!review || typeof review.place !== 'string' || typeof review.text !== 'string' || !Number.isInteger(Number(review.rating))) continue;
        const article = document.createElement('article');
        const person = document.createElement('div');
        person.className = 'community-person';
        const initials = document.createElement('i');
        initials.textContent = 'GT';
        const details = document.createElement('div');
        const name = document.createElement('b');
        name.textContent = review.isOwn ? 'Your review' : 'TripAway traveller';
        const meta = document.createElement('small');
        const date = new Date(review.publishedAt);
        const pending = review.status === 'pending' ? ' · Pending moderation' : '';
        meta.textContent = `${review.place} · ${Number.isNaN(date.getTime()) ? 'Just now' : date.toLocaleDateString()}${pending}`;
        details.append(name, meta);
        person.append(initials, details);
        const rating = document.createElement('p');
        rating.className = 'community-rating';
        rating.textContent = `${'★'.repeat(Math.min(5, Math.max(1, Number(review.rating))))}${'☆'.repeat(5 - Math.min(5, Math.max(1, Number(review.rating))))}`;
        const text = document.createElement('p');
        text.textContent = review.text;
        article.append(person, rating, text);
        if (review.video_path && authenticatedUser && window.tripAwaySupabase) {
            const { data: signed, error } = await window.tripAwaySupabase.storage.from('review-videos').createSignedUrl(review.video_path, 300);
            if (error) console.error('Could not create a private review video link.', error);
            else {
                const video = document.createElement('video');
                video.className = 'community-review-video';
                video.controls = true;
                video.preload = 'metadata';
                video.src = signed.signedUrl;
                article.append(video);
            }
        }
        if (renderVersion !== communityRenderVersion || !container.isConnected) return;
        container.append(article);
    }
}
$('#startRecording').onclick = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { reviewStatus.textContent = 'Camera recording is not supported here. You can still share your written review or choose a video file.'; return }
    try {
        reviewStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        reviewPreview.hidden = false; reviewPreview.srcObject = reviewStream; reviewPreview.muted = true; await reviewPreview.play();
        reviewChunks = []; reviewRecorder = new MediaRecorder(reviewStream); reviewRecorder.start(); reviewVideo = null;
        $('#startRecording').disabled = true; $('#stopRecording').disabled = false; reviewStatus.textContent = 'Recording… tap Stop when you are done (30 seconds max).';
        setTimeout(() => { if (reviewRecorder?.state === 'recording') $('#stopRecording').click() }, 30000);
    } catch (error) { console.error('Could not start review video recording.', error); reviewStatus.textContent = 'Camera access was not granted. You can still share your written review or choose a video file.' }
};
$('#stopRecording').onclick = () => {
    if (!reviewRecorder || reviewRecorder.state !== 'recording') return;
    reviewRecorder.ondataavailable = event => { if (event.data.size) reviewChunks.push(event.data) };
    reviewRecorder.onstop = () => { reviewVideo = new Blob(reviewChunks, { type: reviewRecorder.mimeType }); reviewPreview.srcObject = null; reviewPreview.src = URL.createObjectURL(reviewVideo); reviewPreview.controls = true; reviewStatus.textContent = 'Video ready (optional). Your review can be shared with or without it.'; $('#startRecording').disabled = false; $('#stopRecording').disabled = true; reviewStream?.getTracks().forEach(track => track.stop()) };
    reviewRecorder.stop();
};
$('#reviewUpload').onchange = event => { const file = event.target.files[0]; if (!file) return; reviewVideo = file; reviewPreview.hidden = false; reviewPreview.srcObject = null; reviewPreview.src = URL.createObjectURL(file); reviewPreview.controls = true; reviewStatus.textContent = `${file.name} is ready (optional). Your written review can still be shared without a video.` };
$('#reviewForm').onsubmit = async event => {
    event.preventDefault();
    const review = { place: $('#reviewPlace').value.trim(), rating: Number($('#reviewRating').value), text: $('#reviewText').value.trim(), publishedAt: new Date().toISOString() };
    if (!review.text) { $('#reviewFormStatus').textContent = 'Write a few words about your visit before sharing.'; return }
    const submitButton = $('#reviewForm').querySelector('button[type="submit"]');
    submitButton.disabled = true;
    if (authenticatedUser && window.tripAwaySupabase) {
        let storagePath = null;
        try {
            const rowId = crypto.randomUUID();
            let videoMimeType = null;
            if (reviewVideo) {
                if (reviewVideo.size > 50 * 1024 * 1024) throw new Error('Review videos must be 50 MB or smaller.');
                videoMimeType = reviewVideo.type.split(';')[0].toLowerCase();
                const extensions = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
                const extension = extensions[videoMimeType];
                if (!extension) throw new Error('Choose an MP4, WebM, or MOV video.');
                storagePath = `${authenticatedUser.id}/${rowId}.${extension}`;
                const { error: uploadError } = await window.tripAwaySupabase.storage.from('review-videos')
                    .upload(storagePath, reviewVideo, { contentType: videoMimeType, upsert: false });
                if (uploadError) throw uploadError;
            }
            const { error } = await window.tripAwaySupabase.from('reviews').insert({
                id: rowId,
                author_id: authenticatedUser.id,
                place: review.place,
                rating: review.rating,
                body: review.text,
                video_path: storagePath,
                status: 'pending'
            });
            if (error) {
                if (storagePath) {
                    const { error: cleanupError } = await window.tripAwaySupabase.storage.from('review-videos').remove([storagePath]);
                    if (cleanupError) console.error('Could not clean up an unlinked review video.', cleanupError);
                }
                throw error;
            }
            $('#reviewFormStatus').textContent = 'Review submitted for moderation before it appears publicly.';
            if (activeView === 'community') renderCommunityReviews();
            setTimeout(() => reviewDialog.close(), 900);
        } catch (error) {
            console.error('Could not submit the review to Supabase.', error);
            $('#reviewFormStatus').textContent = error.message || 'Could not submit your review. Please try again.';
        } finally {
            submitButton.disabled = false;
        }
        return;
    }
    try {
        const reviews = JSON.parse(localStorage.getItem(communityReviewStorageKey) || '[]');
        if (!Array.isArray(reviews)) throw new TypeError('Saved reviews are not a list.');
        reviews.unshift(review);
        localStorage.setItem(communityReviewStorageKey, JSON.stringify(reviews));
    } catch (error) {
        console.error('Could not save community review.', error);
        $('#reviewFormStatus').textContent = 'Your review could not be saved on this device. Please try again.';
        submitButton.disabled = false;
        return;
    }
    if (activeView === 'community') renderCommunityReviews();
    $('#reviewFormStatus').textContent = 'Your review has been shared with the community on this device.';
    setTimeout(() => reviewDialog.close(), 700);
    submitButton.disabled = false;
};
if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
    navigator.serviceWorker.register('./service-worker.js').catch(error => console.error('Could not enable offline app-shell support.', error));
}
