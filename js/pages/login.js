const LoginPage = {
    async render(container, params, query) {
        this.redirectTarget = LoginPage.safeRedirect(query && query.get('redirect'));
        container.innerHTML = `
            <div class="centered-page">
                <div class="auth-card">
                    <div class="auth-card__logo">${brandMark()} ${escapeHtml(t('app.brand'))}</div>
                    <div class="auth-card__tagline">${escapeHtml(t('login.tagline'))}</div>
                    <div class="auth-tabs" role="tablist">
                        <button type="button" class="auth-tabs__tab auth-tabs__tab--active" id="tab-user" role="tab" aria-selected="true" aria-controls="panel-user">${escapeHtml(t('login.tabs.user'))}</button>
                        <button type="button" class="auth-tabs__tab" id="tab-sar" role="tab" aria-selected="false" aria-controls="panel-sar">${escapeHtml(t('login.tabs.sar'))}</button>
                    </div>

                    <div id="panel-user" role="tabpanel" aria-labelledby="tab-user">
                        <div id="login-alert"></div>
                        <form id="login-form" novalidate>
                            <div class="field">
                                <label for="email">${escapeHtml(t('login.emailLabel'))}</label>
                                <input type="email" id="email" autocomplete="email" required>
                            </div>
                            <div class="field">
                                <label for="password">${escapeHtml(t('login.passwordLabel'))}</label>
                                <input type="password" id="password" autocomplete="current-password" required>
                                <a class="auth-card__forgot-link" href="#/forgot-password">${escapeHtml(t('login.forgotPasswordLink'))}</a>
                            </div>
                            <div class="field hp-field" aria-hidden="true">
                                <label for="website">Website</label>
                                <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
                            </div>
                            <button class="btn btn-primary btn-block" type="submit" id="login-submit">${escapeHtml(t('login.submit'))}</button>
                        </form>
                        <div class="auth-card__footer">
                            ${escapeHtml(t('login.noAccount'))} <a href="#/register">${escapeHtml(t('login.registerLink'))}</a>
                        </div>
                    </div>

                    <div id="panel-sar" role="tabpanel" aria-labelledby="tab-sar" hidden>
                        <p class="text-muted" style="font-size: var(--font-size-sm);">
                            ${escapeHtml(t('sar.instructions'))}
                        </p>
                        <div id="sar-alert"></div>
                        <form id="sar-form" novalidate>
                            <div class="field">
                                <label for="sar-reference">${escapeHtml(t('sar.referenceLabel'))}</label>
                                <input type="text" id="sar-reference" placeholder="${escapeHtml(t('sar.referencePlaceholder'))}" autocomplete="off" autocapitalize="characters">
                            </div>
                            <div class="field">
                                <label for="sar-pin">${escapeHtml(t('sar.pinLabel'))}</label>
                                <input type="text" id="sar-pin" inputmode="numeric" placeholder="${escapeHtml(t('sar.pinPlaceholder'))}" autocomplete="off">
                            </div>
                            <button class="btn btn-primary btn-block" type="submit" id="sar-submit">${escapeHtml(t('sar.submit'))}</button>
                        </form>
                    </div>
                </div>
            </div>`;

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('sar-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSarSubmit();
        });
        this.setupTabs();
    },

    // Only accept an in-app hash destination - guards against an open
    // redirect via a crafted ?redirect= value.
    safeRedirect(value) {
        return value && value.startsWith('#/') && !value.startsWith('#//') ? value : null;
    },

    setupTabs() {
        const tabs = {
            user: { tab: document.getElementById('tab-user'), panel: document.getElementById('panel-user') },
            sar: { tab: document.getElementById('tab-sar'), panel: document.getElementById('panel-sar') }
        };

        const activate = (key) => {
            Object.entries(tabs).forEach(([name, { tab, panel }]) => {
                const active = name === key;
                tab.classList.toggle('auth-tabs__tab--active', active);
                tab.setAttribute('aria-selected', String(active));
                panel.hidden = !active;
            });
        };

        tabs.user.tab.addEventListener('click', () => activate('user'));
        tabs.sar.tab.addEventListener('click', () => activate('sar'));
    },

    async handleSubmit(e) {
        e.preventDefault();

        const alertBox = document.getElementById('login-alert');
        const submitBtn = document.getElementById('login-submit');
        alertBox.innerHTML = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const website = document.getElementById('website').value;

        const emailError = Validate.email(email);
        if (emailError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(emailError)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('login.submitting'))}`;

        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, website })
        });

        if (response.success) {
            Auth.setSession({
                auth_token: response.data.auth_token,
                refresh_token: response.data.refresh_token,
                user_id: response.data.user_id,
                name: response.data.name,
                email: response.data.email,
                picture: response.data.picture,
                is_admin: response.data.is_admin,
                email_verified: response.data.email_verified
            });
            if (response.data.locale) {
                localStorage.setItem('ye_lang', response.data.locale);
                await I18n.load(response.data.locale);
            }
            location.hash = this.redirectTarget || '#/dashboard';
            return;
        }

        alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('login.errorDefault')))}</div>`;
        submitBtn.disabled = false;
        submitBtn.textContent = t('login.submit');
    },

    async handleSarSubmit() {
        const alertBox = document.getElementById('sar-alert');
        const reference = document.getElementById('sar-reference').value.trim().toUpperCase();
        const pin = document.getElementById('sar-pin').value.trim();

        if (!reference || !pin) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('sar.missingFields'))}</div>`;
            return;
        }

        const submitBtn = document.getElementById('sar-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('sar.checking'))}`;

        const response = await apiRequest('/sar/lookup', {
            method: 'POST',
            body: JSON.stringify({ reference, pin })
        });

        submitBtn.disabled = false;
        submitBtn.textContent = t('sar.submit');

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('sar.invalidCredentials')))}</div>`;
            return;
        }

        location.hash = `#/ice-portal?trip=${encodeURIComponent(response.data.trip_id)}&token=${encodeURIComponent(response.data.token)}`;
    }
};
