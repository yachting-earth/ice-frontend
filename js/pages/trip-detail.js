const TripDetailPage = {
    ROUTE_COLORS: ['#1e88a8', '#a06600', '#b3261e', '#1a7f4e'],

    state: {
        tripId: null, data: null, vessels: [], iceContacts: [], savedRoutes: [], map: null, forceDelete: false,
        editDrawMaps: {}, editRoutes: {},
        newRouteMode: 'windy', newRouteCoordinates: [], newRouteDrawMap: null,
        newRouteSaveToArchive: false, newRouteSaveName: ''
    },

    async render(container, params) {
        this.state.tripId = params.tripId;
        container.innerHTML = `<div class="page"><div class="loading-state"><span class="spinner"></span> ${t('tripDetail.loading')}</div></div>`;
        await this.load(container);
    },

    async load(container) {
        const [response, vesselsResponse, iceContactsResponse, savedRoutesResponse] = await Promise.all([
            apiRequest(`/trips/${this.state.tripId}`),
            apiRequest('/vessels'),
            apiRequest('/ice-contacts'),
            apiRequest('/saved-routes')
        ]);

        if (!response.success) {
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.loadFailed')))}</div>
                    <a class="btn btn-secondary" href="#/dashboard">${t('tripDetail.backToDashboard')}</a>
                </div>`;
            return;
        }

        this.state.data = response.data;
        this.state.vessels = vesselsResponse.data || [];
        this.state.iceContacts = iceContactsResponse.data || [];
        this.state.savedRoutes = savedRoutesResponse.data || [];
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

        const { trip, vessel, crew, routes, skipper, audit_log } = this.state.data;
        const role = this.state.data.role || 'owner';
        const isOwner = role === 'owner';
        const graceLabel = formatGracePeriod(trip.grace_period_seconds);

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(vessel?.vessel_name || t('tripDetail.unknownVessel'))}
                            <span class="badge badge-${trip.status}">${t('trip.status.' + trip.status) || trip.status}</span>
                        </h1>
                        <div class="page-header__meta">
                            ${t('tripDetail.header.meta', { departure: formatDateTime(trip.departure_scheduled), arrival: formatDateTime(trip.arrival_scheduled), grace: graceLabel })}
                            ${trip.ice_notified ? ` · <strong>${t('tripDetail.header.iceNotified')}</strong>` : ''}
                        </div>
                    </div>
                    <a class="btn btn-ghost btn-sm" href="#/dashboard">← ${t('common.back')}</a>
                </div>

                ${!isOwner ? `<div class="alert alert-info">${escapeHtml(t('tripDetail.readOnlyBanner.' + role))}</div>` : ''}

                <div id="trip-detail-alert"></div>

                ${isOwner ? `<div class="card" id="actions-card"></div>` : ''}

                ${isOwner ? `<div class="card">
                    <h3>${t('tripDetail.schedule.heading')}</h3>
                    <div id="schedule-alert"></div>
                    <div class="field-row">
                        <div class="field">
                            <label for="departure-input">${t('tripDetail.schedule.departureLabel')}</label>
                            ${this.canEditDeparture(trip) ? `<input type="datetime-local" id="departure-input" value="${toInputDatetime(trip.departure_scheduled)}">` : `<p class="mb-0">${escapeHtml(formatDateTime(trip.departure_scheduled))}</p>`}
                        </div>
                        <div class="field">
                            <label for="arrival-input">${t('tripDetail.schedule.arrivalLabel')}</label>
                            ${this.canEditArrival(trip) ? `<input type="datetime-local" id="arrival-input" value="${toInputDatetime(trip.arrival_scheduled)}">` : `<p class="mb-0">${escapeHtml(formatDateTime(trip.arrival_scheduled))}</p>`}
                        </div>
                        <div class="field">
                            <label for="grace-input">${t('tripDetail.schedule.graceLabel')}</label>
                            ${this.canEditGrace(trip) ? `<select id="grace-input">
                                ${CONFIG.GRACE_PERIOD_OPTIONS.map((g) => `<option value="${g.seconds}" ${g.seconds === Number(trip.grace_period_seconds) ? 'selected' : ''}>${escapeHtml(formatGracePeriod(g.seconds))}</option>`).join('')}
                            </select>` : `<p class="mb-0">${escapeHtml(graceLabel)}</p>`}
                        </div>
                    </div>
                    ${this.canEditDeparture(trip) || this.canEditArrival(trip) || this.canEditGrace(trip) ? `<button class="btn btn-secondary btn-sm" type="button" id="schedule-change-btn">${t('tripDetail.schedule.changeButton')}</button>` : ''}
                    ${!this.canEditDeparture(trip) ? `<p class="text-muted" style="margin-top: var(--space-2);">${t('tripDetail.schedule.departureLockedHint')}</p>` : ''}
                    ${!this.canEditArrival(trip) ? `<p class="text-muted" style="margin-top: var(--space-2);">${t('tripDetail.schedule.arrivalLockedHint')}</p>` : ''}
                    ${!this.canEditGrace(trip) ? `<p class="text-muted" style="margin-top: var(--space-2);">${t('tripDetail.schedule.graceLockedHint')}</p>` : ''}
                </div>` : ''}

                ${!isOwner ? `<div class="card">
                    <h3>${t('tripDetail.skipper.heading')}</h3>
                    <div style="display:flex; align-items:center; gap: var(--space-3);">
                        <img id="skipper-photo" class="lightbox-trigger" alt="${escapeHtml(skipper?.name || '')}"
                            style="width:48px;height:48px;border-radius:50%;object-fit:cover;background:var(--color-bg);" hidden>
                        <p class="mb-0">
                            <strong>${t('common.name')}:</strong> ${escapeHtml(skipper?.name || '–')}
                            ${skipper?.phone ? ` · <strong>${t('common.phone')}:</strong> ${escapeHtml(skipper.phone)}` : ''}
                            ${skipper?.email ? ` · <strong>${t('common.email')}:</strong> ${escapeHtml(skipper.email)}` : ''}
                        </p>
                    </div>
                </div>` : ''}

                <div class="card">
                    <h3>${t('tripDetail.vessel.heading')}</h3>
                    <div style="display:flex; align-items:center; gap: var(--space-3);">
                        <img id="vessel-photo" class="lightbox-trigger" alt="${escapeHtml(vessel?.vessel_name || '')}"
                            style="width:64px;height:64px;border-radius:var(--radius-md);object-fit:cover;background:var(--color-bg);" hidden>
                        <p class="mb-0">
                            ${escapeHtml(vessel?.vessel_name || '–')}
                            ${vessel?.model ? ` · ${t('tripDetail.vessel.modelLabel', { model: escapeHtml(vessel.model) })}` : ''}
                            ${vessel?.year_built ? ` · ${t('tripDetail.vessel.yearBuilt', { year: escapeHtml(String(vessel.year_built)) })}` : ''}
                            ${vessel?.mmsi ? ` · ${t('tripDetail.vessel.mmsi', { mmsi: escapeHtml(vessel.mmsi) })}` : ''}
                            ${vessel?.call_sign ? ` · ${t('tripDetail.vessel.callSign', { callSign: escapeHtml(vessel.call_sign) })}` : ''}
                            ${this.formatDimensions(vessel) ? ` · ${escapeHtml(this.formatDimensions(vessel))}` : ''}
                        </p>
                    </div>
                    ${vessel?.notes ? `<p class="mb-0" style="margin-top: var(--space-2); color: var(--color-text-muted); white-space: pre-wrap;">${escapeHtml(vessel.notes)}</p>` : ''}
                    <div id="vessel-change-alert"></div>
                    ${isOwner && this.state.vessels.length > 1 ? `
                    <div class="field-row" style="margin-top: var(--space-3);">
                        <div class="field">
                            <label for="vessel-select">${t('tripDetail.vessel.changeLabel')}</label>
                            <select id="vessel-select">
                                ${this.state.vessels.map((v) => `<option value="${v.id}" ${String(v.id) === String(trip.vessel_id) ? 'selected' : ''}>${escapeHtml(v.vessel_name)}</option>`).join('')}
                            </select>
                        </div>
                        <button class="btn btn-secondary btn-sm" type="button" id="vessel-change-btn" style="align-self:flex-end;">${t('tripDetail.vessel.changeButton')}</button>
                    </div>` : ''}
                </div>

                <div class="card">
                    <h3>${t('tripDetail.iceContact.heading')}</h3>
                    <p class="mb-0">${isOwner
                        ? (trip.ice_contact_id ? escapeHtml(this.iceContactLabel(trip.ice_contact_id)) : escapeHtml(t('tripDetail.iceContact.allContacts')))
                        : (trip.has_specific_ice_contact ? escapeHtml(t('tripDetail.iceContact.specificContact')) : escapeHtml(t('tripDetail.iceContact.allContacts')))}</p>
                    <div id="ice-contact-change-alert"></div>
                    ${isOwner ? (this.state.iceContacts.length > 0 ? `
                    <div class="field-row" style="margin-top: var(--space-3);">
                        <div class="field">
                            <label for="ice-contact-select">${t('tripDetail.iceContact.changeLabel')}</label>
                            <select id="ice-contact-select">
                                ${this.state.iceContacts.map((c) => `<option value="${c.id}" ${String(c.id) === String(trip.ice_contact_id) ? 'selected' : ''}>${escapeHtml(c.name)}${c.relationship ? ` (${escapeHtml(c.relationship)})` : ''}</option>`).join('')}
                            </select>
                        </div>
                        <button class="btn btn-secondary btn-sm" type="button" id="ice-contact-change-btn" style="align-self:flex-end;">${t('tripDetail.iceContact.changeButton')}</button>
                    </div>` : `
                    <div class="alert alert-info" style="margin-top: var(--space-3);">
                        ${escapeHtml(t('createTrip.iceContact.noneRegistered'))}
                        <a href="#/ice-contacts">${escapeHtml(t('createTrip.iceContact.addLink'))}</a>
                    </div>`) : ''}
                </div>

                <div class="card">
                    <h3>${t('tripDetail.routes.heading')}</h3>
                    <div id="routes-alert"></div>
                    <div id="routes-list"></div>
                    <div id="trip-route-map" class="map-container"></div>
                    ${isOwner ? `
                    <hr class="section-divider">
                    <div class="card-header">
                        <h3>${t('tripDetail.routes.addAltHeading')}</h3>
                        <div id="new-route-saved-route-picker"></div>
                    </div>
                    <div class="route-mode-toggle btn-group">
                        <button type="button" class="btn btn-sm" id="new-route-mode-windy">${t('tripDetail.routes.importWindy')}</button>
                        <button type="button" class="btn btn-sm" id="new-route-mode-manual">${t('tripDetail.routes.drawManual')}</button>
                        <button type="button" class="btn btn-sm" id="new-route-mode-gpx">${t('tripDetail.routes.importGpx')}</button>
                    </div>
                    <div id="new-route-body"></div>
                    <div class="field">
                        <label for="new-route-reason">${t('tripDetail.routes.reasonOptionalLabel')}</label>
                        <input type="text" id="new-route-reason" placeholder="${t('tripDetail.routes.reasonPlaceholder')}">
                    </div>
                    <div class="checkbox-field">
                        <input type="checkbox" id="new-route-save-toggle" ${this.state.newRouteSaveToArchive ? 'checked' : ''}>
                        <label for="new-route-save-toggle">${t('tripDetail.routes.saveToArchive')}</label>
                    </div>
                    <div class="field" id="new-route-save-form" ${this.state.newRouteSaveToArchive ? '' : 'hidden'}>
                        <input type="text" id="new-route-save-name" value="${escapeHtml(this.state.newRouteSaveName)}" placeholder="${escapeHtml(t('tripDetail.routes.saveRouteNamePlaceholder'))}">
                    </div>
                    <button class="btn btn-secondary btn-sm" type="button" id="add-route-btn">+ ${t('tripDetail.routes.addButton')}</button>` : ''}
                </div>

                <div class="card">
                    <h3>${t('tripDetail.crew.heading')}</h3>
                    <div id="crew-list-container"></div>
                    ${isOwner ? `
                    <hr class="section-divider">
                    <h3>${t('tripDetail.crew.inviteHeading')}</h3>
                    <div id="invite-alert"></div>
                    <div class="field-row address-book-anchor">
                        <div class="field">
                            <label for="invite-email">${t('common.email')}</label>
                            <input type="email" id="invite-email" autocomplete="off">
                        </div>
                        <div class="field">
                            <label for="invite-name">${t('tripDetail.crew.nameOptionalLabel')}</label>
                            <input type="text" id="invite-name" autocomplete="off">
                        </div>
                        <ul id="crew-address-book-suggestions" class="address-book-suggestions" aria-label="${escapeHtml(t('tripDetail.crew.addressBookAriaLabel'))}" hidden></ul>
                    </div>
                    <div class="checkbox-field">
                        <input type="checkbox" id="invite-save-contact">
                        <label for="invite-save-contact">${t('tripDetail.crew.saveContactLabel')}</label>
                    </div>
                    <button class="btn btn-secondary" type="button" id="invite-crew-btn">${t('tripDetail.crew.sendInviteButton')}</button>` : ''}
                </div>

                <div class="card">
                    <h3>${t('tripDetail.log.heading')}</h3>
                    <div id="trip-log-container"></div>
                </div>
            </div>`;

        if (isOwner) this.renderActions(trip);
        this.renderRoutes(routes, isOwner);
        this.renderCrew(crew, isOwner);
        this.renderLog(audit_log);
        if (vessel?.photo_path) {
            this.loadVesselPhoto(vessel.id);
        }
        if (!isOwner && skipper?.photo_path) {
            this.loadSkipperPhoto(skipper.id);
        }

        document.getElementById('invite-crew-btn')?.addEventListener('click', () => this.handleInviteCrew());
        this.setupAddressBookAutocomplete();
        document.getElementById('add-route-btn')?.addEventListener('click', () => this.handleAddRoute());
        document.getElementById('vessel-change-btn')?.addEventListener('click', () => this.handleChangeVessel());
        document.getElementById('ice-contact-change-btn')?.addEventListener('click', () => this.handleChangeIceContact());
        document.getElementById('schedule-change-btn')?.addEventListener('click', () => this.handleChangeSchedule());

        document.getElementById('new-route-mode-windy')?.addEventListener('click', () => {
            this.state.newRouteMode = 'windy';
            this.renderNewRouteBody();
        });
        document.getElementById('new-route-mode-manual')?.addEventListener('click', () => {
            this.state.newRouteMode = 'manual';
            this.renderNewRouteBody();
        });
        document.getElementById('new-route-mode-gpx')?.addEventListener('click', () => {
            this.state.newRouteMode = 'gpx';
            this.renderNewRouteBody();
        });
        document.getElementById('new-route-save-toggle')?.addEventListener('change', (e) => {
            this.state.newRouteSaveToArchive = e.target.checked;
            document.getElementById('new-route-save-form').hidden = !e.target.checked;
            if (e.target.checked) document.getElementById('new-route-save-name').focus();
        });
        document.getElementById('new-route-save-name')?.addEventListener('input', (e) => {
            this.state.newRouteSaveName = e.target.value;
        });
        if (isOwner) {
            this.renderNewRouteBody();
            this.renderSavedRoutePicker();
        }
    },

    renderSavedRoutePicker() {
        const picker = document.getElementById('new-route-saved-route-picker');
        if (!picker) return;

        if (this.state.savedRoutes.length === 0) {
            picker.innerHTML = '';
            return;
        }

        picker.innerHTML = `
            <select class="btn btn-secondary btn-sm" id="new-route-saved-route-select">
                <option value="">${escapeHtml(t('tripDetail.routes.addSavedRoute'))}</option>
                ${this.state.savedRoutes.map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('')}
            </select>`;

        document.getElementById('new-route-saved-route-select').addEventListener('change', (e) => {
            const savedRouteId = Number(e.target.value);
            e.target.value = '';
            if (!savedRouteId) return;
            this.addSavedRouteToNewRoute(savedRouteId);
        });
    },

    addSavedRouteToNewRoute(savedRouteId) {
        const saved = this.state.savedRoutes.find((r) => r.id === savedRouteId);
        if (!saved) return;

        if (saved.raw_windy_url) {
            this.state.newRouteMode = 'windy';
            this.state.newRouteCoordinates = [];
            this.renderNewRouteBody();
            document.getElementById('new-route-windy-url').value = saved.raw_windy_url;
        } else {
            this.state.newRouteMode = 'manual';
            this.state.newRouteCoordinates = parseWktLineString(saved.geometry_wkt);
            this.renderNewRouteBody();
        }
    },

    renderNewRouteBody() {
        const container = document.getElementById('new-route-body');
        if (!container) return;

        document.getElementById('new-route-mode-windy').classList.toggle('btn-primary', this.state.newRouteMode === 'windy');
        document.getElementById('new-route-mode-windy').classList.toggle('btn-ghost', this.state.newRouteMode !== 'windy');
        document.getElementById('new-route-mode-manual').classList.toggle('btn-primary', this.state.newRouteMode === 'manual');
        document.getElementById('new-route-mode-manual').classList.toggle('btn-ghost', this.state.newRouteMode !== 'manual');
        document.getElementById('new-route-mode-gpx').classList.toggle('btn-primary', this.state.newRouteMode === 'gpx');
        document.getElementById('new-route-mode-gpx').classList.toggle('btn-ghost', this.state.newRouteMode !== 'gpx');

        if (this.state.newRouteDrawMap) {
            this.state.newRouteDrawMap.destroy();
            this.state.newRouteDrawMap = null;
        }

        if (this.state.newRouteMode === 'manual') {
            container.innerHTML = `
                <div class="field">
                    <label>${t('tripDetail.routes.drawOnMapLabel')}</label>
                    <small class="text-muted">${t('tripDetail.routes.drawHint')}</small>
                    <div id="new-route-draw-map" class="map-container route-draw-map"></div>
                    <div class="route-draw-footer">
                        <span class="text-muted" style="font-size: var(--font-size-sm);"><span id="new-route-draw-count">${this.state.newRouteCoordinates.length}</span> ${t('tripDetail.routes.pointsLabel')}</span>
                        <button class="btn btn-ghost btn-sm" type="button" id="new-route-clear">${t('tripDetail.routes.clearRoute')}</button>
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
        } else if (this.state.newRouteMode === 'gpx') {
            container.innerHTML = `
                <div class="field">
                    <label>${t('tripDetail.routes.gpxLabel')}</label>
                    <small class="text-muted">${t('tripDetail.routes.gpxHint')}</small>
                    <input type="file" id="new-route-gpx-file" accept=".gpx,application/gpx+xml">
                    <div class="route-draw-footer">
                        <span class="text-muted" style="font-size: var(--font-size-sm);"><span id="new-route-draw-count">${this.state.newRouteCoordinates.length}</span> ${t('tripDetail.routes.pointsLabel')}</span>
                        <button class="btn btn-ghost btn-sm" type="button" id="new-route-clear">${t('tripDetail.routes.clearRoute')}</button>
                    </div>
                </div>`;

            document.getElementById('new-route-gpx-file').addEventListener('change', (e) => this.handleNewRouteGpxFile(e.target));

            document.getElementById('new-route-clear').addEventListener('click', () => {
                this.state.newRouteCoordinates = [];
                document.getElementById('new-route-draw-count').textContent = '0';
            });
        } else {
            container.innerHTML = `
                <div class="field">
                    <label for="new-route-windy-url">${t('tripDetail.routes.windyUrlLabel')}</label>
                    <input type="url" id="new-route-windy-url" placeholder="https://www.windy.com/route-planner/boat/...">
                </div>`;
        }
    },

    async handleNewRouteGpxFile(inputEl) {
        const alertBox = document.getElementById('routes-alert');
        const file = inputEl.files[0];
        inputEl.value = ''; // the file is only read in-memory; discard it once we've extracted its coordinates
        if (!file) return;

        const coords = parseGpxFile(await file.text());
        if (!coords) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('tripDetail.routes.gpxParseError'))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        this.state.newRouteCoordinates = coords;
        const countEl = document.getElementById('new-route-draw-count');
        if (countEl) countEl.textContent = coords.length;
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
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.vessel.changeFailed')))}</div>`;
            return;
        }

        if (response.data.schedule_notice?.conflicting_trip_exists) {
            showToast(t('tripDetail.vessel.mmsiConflictNotice'), 'info');
        }

        showToast(t('tripDetail.vessel.changed'), 'success');
        await this.load(document.getElementById('page-content'));
    },

    iceContactLabel(contactId) {
        const contact = this.state.iceContacts.find((c) => String(c.id) === String(contactId));
        return contact ? contact.name : '';
    },

    async handleChangeIceContact() {
        const alertBox = document.getElementById('ice-contact-change-alert');
        const select = document.getElementById('ice-contact-select');
        const iceContactId = select.value ? Number(select.value) : null;

        if (!iceContactId) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.iceContact.required'))}</div>`;
            return;
        }

        if (String(iceContactId) === String(this.state.data.trip.ice_contact_id)) {
            return;
        }

        const btn = document.getElementById('ice-contact-change-btn');
        btn.disabled = true;

        const response = await apiRequest(`/trips/${this.state.tripId}`, {
            method: 'PUT',
            body: JSON.stringify({ ice_contact_id: iceContactId })
        });

        btn.disabled = false;

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.iceContact.changeFailed')))}</div>`;
            return;
        }

        showToast(t('tripDetail.iceContact.changed'), 'success');
        await this.load(document.getElementById('page-content'));
    },

    // Mirrors the backend's TripHandler::update rules - departure is locked
    // once the trip leaves draft/published (i.e. is activated), arrival and
    // grace period are locked once the trip reaches a final state
    // (completed/cancelled).
    canEditDeparture(trip) {
        return ['draft', 'published'].includes(trip.status);
    },

    canEditArrival(trip) {
        return !['completed', 'cancelled'].includes(trip.status);
    },

    canEditGrace(trip) {
        return !['completed', 'cancelled'].includes(trip.status);
    },

    async handleChangeSchedule() {
        const alertBox = document.getElementById('schedule-alert');
        const trip = this.state.data.trip;
        const departureInput = document.getElementById('departure-input');
        const arrivalInput = document.getElementById('arrival-input');
        const graceInput = document.getElementById('grace-input');

        const currentDeparture = toApiDatetime(toInputDatetime(trip.departure_scheduled));
        const currentArrival = toApiDatetime(toInputDatetime(trip.arrival_scheduled));
        const newDeparture = departureInput ? toApiDatetime(departureInput.value) : currentDeparture;
        const newArrival = arrivalInput ? toApiDatetime(arrivalInput.value) : currentArrival;
        const newGrace = graceInput ? Number(graceInput.value) : Number(trip.grace_period_seconds);

        // Only send fields that actually changed - a no-op PUT on an
        // already-ICE-notified trip would otherwise trigger a spurious
        // "schedule updated" alert to the ICE contact.
        const payload = {};
        if (departureInput && newDeparture !== currentDeparture) payload.departure_scheduled = newDeparture;
        if (arrivalInput && newArrival !== currentArrival) payload.arrival_scheduled = newArrival;
        if (graceInput && newGrace !== Number(trip.grace_period_seconds)) payload.grace_period_seconds = newGrace;

        if (Object.keys(payload).length === 0) {
            return;
        }

        if (newArrival <= newDeparture) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.arrivalBeforeDeparture'))}</div>`;
            return;
        }

        const btn = document.getElementById('schedule-change-btn');
        btn.disabled = true;

        const response = await apiRequest(`/trips/${this.state.tripId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        btn.disabled = false;

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.schedule.changeFailed')))}</div>`;
            return;
        }

        if (response.data.schedule_notice?.conflicting_trip_exists) {
            showToast(t('tripDetail.vessel.mmsiConflictNotice'), 'info');
        }

        showToast(t('tripDetail.schedule.changed'), 'success');
        await this.load(document.getElementById('page-content'));
    },

    formatDimensions(vessel) {
        return [
            vessel?.length_m ? t('tripDetail.vessel.dimLength', { value: Number(vessel.length_m) }) : '',
            vessel?.width_m ? t('tripDetail.vessel.dimWidth', { value: Number(vessel.width_m) }) : '',
            vessel?.draft_m ? t('tripDetail.vessel.dimDraft', { value: Number(vessel.draft_m) }) : ''
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
            bindLightboxImages(document);
        } catch (err) { /* leave the photo hidden */ }
    },

    // Photos are auth-protected, so a plain <img src> won't do (no way to
    // attach the Authorization header) - fetch as blob and swap in. The
    // trip id is passed as ?trip= so PhotoHandler::getUserPhoto can verify
    // the requester is this trip's accepted crew or confirmed ICE contact.
    async loadSkipperPhoto(skipperId) {
        const img = document.getElementById('skipper-photo');
        if (!img) return;
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/users/${skipperId}/photo?trip=${encodeURIComponent(this.state.tripId)}`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) return;
            img.src = URL.createObjectURL(await response.blob());
            img.hidden = false;
            bindLightboxImages(document);
        } catch (err) { /* leave the photo hidden */ }
    },

    renderActions(trip) {
        const actionsCard = document.getElementById('actions-card');
        this.state.forceDelete = false;
        const deleteBtnLabel = t('tripDetail.actions.deleteButton');
        const deleteBtnHtml = `<button class="btn btn-danger" type="button" id="delete-trip-btn">${deleteBtnLabel}</button>`;

        if (trip.status === 'draft' || trip.status === 'published') {
            actionsCard.innerHTML = `
                <h3>${t('tripDetail.actions.heading')}</h3>
                <p class="text-muted">${t('tripDetail.actions.notActiveHint')}</p>
                <div id="delete-trip-alert"></div>
                <div class="btn-group">
                    <button class="btn btn-primary" type="button" id="activate-btn">${t('tripDetail.actions.activateButton')}</button>
                    ${deleteBtnHtml}
                </div>`;
            document.getElementById('activate-btn').addEventListener('click', () => this.handleActivate());
            document.getElementById('delete-trip-btn').addEventListener('click', () => this.handleDeleteTrip());
            return;
        }

        if (trip.status === 'active') {
            actionsCard.innerHTML = `
                <h3>${t('tripDetail.actions.heading')}</h3>
                <div class="stack">
                    <div>
                        <label style="font-size: var(--font-size-sm); font-weight:600; color: var(--color-text-muted);">${t('tripDetail.actions.snoozeLabel')}</label>
                        <div class="btn-group" style="margin-top: var(--space-2);">
                            ${CONFIG.SNOOZE_PRESETS.map((m) => `<button class="btn btn-secondary btn-sm snooze-btn" data-minutes="${m}" type="button">+${m} min</button>`).join('')}
                        </div>
                    </div>
                    <button class="btn btn-primary" type="button" id="verify-btn">${t('tripDetail.actions.verifyButton')}</button>
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
            <h3>${t('tripDetail.actions.heading')}</h3>
            <p class="text-muted">${t('tripDetail.actions.inactiveHint', { status: t('trip.status.' + trip.status).toLowerCase() })}</p>
            <div id="delete-trip-alert"></div>
            ${deleteBtnHtml}`;
        document.getElementById('delete-trip-btn').addEventListener('click', () => this.handleDeleteTrip());
    },

    renderRoutes(routes, isOwner = true) {
        const list = document.getElementById('routes-list');
        routes = routes || [];

        if (routes.length === 0) {
            list.innerHTML = `<p class="text-muted">${t('tripDetail.routes.empty')}</p>`;
        } else {
            list.innerHTML = routes.map((r, i) => `
                <div class="route-item" data-route-id="${r.id}">
                    <div class="route-item__title">
                        <span class="route-color-dot" style="background:${this.ROUTE_COLORS[i % this.ROUTE_COLORS.length]};"></span>
                        ${i === 0 ? t('tripDetail.routes.mainRoute') : t('tripDetail.routes.altRoute', { n: i })}
                        ${isOwner ? `
                        <div class="btn-group" style="margin-left:auto;">
                            <button class="btn btn-ghost btn-sm move-route-up" type="button" data-id="${r.id}" ${i === 0 ? 'disabled' : ''} title="${t('tripDetail.routes.moveUpTitle')}">↑</button>
                            <button class="btn btn-ghost btn-sm move-route-down" type="button" data-id="${r.id}" ${i === routes.length - 1 ? 'disabled' : ''} title="${t('tripDetail.routes.moveDownTitle')}">↓</button>
                            <button class="btn btn-ghost btn-sm edit-route-btn" type="button" data-id="${r.id}">${t('common.edit')}</button>
                            <button class="btn btn-danger btn-sm delete-route-btn" type="button" data-id="${r.id}">${t('common.remove')}</button>
                        </div>` : ''}
                    </div>
                    <div class="route-item__view" data-id="${r.id}">
                        ${r.reason ? `<div class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(r.reason)}</div>` : ''}
                    </div>
                    <div class="route-item__edit" data-id="${r.id}" hidden>
                        <div class="route-mode-toggle btn-group">
                            <button type="button" class="btn btn-sm edit-mode-windy" data-id="${r.id}">${t('tripDetail.routes.importWindy')}</button>
                            <button type="button" class="btn btn-sm edit-mode-manual" data-id="${r.id}">${t('tripDetail.routes.drawManual')}</button>
                            <button type="button" class="btn btn-sm edit-mode-gpx" data-id="${r.id}">${t('tripDetail.routes.importGpx')}</button>
                        </div>
                        <div class="route-edit-body" data-id="${r.id}"></div>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-sm save-route-btn" type="button" data-id="${r.id}">${t('common.save')}</button>
                            <button class="btn btn-ghost btn-sm cancel-route-edit-btn" type="button" data-id="${r.id}">${t('common.cancel')}</button>
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
        list.querySelectorAll('.edit-mode-gpx').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.state.editRoutes[btn.dataset.id].mode = 'gpx';
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
            .map((r, i) => ({ coordinates: parseWktLineString(r.geometry_wkt), color: this.ROUTE_COLORS[i % this.ROUTE_COLORS.length], label: r.reason || (i === 0 ? t('tripDetail.routes.mainRoute') : t('tripDetail.routes.altRoute', { n: i })) }))
            .filter((r) => r.coordinates.length > 1);

        if (mapRoutes.length > 0) {
            this.state.map = renderRouteMap(mapEl, mapRoutes);
        } else {
            mapEl.innerHTML = `<div class="empty-state">${t('tripDetail.routes.noRouteToShow')}</div>`;
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

        document.querySelector(`.edit-mode-windy[data-id="${routeId}"]`)?.classList.toggle('btn-primary', editState.mode === 'windy');
        document.querySelector(`.edit-mode-windy[data-id="${routeId}"]`)?.classList.toggle('btn-ghost', editState.mode !== 'windy');
        document.querySelector(`.edit-mode-manual[data-id="${routeId}"]`)?.classList.toggle('btn-primary', editState.mode === 'manual');
        document.querySelector(`.edit-mode-manual[data-id="${routeId}"]`)?.classList.toggle('btn-ghost', editState.mode !== 'manual');
        document.querySelector(`.edit-mode-gpx[data-id="${routeId}"]`)?.classList.toggle('btn-primary', editState.mode === 'gpx');
        document.querySelector(`.edit-mode-gpx[data-id="${routeId}"]`)?.classList.toggle('btn-ghost', editState.mode !== 'gpx');

        if (this.state.editDrawMaps[routeId]) {
            this.state.editDrawMaps[routeId].destroy();
            delete this.state.editDrawMaps[routeId];
        }

        if (editState.mode === 'manual') {
            body.innerHTML = `
                <div class="field">
                    <label>${t('tripDetail.routes.drawOnMapLabel')}</label>
                    <small class="text-muted">${t('tripDetail.routes.drawHint')}</small>
                    <div id="edit-route-draw-map-${routeId}" class="map-container route-draw-map"></div>
                    <div class="route-draw-footer">
                        <span class="text-muted" style="font-size: var(--font-size-sm);"><span id="edit-route-draw-count-${routeId}">${editState.coordinates.length}</span> ${t('tripDetail.routes.pointsLabel')}</span>
                        <button class="btn btn-ghost btn-sm" type="button" id="edit-route-clear-${routeId}">${t('tripDetail.routes.clearRoute')}</button>
                    </div>
                </div>
                <div class="field">
                    <label>${t('tripDetail.routes.reasonLabel')}</label>
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
        } else if (editState.mode === 'gpx') {
            body.innerHTML = `
                <div class="field">
                    <label>${t('tripDetail.routes.gpxLabel')}</label>
                    <small class="text-muted">${t('tripDetail.routes.gpxHint')}</small>
                    <input type="file" class="edit-route-gpx-file" data-id="${routeId}" accept=".gpx,application/gpx+xml">
                    <div class="route-draw-footer">
                        <span class="text-muted" style="font-size: var(--font-size-sm);"><span id="edit-route-draw-count-${routeId}">${editState.coordinates.length}</span> ${t('tripDetail.routes.pointsLabel')}</span>
                        <button class="btn btn-ghost btn-sm" type="button" id="edit-route-clear-${routeId}">${t('tripDetail.routes.clearRoute')}</button>
                    </div>
                </div>
                <div class="field">
                    <label>${t('tripDetail.routes.reasonLabel')}</label>
                    <input type="text" class="edit-route-reason" data-id="${routeId}" value="${escapeHtml(editState.reason || '')}">
                </div>`;

            document.querySelector(`.edit-route-gpx-file[data-id="${routeId}"]`)
                .addEventListener('change', (e) => this.handleEditRouteGpxFile(routeId, e.target));

            document.getElementById(`edit-route-clear-${routeId}`).addEventListener('click', () => {
                editState.coordinates = [];
                document.getElementById(`edit-route-draw-count-${routeId}`).textContent = '0';
            });
        } else {
            body.innerHTML = `
                <div class="field">
                    <label>${t('tripDetail.routes.windyUrlLabel')}</label>
                    <input type="url" class="edit-route-windy-url" data-id="${routeId}" value="${escapeHtml(editState.windyUrl || '')}">
                </div>
                <div class="field">
                    <label>${t('tripDetail.routes.reasonLabel')}</label>
                    <input type="text" class="edit-route-reason" data-id="${routeId}" value="${escapeHtml(editState.reason || '')}">
                </div>`;

            document.querySelector(`.edit-route-windy-url[data-id="${routeId}"]`)
                .addEventListener('input', (e) => { editState.windyUrl = e.target.value; });
        }

        document.querySelector(`.edit-route-reason[data-id="${routeId}"]`)
            ?.addEventListener('input', (e) => { editState.reason = e.target.value; });
    },

    async handleEditRouteGpxFile(routeId, inputEl) {
        const alertBox = document.getElementById('routes-alert');
        const editState = this.state.editRoutes[routeId];
        const file = inputEl.files[0];
        inputEl.value = ''; // the file is only read in-memory; discard it once we've extracted its coordinates
        if (!file) return;

        const coords = parseGpxFile(await file.text());
        if (!coords) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('tripDetail.routes.gpxParseError'))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        editState.coordinates = coords;
        const countEl = document.getElementById(`edit-route-draw-count-${routeId}`);
        if (countEl) countEl.textContent = coords.length;
    },

    async handleAddRoute() {
        const alertBox = document.getElementById('routes-alert');
        const reason = document.getElementById('new-route-reason').value.trim();
        const saveName = document.getElementById('new-route-save-name').value.trim();

        let body;
        let archiveBody;
        if (this.state.newRouteMode === 'manual' || this.state.newRouteMode === 'gpx') {
            if (this.state.newRouteCoordinates.length < 2) {
                alertBox.innerHTML = `<div class="alert alert-error">${t('tripDetail.routes.minPointsError')}</div>`;
                return;
            }
            body = { coordinates: this.state.newRouteCoordinates, reason: reason || null };
            archiveBody = { name: saveName, coordinates: this.state.newRouteCoordinates };
        } else {
            const windyUrl = document.getElementById('new-route-windy-url').value.trim();
            const urlError = Validate.windyUrl(windyUrl);
            if (urlError) {
                alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(urlError)}</div>`;
                return;
            }
            body = { windy_url: windyUrl, reason: reason || null };
            archiveBody = { name: saveName, windy_url: windyUrl };
        }

        if (this.state.newRouteSaveToArchive && !saveName) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('tripDetail.routes.saveRouteNameRequired'))}</div>`;
            return;
        }

        const response = await apiRequest(`/trips/${this.state.tripId}/routes`, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.routes.addFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast(t('tripDetail.routes.added'), 'success');

        if (this.state.newRouteSaveToArchive) {
            const archiveResponse = await apiRequest('/saved-routes', { method: 'POST', body: JSON.stringify(archiveBody) });
            if (archiveResponse.success) invalidateNavVisibility('savedRoutes');
            showToast(archiveResponse.success ? t('tripDetail.routes.saveRouteArchiveSuccess') : t('tripDetail.routes.saveRouteArchiveFailed'), archiveResponse.success ? 'success' : 'error');
        }

        this.state.newRouteSaveToArchive = false;
        this.state.newRouteSaveName = '';
        await this.load(document.getElementById('page-content'));
    },

    async handleSaveRoute(routeId) {
        const alertBox = document.getElementById('routes-alert');
        const editState = this.state.editRoutes[routeId];
        const reason = (document.querySelector(`.edit-route-reason[data-id="${routeId}"]`)?.value ?? editState.reason ?? '').trim();

        let body;
        if (editState.mode === 'manual' || editState.mode === 'gpx') {
            if (editState.coordinates.length < 2) {
                alertBox.innerHTML = `<div class="alert alert-error">${t('tripDetail.routes.minPointsError')}</div>`;
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
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.routes.saveFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast(t('tripDetail.routes.saved'), 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleDeleteRoute(routeId) {
        if (!confirm(t('tripDetail.routes.deleteConfirm'))) return;

        const response = await apiRequest(`/routes/${routeId}`, { method: 'DELETE' });
        if (!response.success) {
            document.getElementById('routes-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.routes.deleteFailed')))}</div>`;
            return;
        }

        showToast(t('tripDetail.routes.deleted'), 'success');
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
            document.getElementById('routes-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.routes.reorderFailed')))}</div>`;
            return;
        }

        await this.load(document.getElementById('page-content'));
    },

    renderCrew(crew, isOwner = true) {
        const container = document.getElementById('crew-list-container');

        if (!crew || crew.length === 0) {
            container.innerHTML = `<p class="text-muted">${t('tripDetail.crew.empty')}</p>`;
            return;
        }

        const currentUserId = Auth.getUser().id;

        container.innerHTML = `<div class="crew-list">${crew.map((c) => {
            const accepted = !!c.accepted_at;
            // Only the crew member who owns this profile (i.e. is logged in
            // as the registered user it's linked to) may add/change its
            // photo - the skipper can see and manage the crew list, but
            // photo management is that individual's own business.
            const isSelf = c.registered_user_id != null && String(c.registered_user_id) === String(currentUserId);
            return `
                <div class="crew-row">
                    <img class="crew-photo lightbox-trigger" data-crew-id="${c.id}" alt="${escapeHtml(c.name || '')}"
                        style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:var(--space-3);background:var(--color-bg);" hidden>
                    <div class="crew-row__info">
                        <span class="crew-row__name">${escapeHtml(c.name || c.email || t('tripDetail.crew.unknownName'))}</span>
                        <span class="crew-row__detail">
                            ${c.email ? `${t('common.email')}: ${escapeHtml(c.email)}` : ''}${c.phone ? ` · ${t('common.phone')}: ${escapeHtml(c.phone)}` : ''}
                            ${c.ice_contact ? ` · ${t('tripDetail.crew.iceContactLabel', { contact: escapeHtml(c.ice_contact) })}` : ''}
                        </span>
                        ${isSelf ? `
                        <label class="text-muted" style="font-size: var(--font-size-sm); display:block; margin-top: var(--space-1);">
                            <input type="file" class="crew-photo-input" data-crew-id="${c.id}" accept="image/jpeg,image/png" style="max-width: 220px;">
                        </label>` : ''}
                    </div>
                    <div class="stack" style="flex-direction: row; align-items: center; gap: var(--space-3);">
                        <span class="crew-status ${accepted ? 'crew-status--accepted' : 'crew-status--pending'}">
                            ${accepted ? t('tripDetail.crew.accepted') : t('tripDetail.crew.pending')}
                        </span>
                        ${isSelf ? `<button class="btn btn-ghost btn-sm crew-photo-submit" data-crew-id="${c.id}" type="button">${c.photo_path ? t('tripDetail.crew.changePhoto') : t('tripDetail.crew.addPhoto')}</button>` : ''}
                        ${isOwner ? `
                        ${!accepted && c.invitation_token ? `<button class="btn btn-ghost btn-sm copy-link-btn" data-token="${escapeHtml(c.invitation_token)}" type="button">${t('tripDetail.crew.copyLink')}</button>` : ''}
                        <button class="btn btn-danger btn-sm remove-crew-btn" data-crew-id="${c.id}" type="button">${t('common.remove')}</button>` : ''}
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

    renderLog(auditLog) {
        const container = document.getElementById('trip-log-container');

        if (!auditLog || auditLog.length === 0) {
            container.innerHTML = `<p class="text-muted">${escapeHtml(t('tripDetail.log.empty'))}</p>`;
            return;
        }

        container.innerHTML = `<div class="change-log">${auditLog.map((entry) => `
                <div class="change-log__item">
                    <span class="change-log__time">${formatDateTime(entry.changed_at)}</span>
                    <span class="change-log__text">${escapeHtml(entry.message || entry.action)}</span>
                </div>`).join('')}</div>`;
    },

    async handleCrewPhotoSubmit(crewId) {
        const input = document.querySelector(`.crew-photo-input[data-crew-id="${crewId}"]`);
        const photoFile = input.files[0];

        if (!photoFile) {
            showToast(t('tripDetail.crew.choosePhotoFirst'), 'error');
            return;
        }

        const formData = new FormData();
        formData.append('photo', photoFile);
        const response = await apiUpload(`/crew/${crewId}/photo`, formData, 'PUT');

        if (!response.success) {
            showToast(response.code ? t.error(response.code) : (response.error || t('tripDetail.crew.photoSaveFailed')), 'error');
            return;
        }

        showToast(t('tripDetail.crew.photoSaved'), 'success');
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
                bindLightboxImages(container);
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
            showToast(t('tripDetail.crew.linkCopied'), 'success');
        } catch (err) {
            showToast(link, 'info');
        }
    },

    async handleActivate() {
        const response = await apiRequest(`/trips/${this.state.tripId}/activate`, { method: 'POST' });
        if (!response.success) {
            const message = response.code === 'MMSI_ALREADY_ACTIVE'
                ? t('tripDetail.actions.mmsiConflictError')
                : (response.code ? t.error(response.code) : response.error);
            document.getElementById('trip-detail-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(message)}</div>`;
            return;
        }
        showToast(t('tripDetail.actions.activated'), 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleSnooze(minutes) {
        const response = await apiRequest(`/trips/${this.state.tripId}/snooze`, {
            method: 'POST',
            body: JSON.stringify({ snooze_minutes: minutes })
        });
        if (!response.success) {
            document.getElementById('trip-detail-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.actions.actionFailed')))}</div>`;
            return;
        }
        showToast(t('tripDetail.actions.snoozed', { minutes }), 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleVerify() {
        if (!confirm(t('tripDetail.actions.verifyConfirm'))) return;

        const response = await apiRequest(`/trips/${this.state.tripId}/verify`, { method: 'POST' });
        if (!response.success) {
            document.getElementById('trip-detail-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.actions.actionFailed')))}</div>`;
            return;
        }
        showToast(t('tripDetail.actions.verified'), 'success');
        await this.load(document.getElementById('page-content'));
    },

    // Suggests contacts the skipper has explicitly saved ("Save contact"
    // checkbox on the invite form) as they type into either the email or
    // name field, matching on both - picking a suggestion fills in both
    // fields. Backed by GET /crew/address-book (CrewHandler::addressBook /
    // AddressBookEntry::search).
    setupAddressBookAutocomplete() {
        const emailInput = document.getElementById('invite-email');
        const nameInput = document.getElementById('invite-name');
        const box = document.getElementById('crew-address-book-suggestions');
        if (!emailInput || !nameInput || !box) return;

        [emailInput, nameInput].forEach((input) => {
            input.addEventListener('input', () => this.handleAddressBookInput(input.value));
            // Delay hiding on blur so a click/mousedown on a suggestion (below) still lands first.
            input.addEventListener('blur', () => {
                setTimeout(() => { box.hidden = true; }, 150);
            });
        });
    },

    async handleAddressBookInput(rawValue) {
        const box = document.getElementById('crew-address-book-suggestions');
        if (!box) return;

        const query = rawValue.trim();
        clearTimeout(this.addressBookDebounce);

        if (query.length < 2) {
            box.hidden = true;
            box.innerHTML = '';
            return;
        }

        this.addressBookDebounce = setTimeout(async () => {
            const token = (this.addressBookToken = (this.addressBookToken || 0) + 1);
            const response = await apiRequest(`/crew/address-book?q=${encodeURIComponent(query)}`);
            if (token !== this.addressBookToken) return; // a newer query has since started

            const matches = response.success ? (response.data || []) : [];
            if (matches.length === 0) {
                box.hidden = true;
                box.innerHTML = '';
                return;
            }

            box.innerHTML = matches.map((person) => `
                <li class="address-book-suggestions__item" data-name="${escapeHtml(person.name || '')}" data-email="${escapeHtml(person.email)}">
                    <span class="address-book-suggestions__name">${escapeHtml(person.name || person.email)}</span>
                    ${person.name ? `<span class="address-book-suggestions__email">${escapeHtml(person.email)}</span>` : ''}
                </li>`).join('');
            box.hidden = false;

            box.querySelectorAll('.address-book-suggestions__item').forEach((li) => {
                li.addEventListener('mousedown', (e) => {
                    e.preventDefault(); // keeps the input focused so blur doesn't hide the box before this fires
                    document.getElementById('invite-email').value = li.dataset.email;
                    document.getElementById('invite-name').value = li.dataset.name;
                    box.hidden = true;
                    box.innerHTML = '';
                });
            });
        }, 200);
    },

    async handleInviteCrew() {
        const alertBox = document.getElementById('invite-alert');
        const email = document.getElementById('invite-email').value.trim();
        const name = document.getElementById('invite-name').value.trim();
        const saveContact = document.getElementById('invite-save-contact').checked;

        const emailError = Validate.email(email);
        if (emailError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(emailError)}</div>`;
            return;
        }

        const response = await apiRequest(`/trips/${this.state.tripId}/crew`, {
            method: 'POST',
            body: JSON.stringify({ email, name: name || undefined, save_contact: saveContact })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.crew.inviteFailed')))}</div>`;
            return;
        }

        if (saveContact) invalidateNavVisibility('crewAddressBook');

        const link = response.data.invitation_link || this.buildInviteLink(response.data.invitation_token);
        const notice = response.data.invitation_sent
            ? t('tripDetail.crew.inviteCreatedEmailSent')
            : t('tripDetail.crew.inviteCreatedNotice');
        alertBox.innerHTML = `
            <div class="alert alert-success">
                ${notice}<br>
                <code style="word-break: break-all;">${escapeHtml(link)}</code>
            </div>`;
        document.getElementById('invite-email').value = '';
        document.getElementById('invite-name').value = '';
        document.getElementById('invite-save-contact').checked = false;

        await this.load(document.getElementById('page-content'));
    },

    async handleDeleteTrip() {
        const alertBox = document.getElementById('delete-trip-alert');
        const btn = document.getElementById('delete-trip-btn');

        if (this.state.forceDelete) {
            if (!confirm(t('tripDetail.actions.deleteForceConfirm'))) return;
        } else if (!confirm(t('tripDetail.actions.deleteConfirm'))) {
            return;
        }

        btn.disabled = true;
        const response = await apiRequest(`/trips/${this.state.tripId}${this.state.forceDelete ? '?force=true' : ''}`, { method: 'DELETE' });
        btn.disabled = false;

        if (!response.success) {
            if (response.code === 'TRIP_HAS_REGISTERED_PERSONS') {
                this.state.forceDelete = true;
                btn.textContent = t('tripDetail.actions.deleteAnywayButton');
                const crewCount = response.details?.crew_count || 0;
                const iceCount = response.details?.ice_count || 0;
                alertBox.innerHTML = `<div class="alert alert-error">${t('tripDetail.actions.deleteHasPersonsWarning', { crewCount, iceCount })}</div>`;
                return;
            }
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('tripDetail.actions.deleteFailed')))}</div>`;
            return;
        }

        showToast(t('tripDetail.actions.deleted'), 'success');
        location.hash = '#/dashboard';
    },

    async handleRemoveCrew(crewId) {
        if (!confirm(t('tripDetail.crew.removeConfirm'))) return;

        const response = await apiRequest(`/crew/${crewId}`, { method: 'DELETE' });
        if (!response.success) {
            showToast(response.code ? t.error(response.code) : (response.error || t('tripDetail.crew.removeFailed')), 'error');
            return;
        }
        showToast(t('tripDetail.crew.removed'), 'success');
        await this.load(document.getElementById('page-content'));
    }
};
