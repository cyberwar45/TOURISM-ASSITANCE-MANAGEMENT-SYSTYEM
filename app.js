const $ = s => document.querySelector(s);
const reviewStorageKey = 'tripaway-video-review';
const places = { Jaipur: [['Hawa Mahal', 'Landmark', 'The iconic Palace of Winds with its extraordinary honeycomb façade.'], ['Rambagh Palace', 'Stay', 'A royal residence transformed into an opulent heritage stay.'], ['Laxmi Misthan Bhandar', 'Food', 'A Jaipur institution for Rajasthani sweets and vegetarian classics.']], Mumbai: [['Gateway of India', 'Landmark', 'An iconic waterfront arch overlooking Mumbai Harbour.'], ['Taj Mahal Palace', 'Stay', 'Historic luxury hotel beside the Gateway.'], ['Bademiya', 'Food', 'Late-night kebabs and Mughlai favourites.']], Delhi: [['India Gate', 'Landmark', 'War memorial set among broad ceremonial boulevards.'], ['The Imperial', 'Stay', 'Heritage hotel in the heart of New Delhi.'], ['Karim’s', 'Food', 'Classic Mughlai restaurant near Jama Masjid.']] };
function search(e) { e?.preventDefault(); let city = $('#city').value.trim(), kind = $('#kind').value, key = Object.keys(places).find(x => x.toLowerCase() === city.toLowerCase()), list = key ? places[key].filter(x => !kind || x[1] === kind) : []; $('#searchStatus').textContent = list.length ? `${list.length} curated places in ${key}.` : `We’re still gathering stories for ${city}. Try Jaipur, Mumbai, or Delhi.`; $('#results').innerHTML = list.map(x => `<article><small>${x[1].toUpperCase()}</small><h3>${x[0]}</h3><p>${x[2]}</p><a href="#appdemo">Save to a trip ↗</a></article>`).join('') }
$('#searchForm').onsubmit = search; $('#cities').onclick = e => { let city = e.target.closest('[data-city]')?.dataset.city; if (city) { $('#city').value = city; search(); location.hash = 'discover' } };
const itineraryData = {
    Jaipur: [['08:00', '☕', 'Breakfast at Tapri Central', 'Food · 1.6 km away'], ['10:00', '♜', 'Explore Hawa Mahal', 'Sightseeing · 1.2 km away'], ['13:00', '🍛', 'Lunch at LMB', 'Food · 0.8 km away'], ['16:30', '✦', 'Golden hour at Nahargarh', 'Explorer pick · 5.4 km away']],
    Mumbai: [['08:30', '☕', 'Breakfast at Kala Ghoda Cafe', 'Food · 1.1 km away'], ['10:30', '♜', 'Explore Gateway of India', 'Sightseeing · 0.9 km away'], ['13:00', '🍛', 'Lunch at Bademiya', 'Food · 1.3 km away'], ['17:00', '✦', 'Sunset at Marine Drive', 'Explorer pick · 3.8 km away']],
    Delhi: [['08:00', '☕', 'Breakfast at Indian Coffee House', 'Food · 1.4 km away'], ['10:00', '♜', 'Explore India Gate', 'Sightseeing · 2.1 km away'], ['13:00', '🍛', 'Lunch at Karim’s', 'Food · 2.7 km away'], ['16:30', '✦', 'Discover Lodhi Garden', 'Explorer pick · 4.2 km away']]
};
let plannerCity = 'Jaipur';
function plannerMarkup(style = 'Balanced day') { let plan = [...itineraryData[plannerCity]]; if (style === 'Food first') plan = [plan[0], plan[2], plan[1], plan[3]]; if (style === 'Slow explorer') plan = [plan[0], plan[1], plan[3], plan[2]]; return `<div class="day"><small>SUNDAY, 13 OCTOBER · DAY PLANNER</small><h3>Your day<br>in ${plannerCity}.</h3></div><div class="planner-controls"><label>TRIP STYLE<select id="plannerStyle"><option${style === 'Balanced day' ? ' selected' : ''}>Balanced day</option><option${style === 'Food first' ? ' selected' : ''}>Food first</option><option${style === 'Slow explorer' ? ' selected' : ''}>Slow explorer</option></select></label><button id="regeneratePlan">✦ Plan my day</button></div><div class="planner-note">Your sample day plan for ${plannerCity}. Add or change stops in My trips.</div><section class="weather-card" id="weatherCard" aria-live="polite"><b>Local weather</b><p>Loading current conditions…</p></section><div class="timeline">${plan.map(x => `<div><span>${x[0]}</span><i>${x[1]}</i><section><b>${x[2]}</b><small>${x[3]}</small></section></div>`).join('')}</div>` }
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
    $('#plannerStyle').onchange = event => { $('#screen').innerHTML = plannerMarkup(event.target.value); bindPlanner() };
    $('#regeneratePlan').onclick = () => { const styles = Object.keys(itineraryData); plannerCity = styles[(styles.indexOf(plannerCity) + 1) % styles.length]; $('#screen').innerHTML = plannerMarkup($('#plannerStyle').value); bindPlanner() };
    loadPlannerWeather();
}
const tripStorageKey = 'tripaway-trip-builder';
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
const savedTripsKey = 'tripaway-saved-trips';
const packingKey = 'tripaway-packing-list';
const packingItems = ['Travel documents', 'Phone & charger', 'Medication', 'Comfortable shoes', 'Weather-ready layer', 'Reusable water bottle'];
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
        } else tripPlan = normalizeTrip(JSON.parse(localStorage.getItem(tripStorageKey))) || tripPlan;
    } catch (error) {
        console.warn('Could not load the saved trip plan.', error);
    }
}
function saveTripPlan() {
    try {
        localStorage.setItem(tripStorageKey, JSON.stringify(tripPlan));
        return true;
    } catch (error) {
        console.error('Could not save the trip plan.', error);
        return false;
    }
}
function loadSavedTrips() {
    try {
        const saved = JSON.parse(localStorage.getItem(savedTripsKey) || '[]');
        return Array.isArray(saved) ? saved.map(normalizeTrip).filter(Boolean).slice(0, 20) : [];
    } catch (error) {
        console.error('Could not load saved trips.', error);
        return [];
    }
}
function saveTripToCollection() {
    const savedTrips = loadSavedTrips();
    const index = savedTrips.findIndex(saved => saved.city === tripPlan.city && saved.days === tripPlan.days);
    if (index >= 0) savedTrips[index] = JSON.parse(JSON.stringify(tripPlan));
    else savedTrips.unshift(JSON.parse(JSON.stringify(tripPlan)));
    try {
        localStorage.setItem(savedTripsKey, JSON.stringify(savedTrips.slice(0, 20)));
        return true;
    } catch (error) {
        console.error('Could not save trip to My trips.', error);
        return false;
    }
}
function savedTripCards() {
    const trips = loadSavedTrips();
    return `<section class="trip-collection"><h4>Saved trips <small>${trips.length} on this device</small></h4>${trips.length ? trips.map((trip, index) => `<button type="button" class="saved-trip" data-saved-trip="${index}"><b>${escapeHtml(trip.city)}</b><small>${trip.days} days · ${trip.stops.length} planned stops</small></button>`).join('') : '<p class="trip-empty">Save a trip below and it will be ready on this device, even without an internet connection.</p>'}</section>`;
}
function packingMarkup() {
    let checked = [];
    try { checked = JSON.parse(localStorage.getItem(packingKey) || '[]'); if (!Array.isArray(checked)) checked = []; }
    catch (error) { console.error('Could not load packing checklist.', error); }
    return `<section class="trip-tools"><h4>Packing checklist</h4>${packingItems.map((item, index) => `<label class="packing-item"><input type="checkbox" data-packing="${index}"${checked.includes(index) ? ' checked' : ''}>${item}</label>`).join('')}<p class="trip-empty">Checklist is stored on this device.</p></section>`;
}
function budgetMarkup() {
    const spent = tripPlan.expenses.reduce((total, expense) => total + expense.amount, 0);
    return `<section class="trip-tools"><h4>Budget & expense splitter</h4><label class="budget-field">TRIP BUDGET (INR)<input id="tripBudget" type="number" min="0" step="100" value="${tripPlan.budget || ''}" placeholder="Set an optional budget"></label><p class="budget-total">₹${spent.toLocaleString('en-IN')} spent${tripPlan.budget ? ` of ₹${tripPlan.budget.toLocaleString('en-IN')}` : ''}</p><form id="expenseForm" class="expense-form"><input id="expenseName" maxlength="80" required placeholder="Expense (e.g. lunch)"><input id="expenseAmount" type="number" min="1" max="10000000" step="1" required placeholder="Amount ₹"><input id="expensePeople" type="number" min="1" max="100" value="1" required aria-label="Split between people"><button type="submit">Add</button></form><div class="expense-list">${tripPlan.expenses.length ? tripPlan.expenses.map((expense, index) => `<article><span>${escapeHtml(expense.description)} · ${expense.people} ${expense.people === 1 ? 'person' : 'people'}</span><b>₹${expense.amount.toLocaleString('en-IN')} · ₹${Math.ceil(expense.amount / expense.people).toLocaleString('en-IN')} each</b><button type="button" class="expense-remove" data-expense="${index}" aria-label="Remove expense">×</button></article>`).join('') : '<p class="trip-empty">Add expenses to see the total and per-person split.</p>'}</div></section>`;
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
    return `<section class="trip-tools"><h4>Travel documents</h4><p class="trip-empty">Files are stored in this browser on this device only. Do not rely on this demo as your only copy.</p><label class="document-picker">Add ticket, passport copy, or other file<input id="documentUpload" type="file" accept="image/*,.pdf"></label><div id="documentList" class="document-list">Loading saved documents…</div></section>`;
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
    return `<div class="trip-builder-head"><small>MY TRIPS · GUEST MODE</small><h3>Build your<br>own trip.</h3><p>Plan, budget, save offline, and share your itinerary.</p></div><div class="trip-builder-content">${savedTripCards()}<div class="trip-settings"><label>DESTINATION<select id="tripCity">${cityOptions}</select></label><label>DAYS<select id="tripDays">${[1, 2, 3].map(days => `<option value="${days}"${tripPlan.days === days ? ' selected' : ''}>${days} ${days === 1 ? 'day' : 'days'}</option>`).join('')}</select></label></div><form class="trip-add-form" id="tripAddForm"><label for="tripPlace">ADD A PLACE</label><div><select id="tripPlace">${placeOptions}</select><select id="tripDay" aria-label="Choose trip day">${dayOptions}</select><button type="submit" aria-label="Add place">+</button></div></form><div class="trip-days">${dayCards}</div><div class="trip-actions"><button type="button" id="saveTripPlan">Save to My trips</button><button type="button" id="shareTripPlan">Share link</button><button type="button" id="printTripPlan">Print / PDF</button></div><p class="trip-status" id="tripStatus" role="status" aria-live="polite">${status || 'Your active itinerary is saved on this device as you edit.'}</p>${budgetMarkup()}${packingMarkup()}${documentsMarkup()}${bookingsMarkup()}</div>`;
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
    $('#saveTripPlan').onclick = () => {
        const saved = saveTripPlan() && saveTripToCollection();
        $('#tripStatus').textContent = saved ? 'Trip saved to My trips on this device.' : 'Could not save this trip on this device.';
        if (saved) renderTripBuilder('Trip saved to My trips on this device.');
    };
    $('#shareTripPlan').onclick = shareTripPlan;
    $('#printTripPlan').onclick = printTripPlan;
    $('#screen').querySelectorAll('.saved-trip').forEach(button => button.onclick = () => {
        tripPlan = loadSavedTrips()[Number(button.dataset.savedTrip)] || tripPlan;
        const saved = saveTripPlan();
        renderTripBuilder(saved ? `Loaded your ${tripPlan.city} trip.` : 'Trip loaded, but could not be saved as the active itinerary.');
    });
    $('#tripBudget').onchange = event => {
        const value = Number(event.target.value);
        tripPlan.budget = Number.isFinite(value) && value >= 0 ? value : 0;
        saveTripPlan();
        renderTripBuilder('Budget updated.');
    };
    $('#expenseForm').onsubmit = event => {
        event.preventDefault();
        const description = $('#expenseName').value.trim();
        const amount = Number($('#expenseAmount').value);
        const people = Number($('#expensePeople').value);
        if (!description || !Number.isFinite(amount) || amount <= 0 || amount > 10000000 || !Number.isInteger(people) || people < 1 || people > 100) {
            $('#tripStatus').textContent = 'Enter an expense and valid amount and group size.';
            return;
        }
        tripPlan.expenses.push({ description, amount, people });
        const saved = saveTripPlan();
        renderTripBuilder(saved ? 'Expense added and split.' : 'Expense added, but could not be saved on this device.');
    };
    $('#screen').querySelectorAll('.expense-remove').forEach(button => button.onclick = () => {
        tripPlan.expenses.splice(Number(button.dataset.expense), 1);
        saveTripPlan();
        renderTripBuilder('Expense removed.');
    });
    $('#screen').querySelectorAll('[data-packing]').forEach(input => input.onchange = () => {
        try {
            const checked = [...$('#screen').querySelectorAll('[data-packing]:checked')].map(item => Number(item.dataset.packing));
            localStorage.setItem(packingKey, JSON.stringify(checked));
        } catch (error) {
            console.error('Could not save packing checklist.', error);
            $('#tripStatus').textContent = 'Could not save the packing checklist on this device.';
        }
    });
    $('#documentUpload').onchange = async event => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 15 * 1024 * 1024 || !(file.type.startsWith('image/') || file.type === 'application/pdf')) {
            $('#tripStatus').textContent = 'Choose an image or PDF smaller than 15 MB.';
            event.target.value = '';
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
function renderTripBuilder(status = '') {
    loadTripPlan();
    $('#screen').innerHTML = tripBuilderMarkup(status);
    $('#screen').classList.add('trip-builder-screen');
    bindTripBuilder();
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
}
const views = {
    discover: '',
    trips: '',
    today: plannerMarkup(),
    community: `<div class="community-head"><small>TRIPAWAY COMMUNITY · GUEST MODE</small><h3>Stories from<br>the road.</h3><button class="record-button">＋ Share a video review</button></div><div class="community-feed"><article class="community-review"><div class="review-top"><small>TRIP COMPLETED · VERIFIED</small><h3>How was Jaipur?</h3><p>Share a short video to help the next traveller.</p></div><div class="app-body"><div class="video-review"><div class="review-play">▶</div><div class="review-person"><span>SK</span><div><b>Shreya Kapoor</b><small><strong>✓ Verified visitor</strong> · Hawa Mahal</small></div></div></div><div class="ai-note"><b>✦ Review highlights</b><p>“Go early for the quietest views. The surrounding streets are the real experience.”</p></div><button class="record-button">＋ Record a video review</button></div></article><article><div class="community-photo photo-one"><span>♥ 124</span></div><div class="community-person"><i>RM</i><div><b>Riya Mehta</b><small>Jaipur · 2 days ago</small></div></div><p>Sunrise from Nahargarh felt like the whole city was waking up at once. ✦</p></article><article><div class="community-photo photo-two"><span>♥ 86</span></div><div class="community-person"><i>AK</i><div><b>Arjun Khanna</b><small>Mumbai · 4 days ago</small></div></div><p>Found my favourite chai stop through the TripAway community.</p></article></div>`,
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
const offlineCurrencyRates = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095, JPY: 1.78, SGD: 0.016, CAD: 0.016, AUD: 0.018, CHF: 0.011 };
function currencyMarkup() {
    const options = currencies.map(currency => `<option value="${currency}">${currency}</option>`).join('');
    return `<div class="translator-head currency-head"><small>OFFLINE CURRENCY CONVERTER</small><h3>Know what<br>it costs.</h3><p>Convert between currencies without internet access.</p></div><form id="currencyForm" class="currency-form"><label>AMOUNT<input id="currencyAmount" type="number" min="0.01" max="100000000" step="any" value="100" required></label><label>FROM<select id="currencyFrom">${options}</select></label><label>TO<select id="currencyTo">${options.replace('value="INR"', 'value="INR" selected')}</select></label><button type="submit">Convert</button><p id="currencyResult" role="status">Uses fixed approximate offline rates. No internet connection required.</p><small>Reference rates are approximate estimates, not live market rates. Check current rates before exchanging money.</small></form>`;
}
function renderCurrency() {
    $('#screen').innerHTML = currencyMarkup();
    $('#screen').classList.add('translator-screen');
    $('#currencyForm').onsubmit = event => {
        event.preventDefault();
        const amount = Number($('#currencyAmount').value);
        const from = $('#currencyFrom').value;
        const to = $('#currencyTo').value;
        const result = $('#currencyResult');
        if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
            result.textContent = 'Enter an amount greater than 0 and no more than 100,000,000.';
            return;
        }
        if (from === to) {
            result.textContent = `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to} (same currency).`;
            return;
        }
        const converted = amount / offlineCurrencyRates[from] * offlineCurrencyRates[to];
        result.textContent = `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${from} ≈ ${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to} · approximate offline rate`;
    };
}
let activeView = 'discover';
function view(n) {
    activeView = n;
    $('#screen').innerHTML = views[n];
    $('#screen').classList.toggle('translator-screen', n === 'translate');
    $('#screen').classList.toggle('trip-builder-screen', n === 'trips');
    $('#screen').classList.toggle('map-app-screen', n === 'discover');
    $('#screen').classList.toggle('community-screen', n === 'community');
    if (n === 'translate') $('#screen').innerHTML = translatorMarkup();
    if (n === 'trips') renderTripBuilder();
    if (n === 'discover') renderMapView();
    if (n === 'currency') renderCurrency();
    document.querySelectorAll('.tabs button').forEach(button => button.classList.toggle('active', button.dataset.view === n));
    if (n === 'today') bindPlanner();
}
view('discover');
document.querySelectorAll('.tabs button').forEach(button => button.onclick = () => view(button.dataset.view));
document.addEventListener('click', event => {
    const speak = event.target.closest('.speak-phrase'), copy = event.target.closest('.copy-phrase');
    if (speak) { if ('speechSynthesis' in window) { const utterance = new SpeechSynthesisUtterance(speak.dataset.phrase); utterance.lang = speak.dataset.language; speechSynthesis.cancel(); speechSynthesis.speak(utterance) } else $('#translatorStatus').textContent = 'Speech is not supported in this browser.' }
    if (copy) navigator.clipboard?.writeText(copy.dataset.phrase).then(() => { $('#translatorStatus').textContent = 'Phrase copied. Show it to someone nearby.' }).catch(() => { $('#translatorStatus').textContent = 'Select the phrase manually to copy it.' });
});
document.addEventListener('languageChanged', () => { if (activeView === 'translate') { $('#screen').innerHTML = translatorMarkup() } });
document.addEventListener('change', event => {
    if (event.target.id !== 'phraseLanguage') return;
    localStorage.setItem('tripaway-translator-language', event.target.value);
    $('#screen').innerHTML = translatorMarkup();
});
document.addEventListener('change', event => { if (event.target.id === 'plannerStyle') { $('#screen').innerHTML = plannerMarkup(event.target.value); bindPlanner() } });
document.addEventListener('click', event => { if (event.target.id === 'regeneratePlan') { const cities = Object.keys(itineraryData); plannerCity = cities[(cities.indexOf(plannerCity) + 1) % cities.length]; $('#screen').innerHTML = plannerMarkup($('#plannerStyle').value); bindPlanner() } });
const dialog = $('#dialog'); $('#signIn').onclick = () => dialog.showModal(); $('[data-dialog]').onclick = () => dialog.showModal(); $('.close').onclick = () => dialog.close(); $('#contactForm').onsubmit = e => { e.preventDefault(); $('#message').textContent = 'Thanks — your note is on its way.'; e.target.reset() }; let io = new IntersectionObserver(x => x.forEach(y => { if (y.isIntersecting) { y.target.classList.add('in'); io.unobserve(y.target) } }), { threshold: .12 }); document.querySelectorAll('.reveal').forEach(x => io.observe(x)); addEventListener('scroll', () => $('#header').classList.toggle('scroll', scrollY > 30), { passive: true });
const reviewDialog = $('#reviewDialog'), reviewPreview = $('#reviewPreview'), reviewStatus = $('#reviewCaptureStatus');
let reviewStream, reviewRecorder, reviewChunks = [], reviewVideo;
document.addEventListener('click', event => { if (event.target.closest('.record-button')) reviewDialog.showModal() });
$('#closeReview').onclick = () => { if (reviewStream) reviewStream.getTracks().forEach(track => track.stop()); reviewDialog.close() };
$('#startRecording').onclick = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { reviewStatus.textContent = 'Camera recording is not supported here. Choose a video file instead.'; return }
    try {
        reviewStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        reviewPreview.srcObject = reviewStream; reviewPreview.muted = true; await reviewPreview.play();
        reviewChunks = []; reviewRecorder = new MediaRecorder(reviewStream); reviewRecorder.start(); reviewVideo = null;
        $('#startRecording').disabled = true; $('#stopRecording').disabled = false; reviewStatus.textContent = 'Recording… tap Stop when you are done (30 seconds max).';
        setTimeout(() => { if (reviewRecorder?.state === 'recording') $('#stopRecording').click() }, 30000);
    } catch (error) { reviewStatus.textContent = 'Camera access was not granted. Choose a video file instead.' }
};
$('#stopRecording').onclick = () => {
    if (!reviewRecorder || reviewRecorder.state !== 'recording') return;
    reviewRecorder.ondataavailable = event => { if (event.data.size) reviewChunks.push(event.data) };
    reviewRecorder.onstop = () => { reviewVideo = new Blob(reviewChunks, { type: reviewRecorder.mimeType }); reviewPreview.srcObject = null; reviewPreview.src = URL.createObjectURL(reviewVideo); reviewPreview.controls = true; reviewStatus.textContent = 'Preview ready. Publish when you are happy with it.'; $('#startRecording').disabled = false; $('#stopRecording').disabled = true; reviewStream?.getTracks().forEach(track => track.stop()) };
    reviewRecorder.stop();
};
$('#reviewUpload').onchange = event => { const file = event.target.files[0]; if (!file) return; reviewVideo = file; reviewPreview.srcObject = null; reviewPreview.src = URL.createObjectURL(file); reviewPreview.controls = true; reviewStatus.textContent = `${file.name} is ready to publish.` };
$('#reviewForm').onsubmit = event => { event.preventDefault(); if (!reviewVideo) { $('#reviewFormStatus').textContent = 'Record or choose a video before publishing.'; return } localStorage.setItem(reviewStorageKey, JSON.stringify({ place: $('#reviewPlace').value, rating: $('#reviewRating').value, publishedAt: new Date().toISOString() })); $('#reviewFormStatus').textContent = 'Published to your verified traveller profile.'; setTimeout(() => reviewDialog.close(), 700) };
if ('serviceWorker' in navigator && ['http:', 'https:'].includes(location.protocol)) {
    navigator.serviceWorker.register('./service-worker.js').catch(error => console.error('Could not enable offline app-shell support.', error));
}
