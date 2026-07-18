/**
 * Public password-reset landing page (#/reset-password?token=..). Lets the
 * account holder choose a new password, consuming the single-use token
 * mailed by AuthHandler::forgotPassword() via POST /auth/reset-password.
 */
const ResetPasswordPage = {
    async render(container, params, query) {
        this.container = container;
        this.token = query.get('token');

        if (!this.token) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">${escapeHtml(t('resetPassword.noToken'))}</div>
                    <a class="btn btn-secondary" href="#/forgot-password">${escapeHtml(t('resetPassword.requestNew'))}</a>
                </div>`;
            return;
        }

        container.innerHTML = `
            <div class="centered-page">
                <div class="auth-card">
                    <div class="auth-card__tagline">${escapeHtml(t('resetPassword.tagline'))}</div>
                    <div id="reset-alert"></div>
                    <form id="reset-form" novalidate>
                        <div class="field">
                            <label for="password">${escapeHtml(t('resetPassword.passwordLabel'))}</label>
                            <input type="password" id="password" autocomplete="new-password" required>
                            <small>${escapeHtml(t('register.passwordHint'))}</small>
                        </div>
                        <div class="field">
                            <label for="confirm-password">${escapeHtml(t('resetPassword.confirmPasswordLabel'))}</label>
                            <input type="password" id="confirm-password" autocomplete="new-password" required>
                        </div>
                        <button class="btn btn-primary btn-block" type="submit" id="reset-submit">${escapeHtml(t('resetPassword.submit'))}</button>
                    </form>
                </div>
            </div>`;

        document.getElementById('reset-form').addEventListener('submit', (e) => this.handleSubmit(e));
    },

    async handleSubmit(e) {
        e.preventDefault();

        const alertBox = document.getElementById('reset-alert');
        const submitBtn = document.getElementById('reset-submit');
        alertBox.innerHTML = '';

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        const error = Validate.password(password)
            || (password !== confirmPassword ? t('resetPassword.passwordMismatch') : null);

        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('resetPassword.submitting'))}`;

        const response = await apiRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token: this.token, password })
        });

        if (!response.success) {
            const message = response.code === 'PASSWORD_RESET_EXPIRED'
                ? t('resetPassword.linkExpired')
                : (response.code ? t.error(response.code) : (response.error || t('resetPassword.errorDefault')));
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(message)}</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = t('resetPassword.submit');
            return;
        }

        // The reset also revoked every existing session server-side -
        // clear whatever local session might still be sitting around.
        Auth.clear();

        this.container.innerHTML = `
            <div class="page page--narrow">
                <h1>${escapeHtml(t('resetPassword.successTitle'))}</h1>
                <div class="alert alert-success">${escapeHtml(t('resetPassword.successBody'))}</div>
                <a class="btn btn-primary" href="#/login">${escapeHtml(t('login.submit'))}</a>
            </div>`;
    }
};
