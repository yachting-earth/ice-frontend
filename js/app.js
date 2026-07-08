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
        { pattern: '#/ice-contacts', page: IceContactsPage, auth: true },
        { pattern: '#/trips/new', page: CreateTripPage, auth: true },
        { pattern: '#/trips/:tripId', page: TripDetailPage, auth: true },
        { pattern: '#/crew-join', page: CrewInvitePage },
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

    if (!authed) {
        topbar.innerHTML = `
            <a class="topbar__brand" href="#/login">⚓ Yachting Earth</a>
            <div class="topbar__actions">
                <a class="btn btn-ghost btn-sm" href="#/sar">SAR</a>
            </div>`;
        return;
    }

    const user = Auth.getUser();
    topbar.innerHTML = `
        <a class="topbar__brand" href="#/dashboard">⚓ Yachting Earth</a>
        <div class="topbar__actions">
            <a class="btn btn-ghost btn-sm" href="#/ice-contacts">ICE-kontakter</a>
            <span class="topbar__user">${escapeHtml(user.name || user.email || '')}</span>
            <button class="btn btn-ghost btn-sm" id="logout-btn" type="button">Logga ut</button>
        </div>`;

    document.getElementById('logout-btn').addEventListener('click', () => {
        Auth.clear();
        location.hash = '#/login';
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
