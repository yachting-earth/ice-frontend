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
                    <div class="auth-card__logo">⚓ Yachting Earth</div>
                    <div class="auth-card__tagline">Åtkomst för sjöräddning (SAR)</div>
                    <p class="text-muted" style="font-size: var(--font-size-sm);">
                        Ange rese-ID och PIN-kod som ni fått från den nödställdes kontaktperson
                        för skrivskyddad åtkomst till resans besättningslista, rutter och ändringslogg.
                    </p>
                    <div id="sar-alert"></div>
                    <form id="sar-form" novalidate>
                        <div class="field">
                            <label for="sar-reference">Rese-ID</label>
                            <input type="text" id="sar-reference" placeholder="YE-XXXXXX" autocomplete="off" autocapitalize="characters">
                        </div>
                        <div class="field">
                            <label for="sar-pin">PIN-kod</label>
                            <input type="text" id="sar-pin" inputmode="numeric" placeholder="6 siffror" autocomplete="off">
                        </div>
                        <button class="btn btn-primary btn-block" type="submit" id="sar-submit">Visa resa</button>
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
            alertBox.innerHTML = `<div class="alert alert-error">Ange både rese-ID och PIN-kod.</div>`;
            return;
        }

        const submitBtn = document.getElementById('sar-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Kontrollerar...';

        const response = await apiRequest('/sar/lookup', {
            method: 'POST',
            body: JSON.stringify({ reference, pin })
        });

        submitBtn.disabled = false;
        submitBtn.textContent = 'Visa resa';

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">Fel rese-ID eller PIN-kod. Kontrollera uppgifterna och försök igen.</div>`;
            return;
        }

        location.hash = `#/ice-portal?trip=${encodeURIComponent(response.data.trip_id)}&token=${encodeURIComponent(response.data.token)}`;
    }
};
