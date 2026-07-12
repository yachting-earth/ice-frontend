const LoginPage = {
    async render(container) {
        container.innerHTML = `
            <div class="centered-page">
                <div class="auth-card">
                    <div class="auth-card__logo">⚓ ${escapeHtml(t('app.brand'))}</div>
                    <div class="auth-card__tagline">${escapeHtml(t('login.tagline'))}</div>
                    <div id="login-alert"></div>
                    <form id="login-form" novalidate>
                        <div class="field">
                            <label for="email">${escapeHtml(t('login.emailLabel'))}</label>
                            <input type="email" id="email" autocomplete="email" required>
                        </div>
                        <div class="field">
                            <label for="password">${escapeHtml(t('login.passwordLabel'))}</label>
                            <input type="password" id="password" autocomplete="current-password" required>
                        </div>
                        <button class="btn btn-primary btn-block" type="submit" id="login-submit">${escapeHtml(t('login.submit'))}</button>
                    </form>
                    <div class="auth-card__footer">
                        ${escapeHtml(t('login.noAccount'))} <a href="#/register">${escapeHtml(t('login.registerLink'))}</a>
                    </div>
                </div>
            </div>`;

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleSubmit(e));
    },

    async handleSubmit(e) {
        e.preventDefault();

        const alertBox = document.getElementById('login-alert');
        const submitBtn = document.getElementById('login-submit');
        alertBox.innerHTML = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const emailError = Validate.email(email);
        if (emailError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(emailError)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('login.submitting'))}`;

        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
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
            location.hash = '#/dashboard';
            return;
        }

        alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('login.errorDefault')))}</div>`;
        submitBtn.disabled = false;
        submitBtn.textContent = t('login.submit');
    }
};
