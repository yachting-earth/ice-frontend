/**
 * Yachting Earth - landing2 (Tailwind redesign).
 * Vanilla JS, no build step. Loaded with `defer`, so DOM is parsed by the time this runs.
 *
 * Both languages are inlined here (kept byte-identical to the "landing2" key
 * in frontend/i18n/en.json / sv.json) so the page renders in the resolved
 * language on first paint with no fetch and no flash - the same reasoning
 * as EN_INLINE in frontend/js/i18n.js, just scoped to this page's copy.
 */
(function () {
    'use strict';

    var SUPPORTED = ['en', 'sv'];
    var DEFAULT_LANG = 'en';

    var DICTS = {
        en: {
            landing2: {
                nav: {
                    features: 'Features',
                    pricing: 'Pricing',
                    faq: 'FAQ',
                    login: 'Log in',
                    cta: 'Register Voyage'
                },
                hero: {
                    eyebrow: 'Voyage Preparation & Emergency Information',
                    headline: 'Chart the plan. Protect the crew.',
                    subheadline: "Yachting Earth turns your vessel, route and crew details into a single voyage dossier — ready the instant your emergency contact needs it. Prepare everything before you cast off, and if you don't check in on time, the right person automatically gets the right information.",
                    ctaPrimary: 'Register Voyage',
                    ctaSecondary: "See what's included",
                    dashboardLabel: 'Live voyage dossier',
                    dashboardCaption: 'Every route, crew member and emergency contact — organised the moment you activate a trip.',
                    badges: ['Free to use', 'Multiple routes', 'GDPR by design', 'Secure ICE Portal']
                },
                socialProof: {
                    label: 'Trusted alongside the standards offshore sailors already rely on',
                    partners: ['Nordic Offshore Association', 'Coastal Safety Network', 'Bluewater Crew Alliance', 'Harbour Masters Council', 'Baltic Cruising Federation']
                },
                features: {
                    eyebrow: 'Built for real voyages',
                    heading: 'Everything your emergency contact needs — organised before you leave the dock',
                    subheading: 'A voyage dossier that stays accurate, not a paper form that goes stale the moment you leave harbour.',
                    items: [
                        { title: 'Multiple routes, one plan', description: 'Import routes straight from Windy or draw them by hand, and keep alternates on file for when the wind turns.' },
                        { title: 'Crew who keep themselves current', description: 'Every crew member completes their own profile and emergency contact — no more chasing details by text.' },
                        { title: 'A verified emergency contact', description: 'Your ICE contact confirms their role in advance and gets a secure, read-only portal — nothing to guess in the moment.' },
                        { title: 'A grace period on your terms', description: 'Set how long after your ETA before anyone is alerted, so a slow harbour approach never triggers a false alarm.' },
                        { title: 'Automatic, persistent notification', description: "If you miss check-in, your contact is alerted by email, Telegram or WhatsApp, with retries until it's delivered." },
                        { title: 'Privacy by design', description: 'Trip, route and crew data is automatically and permanently erased 30 days after your voyage ends, in line with GDPR.' }
                    ]
                },
                pricing: {
                    eyebrow: 'Pricing',
                    heading: 'Start free. Stay prepared.',
                    subheading: 'Yachting Earth is free for skippers preparing their own voyages — no credit card, no hidden tiers.',
                    planName: 'Skipper',
                    price: 'Free',
                    priceSuffix: 'forever, per skipper',
                    features: [
                        'Unlimited voyages & routes',
                        'Full crew management',
                        'One verified ICE contact',
                        'Secure ICE portal & SAR access',
                        'GDPR-compliant data lifecycle',
                        'Email, Telegram & WhatsApp alerts'
                    ],
                    cta: 'Register Voyage',
                    note: "Plans for yacht clubs, charter fleets and marinas are on the way — reach out if you'd like early access."
                },
                faq: {
                    eyebrow: 'FAQ',
                    heading: 'Questions, answered',
                    items: [
                        { q: 'Is Yachting Earth a distress beacon or live tracker?', a: "No. It doesn't track your position and it can't call for help on its own. It's a preparation and notification tool — the skipper remains responsible for safety at all times, and for triggering an actual rescue if needed." },
                        { q: "What happens if I don't check in on time?", a: 'A background check runs every minute. Once your planned arrival plus your chosen grace period has passed without a check-in, your ICE contact is automatically notified with retries and an email fallback.' },
                        { q: 'Who can see my voyage information?', a: "Only you, your crew's own entries, and the single emergency contact you designate — who gets a read-only portal via a private link, not a shared account." },
                        { q: 'How does Yachting Earth handle GDPR?', a: 'Trip, route, crew and photo data is soft-deleted when a voyage is completed or cancelled, then permanently erased 30 days later. Your account and vessels are kept so you can plan your next voyage.' },
                        { q: 'Do I need to install anything?', a: 'No. Yachting Earth runs entirely in your browser — register your voyage from a laptop or phone before you leave the dock.' },
                        { q: 'Is it really free?', a: 'Yes. The Skipper plan is free, with no credit card required. Plans for clubs, fleets and marinas are on the way.' }
                    ]
                },
                footer: {
                    tagline: 'Every voyage deserves a plan.',
                    disclaimer: 'Yachting Earth ICE is a voyage preparation and information tool. It is not a distress beacon, EPIRB or real-time tracking system, and the system itself does not contact rescue services.',
                    links: { about: 'About', privacy: 'Privacy', gdpr: 'GDPR', contact: 'Contact', terms: 'Terms' }
                },
                meta: {
                    title: 'Yachting Earth — Chart the plan. Protect the crew.',
                    description: 'Register your vessel, routes and crew before you cast off. If you miss check-in, your emergency contact automatically gets secure, read-only access to everything they need.'
                }
            }
        },
        sv: {
            landing2: {
                nav: {
                    features: 'Funktioner',
                    pricing: 'Priser',
                    faq: 'Vanliga frågor',
                    login: 'Logga in',
                    cta: 'Skapa färdplan'
                },
                hero: {
                    eyebrow: 'Reseförberedelse & nödinformation',
                    headline: 'Rita upp planen. Skydda besättningen.',
                    subheadline: 'Yachting Earth samlar fartyg, rutt och besättning i en enda reseakt — redo i samma sekund som din nödkontakt behöver den. Förbered allt innan ni kastar loss, och checkar ni inte in i tid får rätt person automatiskt rätt information.',
                    ctaPrimary: 'Skapa färdplan',
                    ctaSecondary: 'Se vad som ingår',
                    dashboardLabel: 'Reseakt i realtid',
                    dashboardCaption: 'Varje rutt, besättningsmedlem och nödkontakt — organiserat i samma stund som resan aktiveras.',
                    badges: ['Gratis att använda', 'Flera rutter', 'GDPR från grunden', 'Säker ICE-portal']
                },
                socialProof: {
                    label: 'Används vid sidan av de standarder som sjöfarare redan litar på',
                    partners: ['Nordiska Offshoreförbundet', 'Kustsäkerhetsnätverket', 'Bluewater Crew-alliansen', 'Hamnkaptenernas Råd', 'Baltic Cruising-federationen']
                },
                features: {
                    eyebrow: 'Byggt för riktiga sjöresor',
                    heading: 'Allt din nödkontakt behöver — organiserat innan du kastar loss',
                    subheading: 'En reseakt som hålls aktuell — inte ett pappersformulär som blir inaktuellt så fort du lämnar hamnen.',
                    items: [
                        { title: 'Flera rutter, en plan', description: 'Importera rutter direkt från Windy eller rita dem för hand, och spara alternativa rutter för när vinden vänder.' },
                        { title: 'Besättning som håller sig uppdaterad', description: 'Varje besättningsmedlem fyller i sin egen profil och nödkontakt — slipp jaga uppgifter via sms.' },
                        { title: 'En verifierad nödkontakt', description: 'Din ICE-kontakt bekräftar sin roll i förväg och får en säker, skrivskyddad portal — inget att gissa sig till i stunden.' },
                        { title: 'Karenstid på dina villkor', description: 'Ställ in hur lång tid efter beräknad ankomst som ska gå innan någon larmas, så en långsam hamninfart aldrig utlöser falskt alarm.' },
                        { title: 'Automatisk, ihållande avisering', description: 'Missar du incheckningen aviseras din kontakt via e-post, Telegram eller WhatsApp, med återförsök tills meddelandet når fram.' },
                        { title: 'Integritet från grunden', description: 'Resa-, rutt- och besättningsdata raderas automatiskt och permanent 30 dagar efter att resan avslutats, i linje med GDPR.' }
                    ]
                },
                pricing: {
                    eyebrow: 'Priser',
                    heading: 'Börja gratis. Håll er förberedda.',
                    subheading: 'Yachting Earth är gratis för skeppare som förbereder sina egna resor — inget kreditkort, inga dolda nivåer.',
                    planName: 'Skeppare',
                    price: 'Gratis',
                    priceSuffix: 'för alltid, per skeppare',
                    features: [
                        'Obegränsat antal resor och rutter',
                        'Fullständig besättningshantering',
                        'En verifierad ICE-kontakt',
                        'Säker ICE-portal och SAR-åtkomst',
                        'GDPR-anpassad datalivscykel',
                        'Aviseringar via e-post, Telegram och WhatsApp'
                    ],
                    cta: 'Skapa färdplan',
                    note: 'Planer för segelklubbar, charterflottor och marinor är på gång — hör av dig om du vill ha tidig tillgång.'
                },
                faq: {
                    eyebrow: 'Vanliga frågor',
                    heading: 'Frågor och svar',
                    items: [
                        { q: 'Är Yachting Earth en nödsändare eller realtidsspårning?', a: 'Nej. Tjänsten spårar inte din position och kan inte larma på egen hand. Det är ett förberedelse- och aviseringsverktyg — skepparen har alltid det fulla säkerhetsansvaret, inklusive att larma en faktisk räddningsinsats vid behov.' },
                        { q: 'Vad händer om jag inte checkar in i tid?', a: 'En bakgrundskontroll körs varje minut. När beräknad ankomst plus din valda karenstid har passerat utan incheckning aviseras din ICE-kontakt automatiskt, med återförsök och e-post som reserv.' },
                        { q: 'Vem kan se min reseinformation?', a: 'Bara du, besättningens egna uppgifter och den enda nödkontakt du utser — som får en skrivskyddad portal via en privat länk, inte ett delat konto.' },
                        { q: 'Hur hanterar Yachting Earth GDPR?', a: 'Resa-, rutt-, besättnings- och fotodata mjukraderas när en resa avslutas eller avbryts, och raderas sedan permanent 30 dagar senare. Ditt konto och dina fartyg behålls så att du kan planera nästa resa.' },
                        { q: 'Behöver jag installera något?', a: 'Nej. Yachting Earth körs helt i din webbläsare — registrera din resa från dator eller mobil innan du kastar loss.' },
                        { q: 'Är det verkligen gratis?', a: 'Ja. Skeppare-planen är gratis, utan krav på kreditkort. Planer för klubbar, flottor och marinor är på gång.' }
                    ]
                },
                footer: {
                    tagline: 'Varje resa förtjänar en plan.',
                    disclaimer: 'Yachting Earth ICE är ett verktyg för reseförberedelser och information. Det är ingen nödsändare, EPIRB eller realtidsspårning, och systemet larmar inte självt räddningstjänsten.',
                    links: { about: 'Om oss', privacy: 'Integritet', gdpr: 'GDPR', contact: 'Kontakt', terms: 'Villkor' }
                },
                meta: {
                    title: 'Yachting Earth — Rita upp planen. Skydda besättningen.',
                    description: 'Registrera fartyg, rutter och besättning innan ni kastar loss. Missar du incheckningen får din nödkontakt automatiskt säker, skrivskyddad åtkomst till allt de behöver.'
                }
            }
        }
    };

    function getLang() {
        var params = new URLSearchParams(window.location.search);
        var fromQuery = params.get('lang');
        if (fromQuery && SUPPORTED.indexOf(fromQuery) !== -1) return fromQuery;

        var fromStorage = localStorage.getItem('ye_lang');
        if (fromStorage && SUPPORTED.indexOf(fromStorage) !== -1) return fromStorage;

        var browserLang = (navigator.language || '').split('-')[0];
        if (browserLang && SUPPORTED.indexOf(browserLang) !== -1) return browserLang;

        return DEFAULT_LANG;
    }

    function lookup(dict, key) {
        return key.split('.').reduce(function (node, part) {
            return node && typeof node === 'object' ? node[part] : undefined;
        }, dict);
    }

    function applyTranslations(lang) {
        var dict = DICTS[lang] || DICTS[DEFAULT_LANG];

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var value = lookup(dict, el.getAttribute('data-i18n'));
            if (typeof value === 'string') {
                el.textContent = value;
            }
        });

        var metaDescEl = document.querySelector('meta[name="description"]');
        var metaDesc = lookup(dict, 'landing2.meta.description');
        if (metaDescEl && metaDesc) metaDescEl.setAttribute('content', metaDesc);

        var title = lookup(dict, 'landing2.meta.title');
        if (title) document.title = title;

        document.documentElement.lang = lang;
    }

    function setLang(lang) {
        if (SUPPORTED.indexOf(lang) === -1) return;
        localStorage.setItem('ye_lang', lang);
        applyTranslations(lang);
        initIcons();
        updateLangButtons(lang);
    }

    function updateLangButtons(lang) {
        document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
            btn.classList.toggle('is-active', btn.getAttribute('data-lang-btn') === lang);
        });
    }

    function initLangToggle() {
        document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setLang(btn.getAttribute('data-lang-btn'));
            });
        });
    }

    function initIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function initNavToggle() {
        var toggle = document.getElementById('nav-toggle');
        var links = document.getElementById('site-nav-links');
        if (!toggle || !links) return;

        toggle.addEventListener('click', function () {
            var isOpen = links.classList.toggle('flex');
            links.classList.toggle('hidden');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        links.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                links.classList.add('hidden');
                links.classList.remove('flex');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function initScrollReveal() {
        var targets = document.querySelectorAll('.reveal');
        if (!targets.length) return;

        if (!('IntersectionObserver' in window)) {
            targets.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        targets.forEach(function (el) { observer.observe(el); });
    }

    var toastTimer = null;
    function showToast(message) {
        var toast = document.querySelector('.landing2-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'landing2-toast';
            toast.setAttribute('role', 'status');
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        requestAnimationFrame(function () { toast.classList.add('is-visible'); });
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2200);
    }

    function initComingSoonLinks() {
        document.querySelectorAll('[data-soon]').forEach(function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                showToast(link.textContent.trim() + ' – coming soon');
            });
        });
    }

    function initYear() {
        var el = document.getElementById('year');
        if (el) el.textContent = String(new Date().getFullYear());
    }

    document.addEventListener('DOMContentLoaded', function () {
        var lang = getLang();
        if (lang !== DEFAULT_LANG) applyTranslations(lang);
        updateLangButtons(lang);

        initIcons();
        initNavToggle();
        initLangToggle();
        initScrollReveal();
        initComingSoonLinks();
        initYear();
    });
})();
