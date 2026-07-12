const RegisterPage = {
    async render(container) {
        container.innerHTML = `
            <div class="centered-page">
                <div class="auth-card">
                    <div class="auth-card__logo">${brandMark()} ${escapeHtml(t('app.brand'))}</div>
                    <div class="auth-card__tagline">${escapeHtml(t('register.tagline'))}</div>
                    <div id="register-alert"></div>
                    <form id="register-form" novalidate>
                        <div class="field">
                            <label for="name">${escapeHtml(t('register.nameLabel'))}</label>
                            <input type="text" id="name" autocomplete="name" required>
                        </div>
                        <div class="field">
                            <label for="email">${escapeHtml(t('register.emailLabel'))}</label>
                            <input type="email" id="email" autocomplete="email" required>
                        </div>
                        <div class="field">
                            <label for="phone">${escapeHtml(t('register.phoneLabel'))}</label>
                            <input type="tel" id="phone" autocomplete="tel" placeholder="${escapeHtml(t('register.phonePlaceholder'))}">
                        </div>
                        <div class="field">
                            <label for="password">${escapeHtml(t('register.passwordLabel'))}</label>
                            <input type="password" id="password" autocomplete="new-password" required>
                            <small>${escapeHtml(t('register.passwordHint'))}</small>
                        </div>
                        <div class="field">
                            <label for="confirm-password">${escapeHtml(t('register.confirmPasswordLabel'))}</label>
                            <input type="password" id="confirm-password" autocomplete="new-password" required>
                        </div>
                        <div class="field hp-field" aria-hidden="true">
                            <label for="website">Website</label>
                            <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
                        </div>
                        <button class="btn btn-primary btn-block" type="submit" id="register-submit">${escapeHtml(t('register.submit'))}</button>
                    </form>
                    <div class="auth-card__footer">
                        ${escapeHtml(t('register.haveAccount'))} <a href="#/login">${escapeHtml(t('register.loginLink'))}</a>
                    </div>
                </div>
            </div>`;

        document.getElementById('register-form').addEventListener('submit', (e) => this.handleSubmit(e));
    },

    async handleSubmit(e) {
        e.preventDefault();

        const alertBox = document.getElementById('register-alert');
        const submitBtn = document.getElementById('register-submit');
        alertBox.innerHTML = '';

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const website = document.getElementById('website').value;

        const error = Validate.name(name) || Validate.email(email)
            || Validate.phone(phone, true) || Validate.password(password)
            || (password !== confirmPassword ? t('register.passwordMismatch') : null);

        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('register.submitting'))}`;

        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, phone: phone || null, website })
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

        alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('register.errorDefault')))}</div>`;
        submitBtn.disabled = false;
        submitBtn.textContent = t('register.submit');
    }
};
