const TripDetailPage = {
    STATUS_LABELS: {
        draft: 'Utkast',
        published: 'Publicerad',
        active: 'Aktiv',
        completed: 'Avslutad',
        cancelled: 'Inställd'
    },

    state: { tripId: null, data: null, map: null },

    async render(container, params) {
        this.state.tripId = params.tripId;
        container.innerHTML = `<div class="page"><div class="loading-state"><span class="spinner"></span> Laddar resa...</div></div>`;
        await this.load(container);
    },

    async load(container) {
        const response = await apiRequest(`/trips/${this.state.tripId}`);

        if (!response.success) {
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta resan.')}</div>
                    <a class="btn btn-secondary" href="#/dashboard">Tillbaka till mina resor</a>
                </div>`;
            return;
        }

        this.state.data = response.data;
        this.renderPage(container);
    },

    renderPage(container) {
        const { trip, vessel, crew, routes } = this.state.data;
        const graceLabel = CONFIG.GRACE_PERIOD_OPTIONS.find((g) => g.seconds === Number(trip.grace_period_seconds))?.label
            || `${Math.round(trip.grace_period_seconds / 3600)} tim`;

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(vessel?.vessel_name || 'Okänt fartyg')}
                            <span class="badge badge-${trip.status}">${this.STATUS_LABELS[trip.status] || trip.status}</span>
                        </h1>
                        <div class="page-header__meta">
                            Avgång ${formatDateTime(trip.departure_scheduled)} · Ankomst ${formatDateTime(trip.arrival_scheduled)}
                            · Marginal ${graceLabel}
                            ${trip.ice_notified ? ' · <strong>ICE-kontakt notifierad</strong>' : ''}
                        </div>
                    </div>
                    <a class="btn btn-ghost btn-sm" href="#/dashboard">← Tillbaka</a>
                </div>

                <div id="trip-detail-alert"></div>

                <div class="card" id="actions-card"></div>

                <div class="card">
                    <h3>Fartyg</h3>
                    <p class="mb-0">
                        ${escapeHtml(vessel?.vessel_name || '–')}
                        ${vessel?.mmsi ? ` · MMSI ${escapeHtml(vessel.mmsi)}` : ''}
                        ${vessel?.call_sign ? ` · Anropssignal ${escapeHtml(vessel.call_sign)}` : ''}
                    </p>
                </div>

                <div class="card">
                    <h3>Rutter</h3>
                    <div id="routes-list"></div>
                    <div id="trip-route-map" class="map-container"></div>
                </div>

                <div class="card">
                    <h3>Besättning</h3>
                    <div id="crew-list-container"></div>
                    <hr class="section-divider">
                    <h3>Bjud in besättningsmedlem</h3>
                    <div id="invite-alert"></div>
                    <div class="field-row">
                        <div class="field">
                            <label for="invite-email">E-post</label>
                            <input type="email" id="invite-email">
                        </div>
                        <div class="field">
                            <label for="invite-name">Namn (valfritt)</label>
                            <input type="text" id="invite-name">
                        </div>
                    </div>
                    <button class="btn btn-secondary" type="button" id="invite-crew-btn">Skicka inbjudan</button>
                </div>
            </div>`;

        this.renderActions(trip);
        this.renderRoutes(routes);
        this.renderCrew(crew);

        document.getElementById('invite-crew-btn').addEventListener('click', () => this.handleInviteCrew());
    },

    renderActions(trip) {
        const actionsCard = document.getElementById('actions-card');

        if (trip.status === 'draft' || trip.status === 'published') {
            actionsCard.innerHTML = `
                <h3>Åtgärder</h3>
                <p class="text-muted">Resan är inte aktiv än. Aktivera den manuellt, eller så aktiveras den automatiskt när första besättningsmedlemmen accepterar sin inbjudan.</p>
                <button class="btn btn-primary" type="button" id="activate-btn">Aktivera resa</button>`;
            document.getElementById('activate-btn').addEventListener('click', () => this.handleActivate());
            return;
        }

        if (trip.status === 'active') {
            actionsCard.innerHTML = `
                <h3>Åtgärder</h3>
                <div class="stack">
                    <div>
                        <label style="font-size: var(--font-size-sm); font-weight:600; color: var(--color-text-muted);">Snooza ankomsttid</label>
                        <div class="btn-group" style="margin-top: var(--space-2);">
                            ${CONFIG.SNOOZE_PRESETS.map((m) => `<button class="btn btn-secondary btn-sm snooze-btn" data-minutes="${m}" type="button">+${m} min</button>`).join('')}
                        </div>
                    </div>
                    <button class="btn btn-primary" type="button" id="verify-btn">✓ Verifiera ankomst</button>
                </div>`;

            actionsCard.querySelectorAll('.snooze-btn').forEach((btn) => {
                btn.addEventListener('click', () => this.handleSnooze(Number(btn.dataset.minutes)));
            });
            document.getElementById('verify-btn').addEventListener('click', () => this.handleVerify());
            return;
        }

        actionsCard.innerHTML = `<h3>Åtgärder</h3><p class="text-muted mb-0">Resan är ${this.STATUS_LABELS[trip.status]?.toLowerCase() || trip.status} - inga fler åtgärder tillgängliga.</p>`;
    },

    renderRoutes(routes) {
        const list = document.getElementById('routes-list');

        if (!routes || routes.length === 0) {
            list.innerHTML = `<p class="text-muted">Inga rutter tillagda.</p>`;
        } else {
            list.innerHTML = routes.map((r) => `
                <div class="route-item">
                    <div class="route-item__title">${r.route_order === 1 ? 'Huvudrutt' : `Alternativ rutt ${r.route_order}`}</div>
                    ${r.reason ? `<div class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(r.reason)}</div>` : ''}
                </div>
            `).join('');
        }

        const mapEl = document.getElementById('trip-route-map');
        const colors = ['#1e88a8', '#a06600', '#b3261e', '#1a7f4e'];
        const mapRoutes = (routes || [])
            .map((r, i) => ({ coordinates: parseWktLineString(r.geometry_wkt), color: colors[i % colors.length], label: r.reason || `Rutt ${r.route_order}` }))
            .filter((r) => r.coordinates.length > 1);

        if (mapRoutes.length > 0) {
            this.state.map = renderRouteMap(mapEl, mapRoutes);
        } else {
            mapEl.innerHTML = '<div class="empty-state">Ingen rutt att visa</div>';
        }
    },

    renderCrew(crew) {
        const container = document.getElementById('crew-list-container');

        if (!crew || crew.length === 0) {
            container.innerHTML = `<p class="text-muted">Ingen besättning inbjuden än.</p>`;
            return;
        }

        container.innerHTML = `<div class="crew-list">${crew.map((c) => {
            const accepted = !!c.accepted_at;
            return `
                <div class="crew-row">
                    <div class="crew-row__info">
                        <span class="crew-row__name">${escapeHtml(c.name || c.email || 'Okänd')}</span>
                        <span class="crew-row__detail">
                            ${c.email ? escapeHtml(c.email) : ''}${c.phone ? ` · ${escapeHtml(c.phone)}` : ''}
                            ${c.ice_contact ? ` · ICE: ${escapeHtml(c.ice_contact)}` : ''}
                        </span>
                    </div>
                    <div class="stack" style="flex-direction: row; align-items: center; gap: var(--space-3);">
                        <span class="crew-status ${accepted ? 'crew-status--accepted' : 'crew-status--pending'}">
                            ${accepted ? '✓ Accepterad' : '⏳ Väntar'}
                        </span>
                        ${!accepted && c.invitation_token ? `<button class="btn btn-ghost btn-sm copy-link-btn" data-token="${escapeHtml(c.invitation_token)}" type="button">Kopiera länk</button>` : ''}
                        <button class="btn btn-danger btn-sm remove-crew-btn" data-crew-id="${c.id}" type="button">Ta bort</button>
                    </div>
                </div>`;
        }).join('')}</div>`;

        container.querySelectorAll('.copy-link-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.copyInviteLink(btn.dataset.token));
        });
        container.querySelectorAll('.remove-crew-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.handleRemoveCrew(btn.dataset.crewId));
        });
    },

    buildInviteLink(token) {
        return `${location.origin}${location.pathname}#/crew-join?token=${token}`;
    },

    async copyInviteLink(token) {
        const link = this.buildInviteLink(token);
        try {
            await navigator.clipboard.writeText(link);
            showToast('Länk kopierad', 'success');
        } catch (err) {
            showToast(link, 'info');
        }
    },

    async handleActivate() {
        const response = await apiRequest(`/trips/${this.state.tripId}/activate`, { method: 'POST' });
        if (!response.success) {
            document.getElementById('trip-detail-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.error)}</div>`;
            return;
        }
        showToast('Resan är aktiverad', 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleSnooze(minutes) {
        const response = await apiRequest(`/trips/${this.state.tripId}/snooze`, {
            method: 'POST',
            body: JSON.stringify({ snooze_minutes: minutes })
        });
        if (!response.success) {
            document.getElementById('trip-detail-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.error)}</div>`;
            return;
        }
        showToast(`Ankomsttid framflyttad ${minutes} min`, 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleVerify() {
        if (!confirm('Bekräfta att fartyget har anlänt säkert?')) return;

        const response = await apiRequest(`/trips/${this.state.tripId}/verify`, { method: 'POST' });
        if (!response.success) {
            document.getElementById('trip-detail-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.error)}</div>`;
            return;
        }
        showToast('Ankomst verifierad - resan är avslutad', 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleInviteCrew() {
        const alertBox = document.getElementById('invite-alert');
        const email = document.getElementById('invite-email').value.trim();
        const name = document.getElementById('invite-name').value.trim();

        const emailError = Validate.email(email);
        if (emailError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(emailError)}</div>`;
            return;
        }

        const response = await apiRequest(`/trips/${this.state.tripId}/crew`, {
            method: 'POST',
            body: JSON.stringify({ email, name: name || undefined })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte skicka inbjudan.')}</div>`;
            return;
        }

        const link = response.data.invitation_link || this.buildInviteLink(response.data.invitation_token);
        alertBox.innerHTML = `
            <div class="alert alert-success">
                Inbjudan skapad. E-postutskick är inte inkopplat än - dela länken manuellt:<br>
                <code style="word-break: break-all;">${escapeHtml(link)}</code>
            </div>`;
        document.getElementById('invite-email').value = '';
        document.getElementById('invite-name').value = '';

        await this.load(document.getElementById('page-content'));
    },

    async handleRemoveCrew(crewId) {
        if (!confirm('Ta bort denna besättningsmedlem från resan?')) return;

        const response = await apiRequest(`/crew/${crewId}`, { method: 'DELETE' });
        if (!response.success) {
            showToast(response.error || 'Kunde inte ta bort besättningsmedlemmen', 'error');
            return;
        }
        showToast('Besättningsmedlem borttagen', 'success');
        await this.load(document.getElementById('page-content'));
    }
};
