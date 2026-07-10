/**
 * Public SAR (Search-and-Rescue) entry page.
 *
 * A SAR authority receives a trip reference (e.g. YE-K7M2PQ) and a PIN
 * from the skipper's ICE contact, enters them here, and is redirected to
 * the read-only trip portal. No account needed.
 */
const SarPage = {
    async render(container) {
        container.innerHTML = `
            <div class="centered-page">
                <div class="auth-card">
                    <div class="auth-card__logo">⚓ ${escapeHtml(t('app.brand'))}</div>
                    <div class="auth-card__tagline">${escapeHtml(t('sar.tagline'))}</div>
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
            </div>`;

        document.getElementById('sar-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    },

    async handleSubmit() {
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
