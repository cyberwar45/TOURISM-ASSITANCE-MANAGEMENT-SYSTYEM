const supportedLanguages = [
    ['en', 'English'], ['hi', 'हिन्दी'], ['bn', 'বাংলা'], ['te', 'తెలుగు'], ['mr', 'मराठी'], ['ta', 'தமிழ்'], ['ur', 'اردو'],
    ['gu', 'ગુજરાતી'], ['kn', 'ಕನ್ನಡ'], ['ml', 'മലയാളം'], ['pa', 'ਪੰਜਾਬੀ'], ['or', 'ଓଡ଼ିଆ'], ['as', 'অসমীয়া'], ['ne', 'नेपाली'],
    ['si', 'සිංහල'], ['ar', 'العربية'], ['fa', 'فارسی'], ['he', 'עברית'], ['tr', 'Türkçe'], ['az', 'Azərbaycan'], ['uz', 'O‘zbekcha'],
    ['kk', 'Қазақша'], ['ru', 'Русский'], ['uk', 'Українська'], ['pl', 'Polski'], ['cs', 'Čeština'], ['sk', 'Slovenčina'],
    ['hu', 'Magyar'], ['ro', 'Română'], ['bg', 'Български'], ['sr', 'Српски'], ['hr', 'Hrvatski'], ['sl', 'Slovenščina'],
    ['de', 'Deutsch'], ['nl', 'Nederlands'], ['fr', 'Français'], ['es', 'Español'], ['pt', 'Português'], ['it', 'Italiano'],
    ['ca', 'Català'], ['eu', 'Euskara'], ['gl', 'Galego'], ['sv', 'Svenska'], ['da', 'Dansk'], ['no', 'Norsk'],
    ['fi', 'Suomi'], ['is', 'Íslenska'], ['et', 'Eesti'], ['lv', 'Latviešu'], ['lt', 'Lietuvių'], ['el', 'Ελληνικά'],
    ['mk', 'Македонски'], ['sq', 'Shqip'], ['sw', 'Kiswahili'], ['am', 'አማርኛ'], ['ha', 'Hausa'], ['yo', 'Yorùbá'],
    ['ig', 'Igbo'], ['zu', 'isiZulu'], ['xh', 'isiXhosa'], ['af', 'Afrikaans'], ['id', 'Bahasa Indonesia'], ['ms', 'Bahasa Melayu'],
    ['th', 'ไทย'], ['vi', 'Tiếng Việt'], ['ko', '한국어'], ['ja', '日本語'], ['zh', '中文']
];
const translations = {
    en: { explore: 'Explore', journeys: 'Journeys', appDemo: 'App demo', contact: 'Contact', signIn: 'Sign in', discoverMap: 'Discover & map', myTrips: 'My trips', todayPlan: 'Today’s plan', community: 'Community & reviews', translator: 'Travel translator', currency: 'Currency converter' },
    hi: { explore: 'खोजें', journeys: 'यात्राएँ', appDemo: 'ऐप डेमो', contact: 'संपर्क', signIn: 'साइन इन', discoverMap: 'खोजें और नक्शा', myTrips: 'मेरी यात्राएँ', todayPlan: 'आज की योजना', community: 'समुदाय और समीक्षाएँ', translator: 'यात्रा अनुवादक', currency: 'मुद्रा बदलें' },
    es: { explore: 'Explorar', journeys: 'Viajes', appDemo: 'Demo de la app', contact: 'Contacto', signIn: 'Iniciar sesión', discoverMap: 'Explorar y mapa', myTrips: 'Mis viajes', todayPlan: 'Plan de hoy', community: 'Comunidad y reseñas', translator: 'Traductor de viaje', currency: 'Conversor de divisas' },
    fr: { explore: 'Explorer', journeys: 'Voyages', appDemo: 'Démo de l’app', contact: 'Contact', signIn: 'Connexion', discoverMap: 'Explorer et carte', myTrips: 'Mes voyages', todayPlan: 'Plan du jour', community: 'Communauté et avis', translator: 'Traducteur de voyage', currency: 'Convertisseur de devises' },
    de: { explore: 'Entdecken', journeys: 'Reisen', appDemo: 'App-Demo', contact: 'Kontakt', signIn: 'Anmelden', discoverMap: 'Entdecken & Karte', myTrips: 'Meine Reisen', todayPlan: 'Tagesplan', community: 'Community & Bewertungen', translator: 'Reiseübersetzer', currency: 'Währungsrechner' },
    ar: { explore: 'استكشف', journeys: 'الرحلات', appDemo: 'تجربة التطبيق', contact: 'تواصل', signIn: 'تسجيل الدخول', discoverMap: 'استكشف والخريطة', myTrips: 'رحلاتي', todayPlan: 'خطة اليوم', community: 'المجتمع والتقييمات', translator: 'مترجم السفر', currency: 'محول العملات' },
    pt: { explore: 'Explorar', journeys: 'Viagens', appDemo: 'Demonstração', contact: 'Contacto', signIn: 'Entrar', discoverMap: 'Explorar e mapa', myTrips: 'As minhas viagens', todayPlan: 'Plano de hoje', community: 'Comunidade e avaliações', translator: 'Tradutor de viagem', currency: 'Conversor de moeda' },
    ja: { explore: '探す', journeys: '旅', appDemo: 'アプリデモ', contact: 'お問い合わせ', signIn: 'ログイン', discoverMap: '検索と地図', myTrips: 'マイトリップ', todayPlan: '今日のプラン', community: 'コミュニティとレビュー', translator: '旅行翻訳', currency: '通貨換算' },
    zh: { explore: '探索', journeys: '旅程', appDemo: '应用演示', contact: '联系', signIn: '登录', discoverMap: '探索与地图', myTrips: '我的行程', todayPlan: '今日计划', community: '社区与评价', translator: '旅行翻译', currency: '货币换算' }
};
const languageSelect = document.querySelector('#languageSelect');
supportedLanguages.forEach(([code, name]) => languageSelect.add(new Option(name, code)));
function applyLanguage(code) {
    const pack = translations[code] || {};
    document.documentElement.lang = code;
    document.documentElement.dir = ['ar', 'fa', 'he', 'ur'].includes(code) ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(element => { const key = element.dataset.i18n; element.textContent = pack[key] || translations.en?.[key] || element.textContent });
    localStorage.setItem('tripaway-language', code);
    document.dispatchEvent(new Event('languageChanged'));
}
languageSelect.value = localStorage.getItem('tripaway-language') || 'en';
languageSelect.onchange = event => applyLanguage(event.target.value);
applyLanguage(languageSelect.value);
