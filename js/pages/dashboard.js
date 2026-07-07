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
                <div class="trip-filters" id="trip-filters"></div>
                <div id="trip-list-container"><div class="loading-state"><span class="spinner"></span> Laddar resor...</div></div>
            </div>`;

        this.renderFilters(container);

        const vessels = await apiRequest('/vessels');
        if (vessels.success) {
            this.state.vesselsById = Object.fromEntries(vessels.data.map((v) => [v.id, v.vessel_name]));
        }

        await this.loadTrips();
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
