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
    hi: { explore: 'खोजें', journeys: 'यात्राएँ', appDemo: 'ऐप डेमो', contact: 'संपर्क', signIn: 'साइन इन', discover: 'खोजें', saveTrip: 'यात्रा सहेजें', todayPlan: 'आज की योजना', videoReview: 'वीडियो समीक्षा', community: 'समुदाय' },
    es: { explore: 'Explorar', journeys: 'Viajes', appDemo: 'Demo de la app', contact: 'Contacto', signIn: 'Iniciar sesión', discover: 'Descubrir', saveTrip: 'Guardar viaje', todayPlan: 'Plan de hoy', videoReview: 'Reseña en vídeo', community: 'Comunidad' },
    fr: { explore: 'Explorer', journeys: 'Voyages', appDemo: 'Démo de l’app', contact: 'Contact', signIn: 'Connexion', discover: 'Découvrir', saveTrip: 'Enregistrer un voyage', todayPlan: 'Plan du jour', videoReview: 'Avis vidéo', community: 'Communauté' },
    de: { explore: 'Entdecken', journeys: 'Reisen', appDemo: 'App-Demo', contact: 'Kontakt', signIn: 'Anmelden', discover: 'Entdecken', saveTrip: 'Reise speichern', todayPlan: 'Tagesplan', videoReview: 'Videobewertung', community: 'Community' },
    ar: { explore: 'استكشف', journeys: 'الرحلات', appDemo: 'تجربة التطبيق', contact: 'تواصل', signIn: 'تسجيل الدخول', discover: 'اكتشف', saveTrip: 'حفظ رحلة', todayPlan: 'خطة اليوم', videoReview: 'مراجعة فيديو', community: 'المجتمع' },
    pt: { explore: 'Explorar', journeys: 'Viagens', appDemo: 'Demonstração', contact: 'Contacto', signIn: 'Entrar', discover: 'Descobrir', saveTrip: 'Guardar viagem', todayPlan: 'Plano de hoje', videoReview: 'Avaliação em vídeo', community: 'Comunidade' },
    ja: { explore: '探す', journeys: '旅', appDemo: 'アプリデモ', contact: 'お問い合わせ', signIn: 'ログイン', discover: '見つける', saveTrip: '旅を保存', todayPlan: '今日のプラン', videoReview: '動画レビュー', community: 'コミュニティ' },
    zh: { explore: '探索', journeys: '旅程', appDemo: '应用演示', contact: '联系', signIn: '登录', discover: '发现', saveTrip: '保存行程', todayPlan: '今日计划', videoReview: '视频评价', community: '社区' }
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
