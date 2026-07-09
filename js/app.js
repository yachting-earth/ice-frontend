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
        { pattern: '#/login', page: LoginPage, guestOnly: true },
        { pattern: '#/register', page: RegisterPage, guestOnly: true },
        { pattern: '#/dashboard', page: DashboardPage, auth: true },
        { pattern: '#/profile', page: ProfilePage, auth: true },
        { pattern: '#/ice-contacts', page: IceContactsPage, auth: true },
        { pattern: '#/trips/new', page: CreateTripPage, auth: true },
        { pattern: '#/trips/:tripId', page: TripDetailPage, auth: true },
        { pattern: '#/crew-join', page: CrewInvitePage },
        { pattern: '#/ice-confirm', page: IceConfirmPage },
        { pattern: '#/ice-portal', page: IcePortalPage },
        { pattern: '#/sar', page: SarPage }
    ],

    start() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    matchRoute() {
        const hash = location.hash || '#/dashboard';
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
        renderTopbar();

        if (!matched) {
            location.hash = Auth.isAuthenticated() ? '#/dashboard' : '#/login';
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

        const container = document.getElementById('page-content');
        container.innerHTML = '';

        try {
            await route.page.render(container, params, query);
        } catch (err) {
            console.error('Page render failed:', err);
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">Något gick fel när sidan skulle visas. Försök ladda om.</div>
                </div>`;
        }
    }
};

function renderTopbar() {
    const topbar = document.getElementById('topbar');
    const authed = Auth.isAuthenticated();
    const currentPath = (location.hash || '#/dashboard').split('?')[0];
    const activeClass = (path) => (currentPath === path ? ' topbar__menu-link--active' : '');

    if (!authed) {
        topbar.innerHTML = `
            <a class="topbar__brand" href="#/login">⚓ Yachting Earth</a>
            <div class="topbar__right">
                <div class="topbar__menu" id="topbar-menu">
                    <a class="topbar__menu-link${activeClass('#/sar')}" href="#/sar">SAR</a>
                </div>
                <button class="topbar__hamburger" id="hamburger" aria-label="Toggle navigation menu" aria-expanded="false">
                    <span class="topbar__hamburger-line"></span>
                    <span class="topbar__hamburger-line"></span>
                    <span class="topbar__hamburger-line"></span>
                </button>
            </div>`;
        setupHamburgerMenu();
        return;
    }

    const user = Auth.getUser();
    const userLabel = user.name || user.email || '';
    const initial = userLabel.trim().charAt(0).toUpperCase() || '?';

    topbar.innerHTML = `
        <a class="topbar__brand" href="#/dashboard">⚓ Yachting Earth</a>
        <div class="topbar__right">
            <div class="topbar__menu" id="topbar-menu">
                <a class="topbar__menu-link${activeClass('#/dashboard')}" href="#/dashboard">Mina resor</a>
                <a class="topbar__menu-link${activeClass('#/ice-contacts')}" href="#/ice-contacts">ICE-kontakter</a>
                <button class="topbar__menu-link topbar__menu-logout" id="logout-btn" type="button">Logga ut</button>
            </div>
            <button class="topbar__hamburger" id="hamburger" aria-label="Toggle navigation menu" aria-expanded="false">
                <span class="topbar__hamburger-line"></span>
                <span class="topbar__hamburger-line"></span>
                <span class="topbar__hamburger-line"></span>
            </button>
            <a class="topbar__badge${currentPath === '#/profile' ? ' topbar__badge--active' : ''}" id="topbar-badge" href="#/profile" title="${escapeHtml(userLabel)} - Min sida">${escapeHtml(initial)}</a>
        </div>`;

    document.getElementById('logout-btn').addEventListener('click', () => {
        Auth.clear();
        location.hash = '#/login';
    });
    setupHamburgerMenu();
    loadTopbarPhoto(user.id);
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

function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value ?? '';
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => Router.start());
