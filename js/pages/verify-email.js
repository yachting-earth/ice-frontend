/**
 * Public email-verification landing page (#/verify-email?token=..).
 *
 * The verification link mails users here (a hash route + JS POST rather than
 * a GET endpoint) so email-scanner prefetches can't silently consume the
 * single-use token. On load it POSTs the token to /auth/verify-email and
 * reports the outcome. Handles both the registration and email-change flows -
 * the backend tells us which via response.data.purpose.
 */
const VerifyEmailPage = {
    async render(container, params, query) {
        const token = query.get('token');

        if (!token) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">Ingen verifieringslänk hittades. Kontrollera att du klickade på hela länken.</div>
                    <a class="btn btn-secondary" href="#/login">Till startsidan</a>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="page page--narrow">
                <div class="loading-state"><span class="spinner"></span> Bekräftar din e-postadress...</div>
            </div>`;

        const response = await apiRequest('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ token })
        });

        if (!response.success) {
            const message = response.code === 'RESOURCE_CONFLICT'
                ? 'Den nya e-postadressen är redan upptagen av ett annat konto.'
                : (response.error || 'Länken är ogiltig eller har gått ut.');
            container.innerHTML = `
                <div class="page page--narrow">
                    <h1>Verifiering misslyckades</h1>
                    <div class="alert alert-error">${escapeHtml(message)}</div>
                    <a class="btn btn-secondary" href="${Auth.isAuthenticated() ? '#/dashboard' : '#/login'}">
                        ${Auth.isAuthenticated() ? 'Till din översikt' : 'Till inloggning'}
                    </a>
                </div>`;
            return;
        }

        // A verified email change may alter the address our stored session
        // shows - keep localStorage in sync if this is the logged-in user.
        const isChange = response.data.purpose === 'email_change';
        if (isChange && Auth.isAuthenticated() && response.data.email) {
            Auth.updateUser({ email: response.data.email });
            renderTopbar();
        }

        const heading = isChange ? 'E-postadressen har uppdaterats' : 'E-postadressen är bekräftad';
        const body = isChange
            ? `Din e-postadress har ändrats till <strong>${escapeHtml(response.data.email || '')}</strong>.`
            : 'Tack! Ditt konto är nu bekräftat och du har full tillgång till Yachting Earth.';
        const cta = Auth.isAuthenticated()
            ? '<a class="btn btn-primary" href="#/dashboard">Till din översikt</a>'
            : '<a class="btn btn-primary" href="#/login">Logga in</a>';

        container.innerHTML = `
            <div class="page page--narrow">
                <h1>${heading}</h1>
                <div class="alert alert-success">${body}</div>
                ${cta}
            </div>`;
    }
};
