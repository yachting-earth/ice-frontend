/**
 * Public "crew self-service GDPR portal" link request page (#/crew-gdpr).
 * Always shows the same generic success message after submit, regardless
 * of whether the email matches anything - see
 * CrewGdprHandler::requestLink(), which never reveals whether an address
 * is registered as crew or an ICE contact.
 */
const CrewGdprRequestPage = {
    async render(container) {
        container.innerHTML = `
            <div class="centered-page">
                <div class="auth-card">
                    <div class="auth-card__logo">${brandMark()} ${escapeHtml(t('app.brand'))}</div>
                    <div class="auth-card__tagline">${escapeHtml(t('crewGdprRequest.tagline'))}</div>
                    <p class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(t('crewGdprRequest.intro'))}</p>
                    <div id="crew-gdpr-alert"></div>
                    <form id="crew-gdpr-form" novalidate>
                        <div class="field">
                            <label for="email">${escapeHtml(t('crewGdprRequest.emailLabel'))}</label>
                            <input type="email" id="email" autocomplete="email" required>
                        </div>
                        <div class="field hp-field" aria-hidden="true">
                            <label for="website">Website</label>
                            <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
                        </div>
                        <button class="btn btn-primary btn-block" type="submit" id="crew-gdpr-submit">${escapeHtml(t('crewGdprRequest.submit'))}</button>
                    </form>
                    <div class="auth-card__footer">
                        <a href="#/login">${escapeHtml(t('crewGdprRequest.backToLogin'))}</a>
                    </div>
                </div>
            </div>`;

        document.getElementById('crew-gdpr-form').addEventListener('submit', (e) => this.handleSubmit(e));
    },

    async handleSubmit(e) {
        e.preventDefault();

        const alertBox = document.getElementById('crew-gdpr-alert');
        const submitBtn = document.getElementById('crew-gdpr-submit');
        alertBox.innerHTML = '';

        const email = document.getElementById('email').value.trim();
        const website = document.getElementById('website').value;

        const emailError = Validate.email(email);
        if (emailError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(emailError)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('crewGdprRequest.submitting'))}`;

        const response = await apiRequest('/crew-gdpr/request-link', {
            method: 'POST',
            body: JSON.stringify({ email, website })
        });

        // Only a network/parse failure means nothing actually reached the
        // server - anything else (including a backend "success") always
        // shows the same generic message, so this page never reveals
        // whether the email matches anything.
        if (!response.success && (response.code === 'NETWORK_ERROR' || response.code === 'PARSE_ERROR')) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t.error(response.code))}</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = t('crewGdprRequest.submit');
            return;
        }

        alertBox.innerHTML = `<div class="alert alert-success">${escapeHtml(t('crewGdprRequest.sent'))}</div>`;
        document.getElementById('crew-gdpr-form').hidden = true;
    }
};
