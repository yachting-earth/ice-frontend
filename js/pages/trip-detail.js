const TripDetailPage = {
    STATUS_LABELS: {
        draft: 'Utkast',
        published: 'Publicerad',
        active: 'Aktiv',
        completed: 'Avslutad',
        cancelled: 'Inställd'
    },

    ROUTE_COLORS: ['#1e88a8', '#a06600', '#b3261e', '#1a7f4e'],

    state: {
        tripId: null, data: null, vessels: [], map: null, forceDelete: false,
        editDrawMaps: {}, editRoutes: {},
        newRouteMode: 'windy', newRouteCoordinates: [], newRouteDrawMap: null
    },

    async render(container, params) {
        this.state.tripId = params.tripId;
        container.innerHTML = `<div class="page"><div class="loading-state"><span class="spinner"></span> Laddar resa...</div></div>`;
        await this.load(container);
    },

    async load(container) {
        const [response, vesselsResponse] = await Promise.all([
            apiRequest(`/trips/${this.state.tripId}`),
            apiRequest('/vessels')
        ]);

        if (!response.success) {
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta resan.')}</div>
                    <a class="btn btn-secondary" href="#/dashboard">Tillbaka till mina resor</a>
                </div>`;
            return;
        }

        this.state.data = response.data;
        this.state.vessels = vesselsResponse.data || [];
        this.renderPage(container);
    },

    renderPage(container) {
        if (this.state.newRouteDrawMap) this.state.newRouteDrawMap.destroy();
        Object.values(this.state.editDrawMaps).forEach((m) => m.destroy());
        this.state.editDrawMaps = {};
        this.state.editRoutes = {};
        this.state.newRouteMode = 'windy';
        this.state.newRouteCoordinates = [];
        this.state.newRouteDrawMap = null;

        const { trip, vessel, crew, routes } = this.state.data;
        const graceLabel = CONFIG.GRACE_PERIOD_OPTIONS.find((g) => g.seconds === Number(trip.grace_period_seconds))?.label
            || `${Math.round(trip.grace_period_seconds / 3600)} tim`;

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(vessel?.vessel_name || 'Okänd båt')}
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
                    <h3>Båt</h3>
                    <div style="display:flex; align-items:center; gap: var(--space-3);">
                        <img id="vessel-photo" alt=""
                            style="width:64px;height:64px;border-radius:var(--radius-md);object-fit:cover;background:var(--color-bg);" hidden>
                        <p class="mb-0">
                            ${escapeHtml(vessel?.vessel_name || '–')}
                            ${vessel?.model ? ` · ${escapeHtml(vessel.model)}` : ''}
                            ${vessel?.year_built ? ` · Årsmodell ${escapeHtml(String(vessel.year_built))}` : ''}
                            ${vessel?.mmsi ? ` · MMSI ${escapeHtml(vessel.mmsi)}` : ''}
                            ${vessel?.call_sign ? ` · Anropssignal ${escapeHtml(vessel.call_sign)}` : ''}
                            ${this.formatDimensions(vessel) ? ` · ${escapeHtml(this.formatDimensions(vessel))}` : ''}
                        </p>
                    </div>
                    ${vessel?.notes ? `<p class="mb-0" style="margin-top: var(--space-2); color: var(--color-text-muted); white-space: pre-wrap;">${escapeHtml(vessel.notes)}</p>` : ''}
                    <div id="vessel-change-alert"></div>
                    ${this.state.vessels.length > 1 ? `
                    <div class="field-row" style="margin-top: var(--space-3);">
                        <div class="field">
                            <label for="vessel-select">Byt båt</label>
                            <select id="vessel-select">
                                ${this.state.vessels.map((v) => `<option value="${v.id}" ${String(v.id) === String(trip.vessel_id) ? 'selected' : ''}>${escapeHtml(v.vessel_name)}</option>`).join('')}
                            </select>
                        </div>
                        <button class="btn btn-secondary btn-sm" type="button" id="vessel-change-btn" style="align-self:flex-end;">Byt båt</button>
                    </div>` : ''}
                </div>

                <div class="card">
                    <h3>Rutter</h3>
                    <div id="routes-alert"></div>
                    <div id="routes-list"></div>
                    <div id="trip-route-map" class="map-container"></div>
                    <hr class="section-divider">
                    <h3>Lägg till alternativ rutt</h3>
                    <div class="route-mode-toggle btn-group">
                        <button type="button" class="btn btn-sm" id="new-route-mode-windy">Importera från Windy</button>
                        <button type="button" class="btn btn-sm" id="new-route-mode-manual">Rita manuellt</button>
                    </div>
                    <div id="new-route-body"></div>
                    <div class="field">
                        <label for="new-route-reason">Anledning (valfritt)</label>
                        <input type="text" id="new-route-reason" placeholder="t.ex. Om vinden vrider nordlig">
                    </div>
                    <button class="btn btn-secondary btn-sm" type="button" id="add-route-btn">+ Lägg till rutt</button>
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
        if (vessel?.photo_path) {
            this.loadVesselPhoto(vessel.id);
        }

        document.getElementById('invite-crew-btn').addEventListener('click', () => this.handleInviteCrew());
        document.getElementById('add-route-btn').addEventListener('click', () => this.handleAddRoute());
        document.getElementById('vessel-change-btn')?.addEventListener('click', () => this.handleChangeVessel());

        document.getElementById('new-route-mode-windy').addEventListener('click', () => {
            this.state.newRouteMode = 'windy';
            this.renderNewRouteBody();
        });
        document.getElementById('new-route-mode-manual').addEventListener('click', () => {
            this.state.newRouteMode = 'manual';
            this.renderNewRouteBody();
        });
        this.renderNewRouteBody();
    },

    renderNewRouteBody() {
        const container = document.getElementById('new-route-body');
        if (!container) return;

        document.getElementById('new-route-mode-windy').classList.toggle('btn-primary', this.state.newRouteMode !== 'manual');
        document.getElementById('new-route-mode-windy').classList.toggle('btn-ghost', this.state.newRouteMode === 'manual');
        document.getElementById('new-route-mode-manual').classList.toggle('btn-primary', this.state.newRouteMode === 'manual');
        document.getElementById('new-route-mode-manual').classList.toggle('btn-ghost', this.state.newRouteMode !== 'manual');

        if (this.state.newRouteDrawMap) {
            this.state.newRouteDrawMap.destroy();
            this.state.newRouteDrawMap = null;
        }

        if (this.state.newRouteMode === 'manual') {
            container.innerHTML = `
                <div class="field">
                    <label>Rita rutt på kartan</label>
                    <small class="text-muted">Klicka på kartan för att lägga till punkter. Dra en punkt för att flytta den, klicka på en punkt och välj "Ta bort punkt" för att radera den.</small>
                    <div id="new-route-draw-map" class="map-container route-draw-map"></div>
                    <div class="route-draw-footer">
                        <span class="text-muted" style="font-size: var(--font-size-sm);"><span id="new-route-draw-count">${this.state.newRouteCoordinates.length}</span> punkter</span>
                        <button class="btn btn-ghost btn-sm" type="button" id="new-route-clear">Rensa rutt</button>
                    </div>
                </div>`;

            this.state.newRouteDrawMap = renderRouteDrawMap(document.getElementById('new-route-draw-map'), {
                initialCoordinates: this.state.newRouteCoordinates,
                onChange: (coords) => {
                    this.state.newRouteCoordinates = coords;
                    document.getElementById('new-route-draw-count').textContent = coords.length;
                }
            });

            document.getElementById('new-route-clear').addEventListener('click', () => {
                this.state.newRouteCoordinates = [];
                this.state.newRouteDrawMap?.clear();
                document.getElementById('new-route-draw-count').textContent = '0';
            });
        } else {
            container.innerHTML = `
                <div class="field">
                    <label for="new-route-windy-url">Windy-länk</label>
                    <input type="url" id="new-route-windy-url" placeholder="https://www.windy.com/route-planner/boat/...">
                </div>`;
        }
    },

    async handleChangeVessel() {
        const alertBox = document.getElementById('vessel-change-alert');
        const vesselId = document.getElementById('vessel-select').value;

        if (String(vesselId) === String(this.state.data.trip.vessel_id)) {
            return;
        }

        const btn = document.getElementById('vessel-change-btn');
        btn.disabled = true;

        const response = await apiRequest(`/trips/${this.state.tripId}`, {
            method: 'PUT',
            body: JSON.stringify({ vessel_id: vesselId })
        });

        btn.disabled = false;

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte byta båt.')}</div>`;
            return;
        }

        if (response.data.schedule_notice?.conflicting_trip_exists) {
            showToast('Obs: en annan resa med samma MMSI-nummer är redan schemalagd under en överlappande tidsperiod.', 'info');
        }

        showToast('Båten har bytts.', 'success');
        await this.load(document.getElementById('page-content'));
    },

    formatDimensions(vessel) {
        return [
            vessel?.length_m ? `L ${Number(vessel.length_m)} m` : '',
            vessel?.width_m ? `B ${Number(vessel.width_m)} m` : '',
            vessel?.draft_m ? `D ${Number(vessel.draft_m)} m` : ''
        ].filter(Boolean).join(' × ');
    },

    // Photos are auth-protected, so a plain <img src> won't do (no way to
    // attach the Authorization header) - fetch as blob and swap in
    async loadVesselPhoto(vesselId) {
        const img = document.getElementById('vessel-photo');
        if (!img) return;
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/vessels/${vesselId}/photo`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) return;
            img.src = URL.createObjectURL(await response.blob());
            img.hidden = false;
        } catch (err) { /* leave the photo hidden */ }
    },

    renderActions(trip) {
        const actionsCard = document.getElementById('actions-card');
        this.state.forceDelete = false;
        const deleteBtnLabel = 'Radera resa';
        const deleteBtnHtml = `<button class="btn btn-danger" type="button" id="delete-trip-btn">${deleteBtnLabel}</button>`;

        if (trip.status === 'draft' || trip.status === 'published') {
            actionsCard.innerHTML = `
                <h3>Åtgärder</h3>
                <p class="text-muted">Resan är inte aktiv än. Aktivera den manuellt, eller så aktiveras den automatiskt när första besättningsmedlemmen accepterar sin inbjudan.</p>
                <div id="delete-trip-alert"></div>
                <div class="btn-group">
                    <button class="btn btn-primary" type="button" id="activate-btn">Aktivera resa</button>
                    ${deleteBtnHtml}
                </div>`;
            document.getElementById('activate-btn').addEventListener('click', () => this.handleActivate());
            document.getElementById('delete-trip-btn').addEventListener('click', () => this.handleDeleteTrip());
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
                    <div id="delete-trip-alert"></div>
                    ${deleteBtnHtml}
                </div>`;

            actionsCard.querySelectorAll('.snooze-btn').forEach((btn) => {
                btn.addEventListener('click', () => this.handleSnooze(Number(btn.dataset.minutes)));
            });
            document.getElementById('verify-btn').addEventListener('click', () => this.handleVerify());
            document.getElementById('delete-trip-btn').addEventListener('click', () => this.handleDeleteTrip());
            return;
        }

        actionsCard.innerHTML = `
            <h3>Åtgärder</h3>
            <p class="text-muted">Resan är ${this.STATUS_LABELS[trip.status]?.toLowerCase() || trip.status} - inga fler åtgärder tillgängliga.</p>
            <div id="delete-trip-alert"></div>
            ${deleteBtnHtml}`;
        document.getElementById('delete-trip-btn').addEventListener('click', () => this.handleDeleteTrip());
    },

    renderRoutes(routes) {
        const list = document.getElementById('routes-list');
        routes = routes || [];

        if (routes.length === 0) {
            list.innerHTML = `<p class="text-muted">Inga rutter tillagda.</p>`;
        } else {
            list.innerHTML = routes.map((r, i) => `
                <div class="route-item" data-route-id="${r.id}">
                    <div class="route-item__title">
                        <span class="route-color-dot" style="background:${this.ROUTE_COLORS[i % this.ROUTE_COLORS.length]};"></span>
                        ${i === 0 ? 'Huvudrutt' : `Alternativ rutt ${i}`}
                        <div class="btn-group" style="margin-left:auto;">
                            <button class="btn btn-ghost btn-sm move-route-up" type="button" data-id="${r.id}" ${i === 0 ? 'disabled' : ''} title="Flytta upp">↑</button>
                            <button class="btn btn-ghost btn-sm move-route-down" type="button" data-id="${r.id}" ${i === routes.length - 1 ? 'disabled' : ''} title="Flytta ner">↓</button>
                            <button class="btn btn-ghost btn-sm edit-route-btn" type="button" data-id="${r.id}">Redigera</button>
                            <button class="btn btn-danger btn-sm delete-route-btn" type="button" data-id="${r.id}">Ta bort</button>
                        </div>
                    </div>
                    <div class="route-item__view" data-id="${r.id}">
                        ${r.reason ? `<div class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(r.reason)}</div>` : ''}
                    </div>
                    <div class="route-item__edit" data-id="${r.id}" hidden>
                        <div class="route-mode-toggle btn-group">
                            <button type="button" class="btn btn-sm edit-mode-windy" data-id="${r.id}">Importera från Windy</button>
                            <button type="button" class="btn btn-sm edit-mode-manual" data-id="${r.id}">Rita manuellt</button>
                        </div>
                        <div class="route-edit-body" data-id="${r.id}"></div>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-sm save-route-btn" type="button" data-id="${r.id}">Spara</button>
                            <button class="btn btn-ghost btn-sm cancel-route-edit-btn" type="button" data-id="${r.id}">Avbryt</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        list.querySelectorAll('.move-route-up').forEach((btn) => {
            btn.addEventListener('click', () => this.handleMoveRoute(btn.dataset.id, -1));
        });
        list.querySelectorAll('.move-route-down').forEach((btn) => {
            btn.addEventListener('click', () => this.handleMoveRoute(btn.dataset.id, 1));
        });
        list.querySelectorAll('.delete-route-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.handleDeleteRoute(btn.dataset.id));
        });
        list.querySelectorAll('.edit-route-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                list.querySelector(`.route-item__view[data-id="${btn.dataset.id}"]`).hidden = true;
                list.querySelector(`.route-item__edit[data-id="${btn.dataset.id}"]`).hidden = false;
                this.initRouteEditMode(btn.dataset.id, routes);
            });
        });
        list.querySelectorAll('.edit-mode-windy').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.state.editRoutes[btn.dataset.id].mode = 'windy';
                this.renderRouteEditBody(btn.dataset.id);
            });
        });
        list.querySelectorAll('.edit-mode-manual').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.state.editRoutes[btn.dataset.id].mode = 'manual';
                this.renderRouteEditBody(btn.dataset.id);
            });
        });
        list.querySelectorAll('.cancel-route-edit-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                list.querySelector(`.route-item__view[data-id="${btn.dataset.id}"]`).hidden = false;
                list.querySelector(`.route-item__edit[data-id="${btn.dataset.id}"]`).hidden = true;
            });
        });
        list.querySelectorAll('.save-route-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.handleSaveRoute(btn.dataset.id));
        });

        const mapEl = document.getElementById('trip-route-map');
        const mapRoutes = routes
            .map((r, i) => ({ coordinates: parseWktLineString(r.geometry_wkt), color: this.ROUTE_COLORS[i % this.ROUTE_COLORS.length], label: r.reason || (i === 0 ? 'Huvudrutt' : `Alternativ rutt ${i}`) }))
            .filter((r) => r.coordinates.length > 1);

        if (mapRoutes.length > 0) {
            this.state.map = renderRouteMap(mapEl, mapRoutes);
        } else {
            mapEl.innerHTML = '<div class="empty-state">Ingen rutt att visa</div>';
        }
    },

    initRouteEditMode(routeId, routes) {
        if (!this.state.editRoutes[routeId]) {
            const route = (routes || []).find((r) => r.id === routeId);
            this.state.editRoutes[routeId] = {
                mode: route?.raw_windy_url ? 'windy' : 'manual',
                windyUrl: route?.raw_windy_url || '',
                reason: route?.reason || '',
                coordinates: parseWktLineString(route?.geometry_wkt)
            };
        }
        this.renderRouteEditBody(routeId);
    },

    renderRouteEditBody(routeId) {
        const editState = this.state.editRoutes[routeId];
        const body = document.querySelector(`.route-edit-body[data-id="${routeId}"]`);
        if (!body || !editState) return;

        document.querySelector(`.edit-mode-windy[data-id="${routeId}"]`)?.classList.toggle('btn-primary', editState.mode !== 'manual');
        document.querySelector(`.edit-mode-windy[data-id="${routeId}"]`)?.classList.toggle('btn-ghost', editState.mode === 'manual');
        document.querySelector(`.edit-mode-manual[data-id="${routeId}"]`)?.classList.toggle('btn-primary', editState.mode === 'manual');
        document.querySelector(`.edit-mode-manual[data-id="${routeId}"]`)?.classList.toggle('btn-ghost', editState.mode !== 'manual');

        if (this.state.editDrawMaps[routeId]) {
            this.state.editDrawMaps[routeId].destroy();
            delete this.state.editDrawMaps[routeId];
        }

        if (editState.mode === 'manual') {
            body.innerHTML = `
                <div class="field">
                    <label>Rita rutt på kartan</label>
                    <small class="text-muted">Klicka på kartan för att lägga till punkter. Dra en punkt för att flytta den, klicka på en punkt och välj "Ta bort punkt" för att radera den.</small>
                    <div id="edit-route-draw-map-${routeId}" class="map-container route-draw-map"></div>
                    <div class="route-draw-footer">
                        <span class="text-muted" style="font-size: var(--font-size-sm);"><span id="edit-route-draw-count-${routeId}">${editState.coordinates.length}</span> punkter</span>
                        <button class="btn btn-ghost btn-sm" type="button" id="edit-route-clear-${routeId}">Rensa rutt</button>
                    </div>
                </div>
                <div class="field">
                    <label>Anledning</label>
                    <input type="text" class="edit-route-reason" data-id="${routeId}" value="${escapeHtml(editState.reason || '')}">
                </div>`;

            this.state.editDrawMaps[routeId] = renderRouteDrawMap(document.getElementById(`edit-route-draw-map-${routeId}`), {
                initialCoordinates: editState.coordinates,
                onChange: (coords) => {
                    editState.coordinates = coords;
                    document.getElementById(`edit-route-draw-count-${routeId}`).textContent = coords.length;
                }
            });

            document.getElementById(`edit-route-clear-${routeId}`).addEventListener('click', () => {
                editState.coordinates = [];
                this.state.editDrawMaps[routeId]?.clear();
                document.getElementById(`edit-route-draw-count-${routeId}`).textContent = '0';
            });
        } else {
            body.innerHTML = `
                <div class="field">
                    <label>Windy-länk</label>
                    <input type="url" class="edit-route-windy-url" data-id="${routeId}" value="${escapeHtml(editState.windyUrl || '')}">
                </div>
                <div class="field">
                    <label>Anledning</label>
                    <input type="text" class="edit-route-reason" data-id="${routeId}" value="${escapeHtml(editState.reason || '')}">
                </div>`;

            document.querySelector(`.edit-route-windy-url[data-id="${routeId}"]`)
                .addEventListener('input', (e) => { editState.windyUrl = e.target.value; });
        }

        document.querySelector(`.edit-route-reason[data-id="${routeId}"]`)
            ?.addEventListener('input', (e) => { editState.reason = e.target.value; });
    },

    async handleAddRoute() {
        const alertBox = document.getElementById('routes-alert');
        const reason = document.getElementById('new-route-reason').value.trim();

        let body;
        if (this.state.newRouteMode === 'manual') {
            if (this.state.newRouteCoordinates.length < 2) {
                alertBox.innerHTML = `<div class="alert alert-error">Rita minst två punkter för rutten.</div>`;
                return;
            }
            body = { coordinates: this.state.newRouteCoordinates, reason: reason || null };
        } else {
            const windyUrl = document.getElementById('new-route-windy-url').value.trim();
            const urlError = Validate.windyUrl(windyUrl);
            if (urlError) {
                alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(urlError)}</div>`;
                return;
            }
            body = { windy_url: windyUrl, reason: reason || null };
        }

        const response = await apiRequest(`/trips/${this.state.tripId}/routes`, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte lägga till rutten.')}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast('Rutt tillagd', 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleSaveRoute(routeId) {
        const alertBox = document.getElementById('routes-alert');
        const editState = this.state.editRoutes[routeId];
        const reason = (document.querySelector(`.edit-route-reason[data-id="${routeId}"]`)?.value ?? editState.reason ?? '').trim();

        let body;
        if (editState.mode === 'manual') {
            if (editState.coordinates.length < 2) {
                alertBox.innerHTML = `<div class="alert alert-error">Rita minst två punkter för rutten.</div>`;
                return;
            }
            body = { coordinates: editState.coordinates, reason: reason || null };
        } else {
            const windyUrl = document.querySelector(`.edit-route-windy-url[data-id="${routeId}"]`).value.trim();
            const urlError = Validate.windyUrl(windyUrl);
            if (urlError) {
                alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(urlError)}</div>`;
                return;
            }
            body = { windy_url: windyUrl, reason: reason || null };
        }

        const response = await apiRequest(`/routes/${routeId}`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte spara rutten.')}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast('Rutten har sparats', 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleDeleteRoute(routeId) {
        if (!confirm('Ta bort den här rutten?')) return;

        const response = await apiRequest(`/routes/${routeId}`, { method: 'DELETE' });
        if (!response.success) {
            document.getElementById('routes-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte ta bort rutten.')}</div>`;
            return;
        }

        showToast('Rutten har tagits bort', 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleMoveRoute(routeId, direction) {
        const routes = this.state.data.routes || [];
        const ids = routes.map((r) => r.id);
        const index = ids.indexOf(routeId);
        const targetIndex = index + direction;

        if (index === -1 || targetIndex < 0 || targetIndex >= ids.length) return;

        [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];

        const response = await apiRequest(`/trips/${this.state.tripId}/routes/reorder`, {
            method: 'PUT',
            body: JSON.stringify({ route_ids: ids })
        });

        if (!response.success) {
            document.getElementById('routes-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte ändra ordning.')}</div>`;
            return;
        }

        await this.load(document.getElementById('page-content'));
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
                    <img class="crew-photo" data-crew-id="${c.id}" alt=""
                        style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:var(--space-3);background:var(--color-bg);" hidden>
                    <div class="crew-row__info">
                        <span class="crew-row__name">${escapeHtml(c.name || c.email || 'Okänd')}</span>
                        <span class="crew-row__detail">
                            ${c.email ? escapeHtml(c.email) : ''}${c.phone ? ` · ${escapeHtml(c.phone)}` : ''}
                            ${c.ice_contact ? ` · ICE: ${escapeHtml(c.ice_contact)}` : ''}
                        </span>
                        <label class="text-muted" style="font-size: var(--font-size-sm); display:block; margin-top: var(--space-1);">
                            <input type="file" class="crew-photo-input" data-crew-id="${c.id}" accept="image/jpeg,image/png" style="max-width: 220px;">
                        </label>
                    </div>
                    <div class="stack" style="flex-direction: row; align-items: center; gap: var(--space-3);">
                        <span class="crew-status ${accepted ? 'crew-status--accepted' : 'crew-status--pending'}">
                            ${accepted ? '✓ Accepterad' : '⏳ Väntar'}
                        </span>
                        <button class="btn btn-ghost btn-sm crew-photo-submit" data-crew-id="${c.id}" type="button">${c.photo_path ? 'Byt foto' : 'Lägg till foto'}</button>
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
        container.querySelectorAll('.crew-photo-submit').forEach((btn) => {
            btn.addEventListener('click', () => this.handleCrewPhotoSubmit(btn.dataset.crewId));
        });

        this.loadCrewPhotos(container);
    },

    async handleCrewPhotoSubmit(crewId) {
        const input = document.querySelector(`.crew-photo-input[data-crew-id="${crewId}"]`);
        const photoFile = input.files[0];

        if (!photoFile) {
            showToast('Välj en bild först.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('photo', photoFile);
        const response = await apiUpload(`/crew/${crewId}/photo`, formData, 'PUT');

        if (!response.success) {
            showToast(response.error || 'Kunde inte spara fotot.', 'error');
            return;
        }

        showToast('Fotot har sparats.', 'success');
        await this.load(document.getElementById('page-content'));
    },

    // Photos are auth-protected, so a plain <img src> won't do (no way to
    // attach the Authorization header) - fetch as blob and swap in
    async loadCrewPhotos(container) {
        const token = Auth.getToken();
        container.querySelectorAll('.crew-photo').forEach(async (img) => {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/photos/${img.dataset.crewId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) return;
                img.src = URL.createObjectURL(await response.blob());
                img.hidden = false;
            } catch (err) { /* leave the photo hidden */ }
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
            const message = response.code === 'MMSI_ALREADY_ACTIVE'
                ? 'Resan kan inte aktiveras — ett annat aktivt resa använder redan detta MMSI-nummer.'
                : response.error;
            document.getElementById('trip-detail-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(message)}</div>`;
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

    async handleDeleteTrip() {
        const alertBox = document.getElementById('delete-trip-alert');
        const btn = document.getElementById('delete-trip-btn');

        if (this.state.forceDelete) {
            if (!confirm('Det finns registrerade personer på resan. Radera resan ändå? Kom ihåg att notifiera dem själv.')) return;
        } else if (!confirm('Radera den här resan?')) {
            return;
        }

        btn.disabled = true;
        const response = await apiRequest(`/trips/${this.state.tripId}${this.state.forceDelete ? '?force=true' : ''}`, { method: 'DELETE' });
        btn.disabled = false;

        if (!response.success) {
            if (response.code === 'TRIP_HAS_REGISTERED_PERSONS') {
                this.state.forceDelete = true;
                btn.textContent = 'Radera ändå';
                const crewCount = response.details?.crew_count || 0;
                const iceCount = response.details?.ice_count || 0;
                alertBox.innerHTML = `<div class="alert alert-error">Resan har ${crewCount} besättningsmedlem(mar) och ${iceCount} ICE-kontakt(er) registrerade som kan behöva notifieras. Klicka igen för att radera ändå.</div>`;
                return;
            }
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte radera resan.')}</div>`;
            return;
        }

        showToast('Resan har raderats', 'success');
        location.hash = '#/dashboard';
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
