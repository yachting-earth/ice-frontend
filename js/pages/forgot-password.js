/**
 * Public "forgot password" request page (#/forgot-password). Always shows
 * the same generic success message after submit, regardless of whether the
 * email is registered - see AuthHandler::forgotPassword(), which never
 * reveals account existence.
 */
const ForgotPasswordPage = {
    async render(container) {
        container.innerHTML = `
            <div class="centered-page">
                <div class="auth-card">
                    <div class="auth-card__logo">${brandMark()} ${escapeHtml(t('app.brand'))}</div>
                    <div class="auth-card__tagline">${escapeHtml(t('forgotPassword.tagline'))}</div>
                    <div id="forgot-alert"></div>
                    <form id="forgot-form" novalidate>
                        <div class="field">
                            <label for="email">${escapeHtml(t('forgotPassword.emailLabel'))}</label>
                            <input type="email" id="email" autocomplete="email" required>
                        </div>
                        <div class="field hp-field" aria-hidden="true">
                            <label for="website">Website</label>
                            <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
                        </div>
                        <button class="btn btn-primary btn-block" type="submit" id="forgot-submit">${escapeHtml(t('forgotPassword.submit'))}</button>
                    </form>
                    <div class="auth-card__footer">
                        <a href="#/login">${escapeHtml(t('forgotPassword.backToLogin'))}</a>
                    </div>
                </div>
            </div>`;

        document.getElementById('forgot-form').addEventListener('submit', (e) => this.handleSubmit(e));
    },

    async handleSubmit(e) {
        e.preventDefault();

        const alertBox = document.getElementById('forgot-alert');
        const submitBtn = document.getElementById('forgot-submit');
        alertBox.innerHTML = '';

        const email = document.getElementById('email').value.trim();
        const website = document.getElementById('website').value;

        const emailError = Validate.email(email);
        if (emailError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(emailError)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('forgotPassword.submitting'))}`;

        const response = await apiRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email, website })
        });

        // Only a network/parse failure means nothing actually reached the
        // server - anything else (including a backend "success") always
        // shows the same generic message, so this page never reveals
        // whether the email is a registered account.
        if (!response.success && (response.code === 'NETWORK_ERROR' || response.code === 'PARSE_ERROR')) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t.error(response.code))}</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = t('forgotPassword.submit');
            return;
        }

        alertBox.innerHTML = `<div class="alert alert-success">${escapeHtml(t('forgotPassword.sent'))}</div>`;
        document.getElementById('forgot-form').hidden = true;
    }
};
