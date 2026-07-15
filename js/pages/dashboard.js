const DashboardPage = {
    state: {
        statusFilter: null
    },

    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('dashboard.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('dashboard.subtitle'))}</div>
                    </div>
                    <a class="btn btn-primary" href="#/trips/new">${escapeHtml(t('dashboard.newTrip'))}</a>
                </div>
                <div id="email-verify-warning"></div>
                <div id="ice-contact-warning"></div>
                <div class="trip-filters" id="trip-filters"></div>
                <div id="trip-list-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('dashboard.loadingTrips'))}</div></div>
            </div>`;

        this.renderFilters(container);

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
                ${t('dashboard.verifyEmailBanner', { email: escapeHtml(response.data.email || '') })}
                <button class="btn btn-sm btn-secondary" type="button" id="resend-verify-btn"
                        style="margin-left: var(--space-2);">${escapeHtml(t('dashboard.resendLink'))}</button>
            </div>`;

        document.getElementById('resend-verify-btn').addEventListener('click', () => this.resendVerification());
    },

    async resendVerification() {
        const btn = document.getElementById('resend-verify-btn');
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('dashboard.resending'))}`;

        const response = await apiRequest('/auth/resend-verification', { method: 'POST' });

        if (response.success && response.data.already_verified) {
            // Verified elsewhere in the meantime - drop the banner.
            Auth.updateUser({ email_verified: true });
            document.getElementById('email-verify-warning').innerHTML = '';
            showToast(t('dashboard.alreadyVerified'), 'success');
            return;
        }

        if (response.success && response.data.verification_sent) {
            showToast(t('dashboard.verificationResent'), 'success');
        } else {
            showToast(t('dashboard.verificationResendFailed'), 'error');
        }

        btn.disabled = false;
        btn.textContent = t('dashboard.resendLink');
    },

    async checkIceContacts() {
        const response = await apiRequest('/ice-contacts');
        if (!response.success) return;

        const warningBox = document.getElementById('ice-contact-warning');
        if (warningBox && (response.data || []).length === 0) {
            warningBox.innerHTML = `
                <div class="alert alert-warning">
                    ${escapeHtml(t('dashboard.noIceContact'))}
                    <a href="#/ice-contacts">${escapeHtml(t('dashboard.addIceContact'))}</a>
                </div>`;
        }
    },

    renderFilters(container) {
        const filters = [
            { value: null, label: t('trip.status.all') },
            { value: 'draft', label: t('trip.status.draft') },
            { value: 'published', label: t('trip.status.published') },
            { value: 'active', label: t('trip.status.active') },
            { value: 'completed', label: t('trip.status.completed') },
            { value: 'cancelled', label: t('trip.status.cancelled') }
        ];

        const filterBar = container.querySelector('#trip-filters');
        filterBar.innerHTML = filters.map((f) => `
            <button class="btn btn-sm ${this.state.statusFilter === f.value ? 'btn-primary' : 'btn-secondary'}"
                    type="button" data-status="${f.value ?? ''}">${escapeHtml(f.label)}</button>
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
        listContainer.innerHTML = `<div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('dashboard.loadingTrips'))}</div>`;

        const params = new URLSearchParams();
        if (this.state.statusFilter) params.append('status', this.state.statusFilter);

        const response = await apiRequest(`/trips?${params.toString()}`);

        if (!response.success) {
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('dashboard.loadFailed')))}</div>`;
            return;
        }

        const trips = response.data || [];
        if (trips.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>${escapeHtml(t('dashboard.emptyTitle'))}</h3>
                    <p>${escapeHtml(t('dashboard.emptyBody'))}</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = `<div class="trip-list">${trips.map((t) => this.renderTripCard(t)).join('')}</div>`;
    },

    getOverdueState(trip) {
        if (!trip.arrival_scheduled) {
            return null;
        }
        // Normalize arrival_scheduled datetime
        const normalized = trip.arrival_scheduled.includes('T') ? trip.arrival_scheduled : trip.arrival_scheduled.replace(' ', 'T');
        const withZone = /Z|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
        const arrival = new Date(withZone);
        const now = Date.now();

        // If not yet overdue, return null
        if (now <= arrival.getTime()) {
            return null;
        }

        // Overdue but grace period hasn't been checked yet, or grace period still active
        if (!trip.ice_notified) {
            return 'warning'; // orange
        }

        // Overdue and ICE has been notified
        if (trip.grace_period_seconds) {
            const deadlineMs = arrival.getTime() + (trip.grace_period_seconds * 1000);
            if (now > deadlineMs) {
                return 'alert'; // red
            }
        }

        return null;
    },

    renderTripCard(trip) {
        const vesselName = trip.vessel_name || t('dashboard.vesselFallback', { id: trip.vessel_id });
        const graceLabel = formatGracePeriod(trip.grace_period_seconds) !== String(trip.grace_period_seconds)
            ? formatGracePeriod(trip.grace_period_seconds)
            : t('dashboard.graceHours', { hours: Math.round(trip.grace_period_seconds / 3600) });
        const isInvited = trip.viewer_role && trip.viewer_role !== 'owner';
        const overdueState = this.getOverdueState(trip);
        const stateClass = overdueState ? ` trip-card--${overdueState}` : '';

        return `
            <div class="trip-card${isInvited ? ' trip-card--invited' : ''}${stateClass}">
                <div class="stack" style="flex:1; gap: 0.35rem;">
                    <div class="trip-card__top">
                        <span class="trip-card__title">${escapeHtml(vesselName)}</span>
                        <span class="badge badge-${trip.status}">${escapeHtml(t('trip.status.' + trip.status) || trip.status)}</span>
                        ${isInvited ? `<span class="badge badge-role-${trip.viewer_role}">${escapeHtml(t('dashboard.role.' + trip.viewer_role))}</span>` : ''}
                        ${isInvited ? `<span class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(t('dashboard.readOnly'))}</span>` : ''}
                    </div>
                    <div class="trip-card__meta">
                        <span>${escapeHtml(t('dashboard.departure', { datetime: formatDateTime(trip.departure_scheduled) }))}</span>
                        <span>${escapeHtml(t('dashboard.arrival', { datetime: formatDateTime(trip.arrival_scheduled) }))}</span>
                        <span>${escapeHtml(t('dashboard.grace', { label: graceLabel }))}</span>
                        ${trip.ice_notified ? `<span class="text-muted">${escapeHtml(t('dashboard.iceNotified'))}</span>` : ''}
                    </div>
                </div>
                <div class="trip-card__actions">
                    <a class="btn btn-secondary btn-sm" href="#/trips/${trip.id}">${escapeHtml(t('dashboard.view'))}</a>
                </div>
            </div>`;
    }
};
