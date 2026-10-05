const cityImages = {
    Jaipur: 'https://images.unsplash.com/photo-1524230507669-5ff97982bb5e?auto=format&fit=crop&w=900&q=85',
    Mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=900&q=85',
    Delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=900&q=85',
    Coorg: 'https://images.unsplash.com/photo-1569996980833-901b5cd2eb70?auto=format&fit=crop&w=900&q=85',
    Hampi: 'https://images.unsplash.com/photo-1596018382916-56d2e341d784?auto=format&fit=crop&w=900&q=85',
    Gokarna: 'https://images.unsplash.com/photo-1593359652766-b77c5795bd65?auto=format&fit=crop&w=900&q=85',
    Ziro: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85',
    Tawang: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=85',
    Mechuka: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=85',
    Majuli: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=85',
    Mandu: 'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=900&q=85',
    Orchha: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=900&q=85',
    Munnar: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=900&q=85',
    Kutch: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=85',
    Dzukou: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85'
};
const placeImages = {
    'Hawa Mahal': cityImages.Jaipur,
    'Gateway of India': cityImages.Mumbai,
    'India Gate': cityImages.Delhi,
    'Abbey Falls': cityImages.Coorg,
    'Vijaya Vittala Temple': cityImages.Hampi,
    'Paradise Beach': cityImages.Gokarna,
    'Kudle Beach': cityImages.Gokarna,
    'Taj Mahal Palace': 'https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=900&q=85'
};
const experienceImages = {
    Stay: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=85',
    Food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=85',
    architecture: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=85',
    water: cityImages.Gokarna,
    waterfall: cityImages.Coorg,
    mountain: cityImages.Mechuka,
    forest: cityImages.Majuli,
    tea: cityImages.Munnar,
    desert: cityImages.Kutch
};
function imageForPlace(place, city) {
    if (placeImages[place[0]]) return { src: placeImages[place[0]], alt: place[0] };
    if (place[1] !== 'Landmark') return { src: experienceImages[place[1]] || cityImages[city], alt: `${place[1]} experience in ${city}` };
    const description = `${place[0]} ${place[2]}`.toLowerCase();
    const scenery = /waterfall|falls/.test(description) ? 'waterfall'
        : /beach|lake|river|waterfront/.test(description) ? 'water'
            : /palace|temple|monastery|satra|cenotaph|memorial|architecture/.test(description) ? 'architecture'
                : /tea estate|tea, coffee|plantation/.test(description) ? 'tea'
                    : /desert|salt rann/.test(description) ? 'desert'
                        : /forest|woodland/.test(description) ? 'forest'
                            : /mountain|valley|viewpoint|view|peak|trail|trek|hill/.test(description) ? 'mountain'
                                : null;
    return scenery
        ? { src: experienceImages[scenery], alt: `${scenery} scenery in ${city}` }
        : { src: cityImages[city], alt: `${city} destination landscape` };
}
const approximateDistanceKm = {
    'Hawa Mahal': 1, 'Rambagh Palace': 5, 'Laxmi Misthan Bhandar': 2,
    'Gateway of India': 1, 'Taj Mahal Palace': 1, Bademiya: 1,
    'India Gate': 2, 'The Imperial': 4, 'Karim’s': 6,
    'Abbey Falls': 8, 'Mandalpatti Viewpoint': 25, 'Nalknad Palace': 35,
    'Vijaya Vittala Temple': 4, 'Sanapur Lake': 5,
    'Paradise Beach': 6, 'Kudle Beach': 2,
    'Talley Valley': 32, 'Kile Pakho': 3,
    'Nuranang Falls': 40, 'Sangetsar Lake': 35,
    'Mechuka Valley': 2, 'Samten Yongcha Monastery': 1,
    'Auniati Satra': 7, 'Mishing Village': 14,
    'Jahaz Mahal': 1, 'Hindola Mahal': 1,
    'Chaturbhuj Temple': 1, 'Betwa River Cenotaphs': 2,
    Kolukkumalai: 35, 'Pothamedu View Point': 5,
    'Dhordo White Rann': 80, 'Kala Dungar': 90,
    'Dzukou Valley': 25, 'Japfu Peak Trail': 20
};
search = function (event) {
    event?.preventDefault();
    const city = $('#city').value.trim();
    const kind = $('#kind').value;
    const maxSpend = Number($('#budgetFilter')?.value) || Infinity;
    const maxDistance = Number($('#distanceFilter')?.value) || Infinity;
    const key = Object.keys(places).find(name => name.toLowerCase() === city.toLowerCase());
    const list = key ? places[key].map(place => ({
        place,
        estimatedSpend: place[1] === 'Stay' ? 5000 : place[1] === 'Food' ? 800 : 1200,
        distance: approximateDistanceKm[place[0]]
    })).filter(item => (!kind || item.place[1] === kind) && item.estimatedSpend <= maxSpend && (maxDistance === Infinity || (Number.isFinite(item.distance) && item.distance <= maxDistance))) : [];
    $('#searchStatus').textContent = list.length
        ? `${list.length} curated places in ${key}. Spend and distance are indicative estimates.`
        : key ? `No ${kind || 'places'} in ${key} match those filters. Try a wider budget or distance.` : `No match for ${city} yet. Try Coorg, Hampi, Ziro, Tawang, Mechuka, Majuli, Mandu, Orchha, Munnar, Kutch, or Dzukou.`;
    $('#results').innerHTML = list.map(({ place, estimatedSpend, distance }) => {
        const image = imageForPlace(place, key);
        return `<article class="place-result"><img src="${image.src}" alt="${image.alt}" loading="lazy"><div class="place-content"><small>${place[1].toUpperCase()} · ${key}</small><h3>${place[0]}</h3><p>${place[2]}</p><small>Indicative spend: ₹${estimatedSpend.toLocaleString('en-IN')} · approx. ${distance ?? 'n/a'} km from city centre</small></div></article>`;
    }).join('');
};
$('#searchForm').onsubmit = search;
