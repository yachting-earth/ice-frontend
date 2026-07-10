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
                    <div class="alert alert-error">${escapeHtml(t('verifyEmail.noToken'))}</div>
                    <a class="btn btn-secondary" href="#/login">${escapeHtml(t('verifyEmail.backToStart'))}</a>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="page page--narrow">
                <div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('verifyEmail.confirming'))}</div>
            </div>`;

        const response = await apiRequest('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ token })
        });

        if (!response.success) {
            const message = response.code === 'RESOURCE_CONFLICT'
                ? t('verifyEmail.emailTaken')
                : (response.code ? t.error(response.code) : (response.error || t('verifyEmail.linkInvalid')));
            container.innerHTML = `
                <div class="page page--narrow">
                    <h1>${escapeHtml(t('verifyEmail.failedTitle'))}</h1>
                    <div class="alert alert-error">${escapeHtml(message)}</div>
                    <a class="btn btn-secondary" href="${Auth.isAuthenticated() ? '#/dashboard' : '#/login'}">
                        ${escapeHtml(Auth.isAuthenticated() ? t('verifyEmail.toOverview') : t('verifyEmail.toLogin'))}
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

        const heading = isChange ? t('verifyEmail.changedTitle') : t('verifyEmail.confirmedTitle');
        const body = isChange
            ? t('verifyEmail.changedBody', { email: escapeHtml(response.data.email || '') })
            : t('verifyEmail.confirmedBody');
        const cta = Auth.isAuthenticated()
            ? `<a class="btn btn-primary" href="#/dashboard">${escapeHtml(t('verifyEmail.toOverview'))}</a>`
            : `<a class="btn btn-primary" href="#/login">${escapeHtml(t('login.submit'))}</a>`;

        container.innerHTML = `
            <div class="page page--narrow">
                <h1>${escapeHtml(heading)}</h1>
                <div class="alert alert-success">${body}</div>
                ${cta}
            </div>`;
    }
};
