/**
 * Router and shared page chrome (topbar, toasts).
 *
 * Hash-based routing (#/dashboard, #/trips/new, ...) is used deliberately -
 * this app has no build step and is served as static files (GitHub Pages in
 * production, plain nginx locally), neither of which rewrite unknown paths
 * back to index.html. Hash routes always resolve to the same static file.
 */
const Router = {
    routes: [
        { pattern: '#/', page: LandingPage, guestOnly: true, noTopbar: true },
        { pattern: '#/login', page: LoginPage, guestOnly: true },
        { pattern: '#/register', page: RegisterPage, guestOnly: true },
        { pattern: '#/forgot-password', page: ForgotPasswordPage, guestOnly: true },
        { pattern: '#/reset-password', page: ResetPasswordPage },
        { pattern: '#/crew-gdpr', page: CrewGdprRequestPage },
        { pattern: '#/crew-gdpr-portal', page: CrewGdprPortalPage },
        { pattern: '#/dashboard', page: DashboardPage, auth: true },
        { pattern: '#/vessels', page: VesselsPage, auth: true },
        { pattern: '#/saved-routes', page: SavedRoutesPage, auth: true },
        { pattern: '#/profile', page: ProfilePage, auth: true },
        { pattern: '#/ice-contacts', page: IceContactsPage, auth: true },
        { pattern: '#/crew-address-book', page: CrewAddressBookPage, auth: true },
        { pattern: '#/ice-account', page: IceAccountPage, auth: true },
        { pattern: '#/admin', page: AdminPage, auth: true, adminOnly: true },
        { pattern: '#/trips/new', page: CreateTripPage, auth: true },
        { pattern: '#/trips/:tripId', page: TripDetailPage, auth: true },
        { pattern: '#/crew-join', page: CrewInvitePage },
        { pattern: '#/verify-email', page: VerifyEmailPage },
        { pattern: '#/ice-confirm', page: IceConfirmPage },
        { pattern: '#/ice-portal', page: IcePortalPage },
        { pattern: '#/crew-view', page: CrewViewPage },
        { pattern: '#/sar', page: SarPage },
        { pattern: '#/blog', page: BlogPage, noTopbar: true },
        { pattern: '#/blog/:slug', page: BlogPostPage, noTopbar: true },
        { pattern: '#/privacy', page: PrivacyPage, noTopbar: true },
        { pattern: '#/terms', page: TermsPage, noTopbar: true },
        { pattern: '#/contact', page: ContactPage, auth: true },
        { pattern: '#/about', page: AboutPage, noTopbar: true },
        { pattern: '#/faq', page: FaqPage, noTopbar: true },
        { pattern: '#/changelog', page: ChangelogPage, noTopbar: true }
    ],

    start() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    matchRoute() {
        const hash = location.hash || (Auth.isAuthenticated() ? '#/dashboard' : '#/');
        const [pathPart, queryPart] = hash.split('?');
        const pathSegments = pathPart.split('/');

        for (const route of this.routes) {
            const routeSegments = route.pattern.split('/');
            if (routeSegments.length !== pathSegments.length) continue;

            const params = {};
            const isMatch = routeSegments.every((seg, i) => {
                if (seg.startsWith(':')) {
                    params[seg.slice(1)] = decodeURIComponent(pathSegments[i]);
                    return true;
                }
                return seg === pathSegments[i];
            });

            if (isMatch) {
                return { route, params, query: new URLSearchParams(queryPart || '') };
            }
        }

        return null;
    },

    async handleRoute() {
        const matched = this.matchRoute();

        if (!matched) {
            renderTopbar();
            location.hash = Auth.isAuthenticated() ? '#/dashboard' : '#/';
            return;
        }

        const { route, params, query } = matched;

        if (route.auth && !Auth.isAuthenticated()) {
            location.hash = '#/login?redirect=' + encodeURIComponent(location.hash);
            return;
        }
        if (route.guestOnly && Auth.isAuthenticated()) {
            location.hash = '#/dashboard';
            return;
        }
        if (route.adminOnly && !Auth.getUser().isAdmin) {
            location.hash = '#/dashboard';
            return;
        }

        if (route.noTopbar) {
            document.getElementById('topbar').innerHTML = '';
        } else {
            renderTopbar();
        }

        // Authenticated pages get the same site footer as the public content
        // pages (about/terms/faq/privacy/blog) - noTopbar pages render their
        // own copy inline as part of their page content, so leave this empty
        // for those (and for the guestOnly auth pages, which don't have one).
        document.getElementById('site-footer').innerHTML = route.auth ? renderPublicFooter() : '';

        const container = document.getElementById('page-content');
        container.innerHTML = '';
        window.scrollTo(0, 0);

        try {
            await route.page.render(container, params, query);
        } catch (err) {
            console.error('Page render failed:', err);
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">${escapeHtml(t('app.renderError'))}</div>
                </div>`;
        }
    }
};

// Cached per session: whether the logged-in account is a confirmed ICE
// contact for anyone, i.e. whether "Mitt ICE-konto" has anything to show.
// null = not checked yet, reset to null on logout so a different account
// logging in on the same tab doesn't inherit a stale answer.
let iceAccountVisible = null;

async function checkIceAccountVisibility() {
    if (iceAccountVisible !== null) return iceAccountVisible;
    try {
        const response = await apiRequest('/ice-contacts/me');
        iceAccountVisible = !!(response.success && Array.isArray(response.data) && response.data.length > 0);
    } catch (err) {
        iceAccountVisible = false;
    }
    return iceAccountVisible;
}

// Same idea as iceAccountVisible above, but for the nav items that should
// only show once the skipper actually has something saved of that kind.
// Keyed by nav item, each null until its list endpoint has been checked.
const NAV_VISIBILITY_ENDPOINTS = {
    myVessels: '/vessels',
    savedRoutes: '/saved-routes',
    iceContacts: '/ice-contacts',
    crewAddressBook: '/crew/address-book/all'
};
let navVisibility = { myVessels: null, savedRoutes: null, iceContacts: null, crewAddressBook: null };

async function checkNavVisibility(key) {
    if (navVisibility[key] !== null) return navVisibility[key];
    try {
        const response = await apiRequest(NAV_VISIBILITY_ENDPOINTS[key]);
        navVisibility[key] = !!(response.success && Array.isArray(response.data) && response.data.length > 0);
    } catch (err) {
        navVisibility[key] = false;
    }
    return navVisibility[key];
}

// Called by pages right after they save something that could newly qualify
// a nav item for display (e.g. a skipper's first vessel/contact/route), so
// the menu item appears immediately instead of only after the next
// login (when the caches below would otherwise still hold their stale,
// pre-save answer). Also covers the ICE-account link since it's cached the
// same way. Safe to call even if the topbar isn't currently rendered.
function invalidateNavVisibility(keys) {
    (Array.isArray(keys) ? keys : [keys]).forEach((key) => {
        if (key === 'iceAccount') {
            iceAccountVisible = null;
        } else {
            navVisibility[key] = null;
        }
    });
    if (document.getElementById('topbar')) renderTopbar();
}

function renderTopbar() {
    const topbar = document.getElementById('topbar');
    const authed = Auth.isAuthenticated();
    const currentPath = (location.hash || '#/dashboard').split('?')[0];
    const activeClass = (path) => (currentPath === path ? ' topbar__menu-link--active' : '');

    if (!authed) {
        topbar.innerHTML = `
            <a class="topbar__brand" href="https://yachting.earth">${brandMark()} ${escapeHtml(t('app.brand'))}</a>
            <div class="topbar__right">
                <div class="topbar__menu" id="topbar-menu">
                    ${renderLangSelector()}
                </div>
                <button class="topbar__hamburger" id="hamburger" aria-label="${escapeHtml(t('app.toggleNav'))}" aria-expanded="false">
                    <span class="topbar__hamburger-line"></span>
                    <span class="topbar__hamburger-line"></span>
                    <span class="topbar__hamburger-line"></span>
                </button>
            </div>`;
        setupHamburgerMenu();
        setupLangSelector();
        return;
    }

    const user = Auth.getUser();
    const userLabel = user.name || user.email || '';
    const initial = userLabel.trim().charAt(0).toUpperCase() || '?';

    topbar.innerHTML = `
        <a class="topbar__brand" href="https://yachting.earth">${brandMark()} ${escapeHtml(t('app.brand'))}</a>
        <div class="topbar__right">
            <div class="topbar__menu" id="topbar-menu">
                <a class="topbar__menu-link${activeClass('#/dashboard')}" href="#/dashboard">${escapeHtml(t('app.nav.myTrips'))}</a>
                ${navVisibility.myVessels ? `<a class="topbar__menu-link${activeClass('#/vessels')}" href="#/vessels">${escapeHtml(t('app.nav.myVessels'))}</a>` : ''}
                ${navVisibility.savedRoutes ? `<a class="topbar__menu-link${activeClass('#/saved-routes')}" href="#/saved-routes">${escapeHtml(t('app.nav.savedRoutes'))}</a>` : ''}
                ${navVisibility.iceContacts ? `<a class="topbar__menu-link${activeClass('#/ice-contacts')}" href="#/ice-contacts">${escapeHtml(t('app.nav.iceContacts'))}</a>` : ''}
                ${navVisibility.crewAddressBook ? `<a class="topbar__menu-link${activeClass('#/crew-address-book')}" href="#/crew-address-book">${escapeHtml(t('app.nav.crewAddressBook'))}</a>` : ''}
                ${iceAccountVisible ? `<a class="topbar__menu-link${activeClass('#/ice-account')}" href="#/ice-account">${escapeHtml(t('app.nav.myIceAccount'))}</a>` : ''}
                ${user.isAdmin ? `<a class="topbar__menu-link${activeClass('#/admin')}" href="#/admin">${escapeHtml(t('app.nav.admin'))}</a>` : ''}
                ${renderLangSelector()}
                <button class="topbar__menu-link topbar__menu-logout" id="logout-btn" type="button">${escapeHtml(t('app.nav.logout'))}</button>
            </div>
            <button class="topbar__hamburger" id="hamburger" aria-label="${escapeHtml(t('app.toggleNav'))}" aria-expanded="false">
                <span class="topbar__hamburger-line"></span>
                <span class="topbar__hamburger-line"></span>
                <span class="topbar__hamburger-line"></span>
            </button>
            <a class="topbar__badge${currentPath === '#/profile' ? ' topbar__badge--active' : ''}" id="topbar-badge" href="#/profile" title="${escapeHtml(t('app.profileBadgeTitle', { name: userLabel }))}">${escapeHtml(initial)}</a>
        </div>`;

    document.getElementById('logout-btn').addEventListener('click', () => {
        iceAccountVisible = null;
        navVisibility = { myVessels: null, savedRoutes: null, iceContacts: null, crewAddressBook: null };
        const refreshToken = Auth.getRefreshToken();
        Auth.clear();
        location.hash = '#/login';
        // Best-effort/fire-and-forget: revoke server-side so the refresh
        // token can't be used again, but never block navigating away.
        if (refreshToken) {
            apiRequest('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: refreshToken })
            });
        }
    });
    setupHamburgerMenu();
    setupLangSelector();
    loadTopbarPhoto(user.id);

    if (iceAccountVisible === null) {
        checkIceAccountVisibility().then((visible) => {
            if (visible) renderTopbar();
        });
    }

    Object.keys(NAV_VISIBILITY_ENDPOINTS).forEach((key) => {
        if (navVisibility[key] === null) {
            checkNavVisibility(key).then((visible) => {
                if (visible) renderTopbar();
            });
        }
    });
}

// Flag icons for the language switcher, drawn as inline SVG (no image
// assets to fetch/host) - simplified but recognizable constructions rather
// than exact flag-spec reproductions, since they only ever render at ~22px.
const LANG_META = {
    en: {
        name: 'English',
        flag: '<svg viewBox="0 0 30 20" class="lang-flag" aria-hidden="true" focusable="false">'
            + '<rect width="30" height="20" fill="#012169"/>'
            + '<path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" stroke-width="4"/>'
            + '<path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" stroke-width="1.6"/>'
            + '<path d="M15,0 V20 M0,10 H30" stroke="#fff" stroke-width="7"/>'
            + '<path d="M15,0 V20 M0,10 H30" stroke="#C8102E" stroke-width="4"/>'
            + '</svg>'
    },
    sv: {
        name: 'Svenska',
        flag: '<svg viewBox="0 0 30 20" class="lang-flag" aria-hidden="true" focusable="false">'
            + '<rect width="30" height="20" fill="#006AA7"/>'
            + '<rect x="10" width="4" height="20" fill="#FECC00"/>'
            + '<rect y="8" width="30" height="4" fill="#FECC00"/>'
            + '</svg>'
    },
    fr: {
        name: 'Français',
        flag: '<svg viewBox="0 0 30 20" class="lang-flag" aria-hidden="true" focusable="false">'
            + '<rect width="10" height="20" fill="#002395"/>'
            + '<rect x="10" width="10" height="20" fill="#fff"/>'
            + '<rect x="20" width="10" height="20" fill="#ED2939"/>'
            + '</svg>'
    },
    it: {
        name: 'Italiano',
        flag: '<svg viewBox="0 0 30 20" class="lang-flag" aria-hidden="true" focusable="false">'
            + '<rect width="10" height="20" fill="#009246"/>'
            + '<rect x="10" width="10" height="20" fill="#fff"/>'
            + '<rect x="20" width="10" height="20" fill="#CE2B37"/>'
            + '</svg>'
    },
    es: {
        name: 'Español',
        flag: '<svg viewBox="0 0 30 20" class="lang-flag" aria-hidden="true" focusable="false">'
            + '<rect width="30" height="20" fill="#AA151B"/>'
            + '<rect y="5" width="30" height="10" fill="#F1BF00"/>'
            + '</svg>'
    },
    de: {
        name: 'Deutsch',
        flag: '<svg viewBox="0 0 30 20" class="lang-flag" aria-hidden="true" focusable="false">'
            + '<rect width="30" height="6.67" fill="#000"/>'
            + '<rect y="6.67" width="30" height="6.67" fill="#DD0000"/>'
            + '<rect y="13.33" width="30" height="6.67" fill="#FFCE00"/>'
            + '</svg>'
    }
};

function langFlag(lang) {
    return (LANG_META[lang] || LANG_META[I18n.DEFAULT]).flag;
}

function langName(lang) {
    return (LANG_META[lang] || {}).name || lang.toUpperCase();
}

// Language selector shared by both the authed and guest topbars. A small
// custom dropdown (flags can't be put inside native <option> elements)
// that persists the choice via I18n.setLang - which itself reloads the page.
function renderLangSelector() {
    const current = I18n._lang || I18n.getLang();
    const options = I18n.SUPPORTED.map((lang) => `
        <li role="none">
            <button type="button" class="lang-switcher__option${lang === current ? ' lang-switcher__option--active' : ''}" data-lang="${lang}" role="option" aria-selected="${lang === current}">
                ${langFlag(lang)}<span>${escapeHtml(langName(lang))}</span>
            </button>
        </li>`).join('');
    return `
        <div class="lang-switcher" id="lang-switcher">
            <button type="button" class="lang-switcher__toggle" id="lang-switcher-toggle" aria-haspopup="listbox" aria-expanded="false" aria-label="Language: ${escapeHtml(langName(current))}">
                ${langFlag(current)}
            </button>
            <ul class="lang-switcher__menu" id="lang-switcher-menu" role="listbox" hidden>${options}</ul>
        </div>`;
}

function setupLangSelector() {
    const switcher = document.getElementById('lang-switcher');
    if (!switcher) return;
    const toggle = document.getElementById('lang-switcher-toggle');
    const menu = document.getElementById('lang-switcher-menu');

    const closeMenu = () => {
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = menu.hidden;
        // Close any other open switcher (desktop + mobile menu both render one).
        document.querySelectorAll('.lang-switcher__menu').forEach((m) => { m.hidden = true; });
        document.querySelectorAll('.lang-switcher__toggle').forEach((b) => b.setAttribute('aria-expanded', 'false'));
        if (willOpen) {
            menu.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
        }
    });

    menu.querySelectorAll('.lang-switcher__option').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const lang = btn.dataset.lang;
            closeMenu();
            if (Auth.isAuthenticated()) {
                // Await the save before reloading - I18n.setLang() below reloads
                // the page, which would otherwise cancel this in-flight request.
                await apiRequest('/user/profile', { method: 'PUT', body: JSON.stringify({ locale: lang }) });
            }
            I18n.setLang(lang);
        });
    });

    // Bound once globally (not per render) so re-rendering the topbar on
    // every route change never stacks duplicate document-level listeners.
    if (!window.__langSwitcherGlobalListenersBound) {
        window.__langSwitcherGlobalListenersBound = true;
        const closeAllMenus = () => {
            document.querySelectorAll('.lang-switcher__menu:not([hidden])').forEach((openMenu) => {
                openMenu.hidden = true;
                const parent = openMenu.closest('.lang-switcher');
                const t = parent && parent.querySelector('.lang-switcher__toggle');
                if (t) t.setAttribute('aria-expanded', 'false');
            });
        };
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.lang-switcher__menu:not([hidden])').forEach((openMenu) => {
                const parent = openMenu.closest('.lang-switcher');
                if (parent && !parent.contains(e.target)) closeAllMenus();
            });
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeAllMenus();
        });
    }
}

// The badge photo is auth-protected, so a plain <img src> won't do (no way
// to attach the Authorization header) - fetch as blob and swap in. Always
// attempted (rather than gated on a stored flag) since localStorage from a
// previous login on this device may be stale or absent.
async function loadTopbarPhoto(userId) {
    if (!userId) return;
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/users/${userId}/photo`, {
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        if (!response.ok) return;
        const badge = document.getElementById('topbar-badge');
        if (!badge) return;
        badge.innerHTML = `<img src="${URL.createObjectURL(await response.blob())}" alt="">`;
    } catch (err) { /* leave the initial shown */ }
}

function setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('topbar-menu');

    if (!hamburger || !menu) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        menu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', hamburger.classList.contains('active'));
    });

    const menuLinks = menu.querySelectorAll('.topbar__menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            menu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            hamburger.classList.remove('active');
            menu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
}

function showToast(message, type = 'info') {
    const stack = document.getElementById('toast-stack');
    const el = document.createElement('div');
    el.className = `alert alert-${type}`;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}

// Shared brand mark (topbar, auth cards) - mirrors the landing page's
// site-nav__brand icon so logged-in and public pages read as the same app.
function brandMark() {
    return '<img src="img/yachting.png" class="brand-mark" width="22" height="22" alt="" aria-hidden="true">';
}

// Header/footer chrome shared by the public content pages (about, terms,
// faq, privacy, blog/blog-post) - the same site-nav/site-footer markup as
// the landing page (#/), minus the landing page's in-page section anchors
// (those pages have no such sections to scroll to). Reuses landing.css's
// `.landing-page`-scoped styles by wrapping just the header/footer, not the
// page content, so the landing page's h1/p/a/ul overrides don't leak into
// the content in between.
function renderPublicHeader() {
    const authed = Auth.isAuthenticated();

    if (authed) {
        // Render logged-in topbar for authenticated users on public pages
        return `
            <div id="topbar" class="topbar"></div>
        `;
    }

    return `
        <div class="landing-page">
          <header class="site-nav" id="site-nav">
            <div class="site-nav__inner">
              <a class="site-nav__brand" href="#/">
                <img src="img/yachting.png" width="22" height="22" alt="" aria-hidden="true">
                <span>${escapeHtml(t('app.brand'))}</span>
              </a>

              <button class="site-nav__toggle" id="public-nav-toggle" aria-expanded="false" aria-controls="public-nav-links" aria-label="${escapeHtml(t('app.toggleNav'))}">
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
                <span aria-hidden="true"></span>
              </button>

              <nav class="site-nav__links" id="public-nav-links" aria-label="Primary">
                <a class="site-nav__cta site-nav__cta--ghost" href="#/login">${escapeHtml(t('landing.nav.login'))}</a>
                <a class="site-nav__cta" href="#/register">${escapeHtml(t('landing.nav.cta'))}</a>
                ${renderLangSelector()}
              </nav>
            </div>
          </header>
        </div>`;
}

function renderPublicFooter() {
    return `
        <div class="landing-page">
          <footer class="site-footer">
            <div class="site-footer__inner">
              <span class="site-footer__brand">${escapeHtml(t('app.brand'))}</span>
              <nav aria-label="Footer">
                <a href="#/about">${escapeHtml(t('landing.footer.links.about'))}</a>
                <a href="#/blog">${escapeHtml(t('landing.footer.links.blog'))}</a>
                <a href="#/privacy">${escapeHtml(t('landing.footer.links.privacy'))}</a>
                <a href="#/privacy">${escapeHtml(t('landing.footer.links.gdpr'))}</a>
                <a href="#/contact">${escapeHtml(t('landing.footer.links.contact'))}</a>
                <a href="#/terms">${escapeHtml(t('landing.footer.links.terms'))}</a>
                <a href="#/faq">${escapeHtml(t('landing.footer.links.faq'))}</a>
              </nav>
              <p class="site-footer__disclaimer">${escapeHtml(t('landing.footer.disclaimer'))}</p>
              <a class="site-footer__version" href="#/changelog">${escapeHtml(t('app.version', { version: CONFIG.APP_VERSION }))}</a>
            </div>
          </footer>
        </div>`;
}

// Wires the mobile nav toggle + language switcher for renderPublicHeader().
// Call once after the header markup has been inserted into the DOM.
function setupPublicHeader() {
    const authed = Auth.isAuthenticated();

    if (authed) {
        // For authenticated users, render the full topbar
        const topbar = document.getElementById('topbar');
        if (topbar !== null) {
            renderTopbar();
        }
        return;
    }

    const toggle = document.getElementById('public-nav-toggle');
    const links = document.getElementById('public-nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            const isOpen = links.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });
    }
    setupLangSelector();
}

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

// Shared full-size image viewer for vessel/crew/skipper photos. Reuses
// whatever URL is already on the triggering <img> (a blob: URL for the
// auth-protected fetch-as-blob photos, or a direct token-qualified URL on
// the ICE portal) rather than re-fetching the image.
function openLightbox(src, alt = '') {
    closeLightbox();
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.id = 'lightbox-overlay';
    overlay.innerHTML = `
        <button type="button" class="lightbox-overlay__close" aria-label="${escapeHtml(t('app.lightboxClose'))}">&times;</button>
        <img class="lightbox-overlay__img" src="${src}" alt="${escapeHtml(alt)}">`;
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('lightbox-overlay__close')) closeLightbox();
    });
    document.addEventListener('keydown', lightboxKeydown);
    document.body.appendChild(overlay);
}

function closeLightbox() {
    document.getElementById('lightbox-overlay')?.remove();
    document.removeEventListener('keydown', lightboxKeydown);
}

function lightboxKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
}

// Wires click-to-expand onto every already-rendered `<img class="lightbox-trigger">`
// under root that currently has a src. Safe to call repeatedly (e.g. once a
// blob photo finishes loading asynchronously) - each image is bound once.
function bindLightboxImages(root) {
    root.querySelectorAll('img.lightbox-trigger').forEach((img) => {
        if (img.dataset.lightboxBound || !img.src) return;
        img.dataset.lightboxBound = 'true';
        img.addEventListener('click', () => openLightbox(img.src, img.alt));
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const lang = I18n.getLang();
    document.documentElement.lang = lang;
    await I18n.load(lang);
    Router.start();
});
