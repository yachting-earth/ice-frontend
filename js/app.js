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
        { pattern: '#/dashboard', page: DashboardPage, auth: true },
        { pattern: '#/vessels', page: VesselsPage, auth: true },
        { pattern: '#/profile', page: ProfilePage, auth: true },
        { pattern: '#/ice-contacts', page: IceContactsPage, auth: true },
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
        { pattern: '#/blog', page: BlogPage },
        { pattern: '#/blog/:slug', page: BlogPostPage },
        { pattern: '#/privacy', page: PrivacyPage },
        { pattern: '#/terms', page: TermsPage },
        { pattern: '#/contact', page: ContactPage, auth: true },
        { pattern: '#/about', page: AboutPage },
        { pattern: '#/faq', page: FaqPage }
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
            location.hash = '#/login';
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

function renderTopbar() {
    const topbar = document.getElementById('topbar');
    const authed = Auth.isAuthenticated();
    const currentPath = (location.hash || '#/dashboard').split('?')[0];
    const activeClass = (path) => (currentPath === path ? ' topbar__menu-link--active' : '');

    if (!authed) {
        topbar.innerHTML = `
            <a class="topbar__brand" href="#/login">${brandMark()} ${escapeHtml(t('app.brand'))}</a>
            <div class="topbar__right">
                <div class="topbar__menu" id="topbar-menu">
                    <a class="topbar__menu-link${activeClass('#/blog')}" href="#/blog">${escapeHtml(t('app.nav.blog'))}</a>
                    <a class="topbar__menu-link${activeClass('#/faq')}" href="#/faq">${escapeHtml(t('app.nav.faq'))}</a>
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
        <a class="topbar__brand" href="#/dashboard">${brandMark()} ${escapeHtml(t('app.brand'))}</a>
        <div class="topbar__right">
            <div class="topbar__menu" id="topbar-menu">
                <a class="topbar__menu-link${activeClass('#/dashboard')}" href="#/dashboard">${escapeHtml(t('app.nav.myTrips'))}</a>
                <a class="topbar__menu-link${activeClass('#/vessels')}" href="#/vessels">${escapeHtml(t('app.nav.myVessels'))}</a>
                <a class="topbar__menu-link${activeClass('#/ice-contacts')}" href="#/ice-contacts">${escapeHtml(t('app.nav.iceContacts'))}</a>
                ${iceAccountVisible ? `<a class="topbar__menu-link${activeClass('#/ice-account')}" href="#/ice-account">${escapeHtml(t('app.nav.myIceAccount'))}</a>` : ''}
                <a class="topbar__menu-link${activeClass('#/blog')}" href="#/blog">${escapeHtml(t('app.nav.blog'))}</a>
                <a class="topbar__menu-link${activeClass('#/faq')}" href="#/faq">${escapeHtml(t('app.nav.faq'))}</a>
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
}

// Language selector shared by both the authed and guest topbars. A plain
// <select> (no framework, no fancy dropdown) that persists the choice via
// I18n.setLang - which itself reloads the page.
function renderLangSelector() {
    const current = I18n._lang || I18n.getLang();
    const options = I18n.SUPPORTED.map((lang) =>
        `<option value="${lang}"${lang === current ? ' selected' : ''}>${lang.toUpperCase()}</option>`
    ).join('');
    return `<select class="topbar__lang" id="lang-select" aria-label="Language">${options}</select>`;
}

function setupLangSelector() {
    const select = document.getElementById('lang-select');
    if (!select) return;
    select.addEventListener('change', async () => {
        const lang = select.value;
        if (Auth.isAuthenticated()) {
            // Await the save before reloading - I18n.setLang() below reloads
            // the page, which would otherwise cancel this in-flight request.
            await apiRequest('/user/profile', { method: 'PUT', body: JSON.stringify({ locale: lang }) });
        }
        I18n.setLang(lang);
    });
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

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {
    const lang = I18n.getLang();
    document.documentElement.lang = lang;
    await I18n.load(lang);
    Router.start();
});
