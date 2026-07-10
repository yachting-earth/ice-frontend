const DashboardPage = {
    STATUS_LABELS: {
        draft: 'Utkast',
        published: 'Publicerad',
        active: 'Aktiv',
        completed: 'Avslutad',
        cancelled: 'Inställd'
    },

    state: {
        statusFilter: null,
        vesselsById: {}
    },

    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>Mina resor</h1>
                        <div class="page-header__meta">Överblick över alla dina planerade och pågående resor</div>
                    </div>
                    <a class="btn btn-primary" href="#/trips/new">+ Skapa ny resa</a>
                </div>
                <div id="email-verify-warning"></div>
                <div id="ice-contact-warning"></div>
                <div class="trip-filters" id="trip-filters"></div>
                <div id="trip-list-container"><div class="loading-state"><span class="spinner"></span> Laddar resor...</div></div>
            </div>`;

        this.renderFilters(container);

        const vessels = await apiRequest('/vessels');
        if (vessels.success) {
            this.state.vesselsById = Object.fromEntries(vessels.data.map((v) => [v.id, v.vessel_name]));
        }

        await this.loadTrips();
        this.checkIceContacts();
        this.checkEmailVerified();
    },

    // Read verification state fresh from the server (the stored session flag
    // can be stale after verifying in another tab) and nag until confirmed.
    async checkEmailVerified() {
        const response = await apiRequest('/user/profile');
        if (!response.success) return;

        const verified = !!response.data.email_verified;
        Auth.updateUser({ email_verified: verified });

        const box = document.getElementById('email-verify-warning');
        if (!box || verified) return;

        box.innerHTML = `
            <div class="alert alert-warning">
                Bekräfta din e-postadress (<strong>${escapeHtml(response.data.email || '')}</strong>)
                för att kunna skapa resor och lägga till båtar. Kontrollera din inkorg efter länken.
                <button class="btn btn-sm btn-secondary" type="button" id="resend-verify-btn"
                        style="margin-left: var(--space-2);">Skicka länken igen</button>
            </div>`;

        document.getElementById('resend-verify-btn').addEventListener('click', () => this.resendVerification());
    },

    async resendVerification() {
        const btn = document.getElementById('resend-verify-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Skickar...';

        const response = await apiRequest('/auth/resend-verification', { method: 'POST' });

        if (response.success && response.data.already_verified) {
            // Verified elsewhere in the meantime - drop the banner.
            Auth.updateUser({ email_verified: true });
            document.getElementById('email-verify-warning').innerHTML = '';
            showToast('Din e-postadress är redan bekräftad.', 'success');
            return;
        }

        if (response.success && response.data.verification_sent) {
            showToast('En ny verifieringslänk har skickats.', 'success');
        } else {
            showToast('Kunde inte skicka länken just nu. Försök igen senare.', 'error');
        }

        btn.disabled = false;
        btn.textContent = 'Skicka länken igen';
    },

    async checkIceContacts() {
        const response = await apiRequest('/ice-contacts');
        if (!response.success) return;

        const warningBox = document.getElementById('ice-contact-warning');
        if (warningBox && (response.data || []).length === 0) {
            warningBox.innerHTML = `
                <div class="alert alert-warning">
                    Du har ingen ICE-kontakt än — utan en kan ingen larmas om din resa inte bekräftas i tid.
                    <a href="#/ice-contacts">Lägg till en ICE-kontakt</a>
                </div>`;
        }
    },

    renderFilters(container) {
        const filters = [
            { value: null, label: 'Alla' },
            { value: 'draft', label: 'Utkast' },
            { value: 'published', label: 'Publicerad' },
            { value: 'active', label: 'Aktiv' },
            { value: 'completed', label: 'Avslutad' },
            { value: 'cancelled', label: 'Inställd' }
        ];

        const filterBar = container.querySelector('#trip-filters');
        filterBar.innerHTML = filters.map((f) => `
            <button class="btn btn-sm ${this.state.statusFilter === f.value ? 'btn-primary' : 'btn-secondary'}"
                    type="button" data-status="${f.value ?? ''}">${f.label}</button>
        `).join('');

        filterBar.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.state.statusFilter = btn.dataset.status || null;
                this.renderFilters(container);
                this.loadTrips();
            });
        });
    },

    async loadTrips() {
        const listContainer = document.getElementById('trip-list-container');
        listContainer.innerHTML = '<div class="loading-state"><span class="spinner"></span> Laddar resor...</div>';

        const params = new URLSearchParams();
        if (this.state.statusFilter) params.append('status', this.state.statusFilter);

        const response = await apiRequest(`/trips?${params.toString()}`);

        if (!response.success) {
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta resor.')}</div>`;
            return;
        }

        const trips = response.data || [];
        if (trips.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Inga resor än</h3>
                    <p>Skapa din första resa för att komma igång.</p>
                    <a class="btn btn-primary" href="#/trips/new">+ Skapa ny resa</a>
                </div>`;
            return;
        }

        listContainer.innerHTML = `<div class="trip-list">${trips.map((t) => this.renderTripCard(t)).join('')}</div>`;
    },

    renderTripCard(trip) {
        const vesselName = this.state.vesselsById[trip.vessel_id] || `Fartyg #${trip.vessel_id}`;
        const graceLabel = CONFIG.GRACE_PERIOD_OPTIONS.find((g) => g.seconds === Number(trip.grace_period_seconds))?.label
            || `${Math.round(trip.grace_period_seconds / 3600)} tim`;

        return `
            <div class="trip-card">
                <div class="stack" style="flex:1; gap: 0.35rem;">
                    <div class="trip-card__top">
                        <span class="trip-card__title">${escapeHtml(vesselName)}</span>
                        <span class="badge badge-${trip.status}">${this.STATUS_LABELS[trip.status] || trip.status}</span>
                    </div>
                    <div class="trip-card__meta">
                        <span>Avgång: ${formatDateTime(trip.departure_scheduled)}</span>
                        <span>Ankomst: ${formatDateTime(trip.arrival_scheduled)}</span>
                        <span>Marginal: ${graceLabel}</span>
                        ${trip.ice_notified ? '<span class="text-muted">⚠ ICE-kontakt notifierad</span>' : ''}
                    </div>
                </div>
                <div class="trip-card__actions">
                    <a class="btn btn-secondary btn-sm" href="#/trips/${trip.id}">Visa</a>
                </div>
            </div>`;
    }
};
