const CreateTripPage = {
    ROUTE_COLORS: ['#1e88a8', '#a06600', '#b3261e', '#1a7f4e'],

    state: {
        vessels: [],
        iceContacts: [],
        routes: [{ mode: 'windy', windyUrl: '', reason: '', coordinates: [] }],
        map: null,
        drawMaps: {}
    },

    async render(container) {
        this.state.routes = [{ mode: 'windy', windyUrl: '', reason: '', coordinates: [] }];
        this.state.map = null;
        Object.values(this.state.drawMaps).forEach((m) => m.destroy());
        this.state.drawMaps = {};

        container.innerHTML = `
            <div class="page page--narrow" style="max-width: 640px;">
                <div class="page-header">
                    <h1>${escapeHtml(t('createTrip.title'))}</h1>
                </div>
                <div id="create-trip-alert"></div>

                <div class="card">
                    <h3>${escapeHtml(t('createTrip.vessel.heading'))}</h3>
                    <div id="vessel-section"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('createTrip.vessel.loading'))}</div></div>
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('createTrip.iceContact.heading'))}</h3>
                    <div id="ice-contact-section"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('createTrip.iceContact.loading'))}</div></div>
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('createTrip.schedule.heading'))}</h3>
                    <div class="field-row">
                        <div class="field">
                            <label for="departure">${escapeHtml(t('createTrip.schedule.departureLabel'))}</label>
                            <input type="datetime-local" id="departure" required>
                        </div>
                        <div class="field">
                            <label for="arrival">${escapeHtml(t('createTrip.schedule.arrivalLabel'))}</label>
                            <input type="datetime-local" id="arrival" required>
                        </div>
                    </div>
                    <div class="field">
                        <label for="grace-period">${escapeHtml(t('createTrip.schedule.gracePeriodLabel'))}</label>
                        <select id="grace-period">
                            ${CONFIG.GRACE_PERIOD_OPTIONS.map((g) => `<option value="${g.seconds}" ${g.seconds === 86400 ? 'selected' : ''}>${escapeHtml(formatGracePeriod(g.seconds))}</option>`).join('')}
                        </select>
                        <small>${escapeHtml(t('createTrip.schedule.gracePeriodHint'))}</small>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>${escapeHtml(t('createTrip.routes.heading'))}</h3>
                        <button class="btn btn-secondary btn-sm" type="button" id="add-route-btn">${escapeHtml(t('createTrip.routes.addAlternative'))}</button>
                    </div>
                    <div id="routes-container"></div>
                    <div id="route-map" class="map-container"></div>
                </div>

                <div class="btn-group">
                    <a class="btn btn-ghost" href="#/dashboard">${escapeHtml(t('common.cancel'))}</a>
                    <button class="btn btn-primary" type="button" id="create-trip-submit">${escapeHtml(t('createTrip.submit'))}</button>
                </div>
            </div>`;

        document.getElementById('add-route-btn').addEventListener('click', () => {
            this.state.routes.push({ mode: 'windy', windyUrl: '', reason: '', coordinates: [] });
            this.renderRoutes();
        });
        document.getElementById('create-trip-submit').addEventListener('click', () => this.handleSubmit());

        this.renderRoutes();
        await Promise.all([this.loadVessels(), this.loadIceContacts()]);
    },

    async loadVessels() {
        const response = await apiRequest('/vessels');
        const section = document.getElementById('vessel-section');

        if (response.success) {
            this.state.vessels = response.data;
        }

        this.renderVesselSection();
    },

    async loadIceContacts() {
        const response = await apiRequest('/ice-contacts');

        if (response.success) {
            this.state.iceContacts = response.data || [];
        }

        this.renderIceContactSection();
    },

    renderIceContactSection() {
        const section = document.getElementById('ice-contact-section');
        if (!section) return;

        if (this.state.iceContacts.length === 0) {
            section.innerHTML = `
                <div class="alert alert-info">
                    ${escapeHtml(t('createTrip.iceContact.noneRegistered'))}
                    <a href="#/ice-contacts">${escapeHtml(t('createTrip.iceContact.addLink'))}</a>
                </div>`;
            return;
        }

        section.innerHTML = `
            <div class="field">
                <label for="ice-contact-select">${escapeHtml(t('createTrip.iceContact.selectLabel'))}</label>
                <select id="ice-contact-select">
                    <option value="">${escapeHtml(t('createTrip.iceContact.allOption'))}</option>
                    ${this.state.iceContacts.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}${c.relationship ? ` (${escapeHtml(c.relationship)})` : ''}</option>`).join('')}
                </select>
                <small>${escapeHtml(t('createTrip.iceContact.selectHint'))}</small>
            </div>`;
    },

    renderVesselSection() {
        const section = document.getElementById('vessel-section');

        section.innerHTML = `
            ${this.state.vessels.length > 0 ? `
                <div class="field">
                    <label for="vessel-select">${escapeHtml(t('createTrip.vessel.selectLabel'))}</label>
                    <select id="vessel-select">
                        ${this.state.vessels.map((v) => `<option value="${v.id}">${escapeHtml(v.vessel_name)}${v.mmsi ? escapeHtml(t('createTrip.vessel.mmsiSuffix', { mmsi: v.mmsi })) : ''}</option>`).join('')}
                    </select>
                </div>` : `<div class="alert alert-info">${escapeHtml(t('createTrip.vessel.noneRegistered'))}</div>`}
            <button class="btn btn-ghost btn-sm" type="button" id="toggle-new-vessel">${escapeHtml(t('createTrip.vessel.addNew'))}</button>
            <div id="new-vessel-form" style="display:${this.state.vessels.length > 0 ? 'none' : 'block'}; margin-top: var(--space-3);">
                <div class="field-row">
                    <div class="field">
                        <label for="vessel-name">${escapeHtml(t('createTrip.vessel.nameLabel'))}</label>
                        <input type="text" id="vessel-name" placeholder="${escapeHtml(t('createTrip.vessel.namePlaceholder'))}">
                    </div>
                    <div class="field">
                        <label for="vessel-mmsi">${escapeHtml(t('createTrip.vessel.mmsiLabel'))}</label>
                        <input type="text" id="vessel-mmsi">
                    </div>
                </div>
                <div class="field">
                    <label for="vessel-callsign">${escapeHtml(t('createTrip.vessel.callSignLabel'))}</label>
                    <input type="text" id="vessel-callsign">
                </div>
                <div class="field-row">
                    <div class="field">
                        <label for="vessel-model">${escapeHtml(t('createTrip.vessel.modelLabel'))}</label>
                        <input type="text" id="vessel-model" placeholder="${escapeHtml(t('createTrip.vessel.modelPlaceholder'))}">
                    </div>
                    <div class="field">
                        <label for="vessel-year">${escapeHtml(t('createTrip.vessel.yearLabel'))}</label>
                        <input type="number" id="vessel-year" inputmode="numeric" step="1" placeholder="${escapeHtml(t('createTrip.vessel.yearPlaceholder'))}">
                    </div>
                </div>
                <div class="field-row">
                    <div class="field">
                        <label for="vessel-length">${escapeHtml(t('createTrip.vessel.lengthLabel'))}</label>
                        <input type="number" id="vessel-length" inputmode="decimal" step="0.01" min="0">
                    </div>
                    <div class="field">
                        <label for="vessel-width">${escapeHtml(t('createTrip.vessel.widthLabel'))}</label>
                        <input type="number" id="vessel-width" inputmode="decimal" step="0.01" min="0">
                    </div>
                    <div class="field">
                        <label for="vessel-draft">${escapeHtml(t('createTrip.vessel.draftLabel'))}</label>
                        <input type="number" id="vessel-draft" inputmode="decimal" step="0.01" min="0">
                    </div>
                </div>
                <div class="field">
                    <label for="vessel-notes">${escapeHtml(t('createTrip.vessel.notesLabel'))}</label>
                    <textarea id="vessel-notes" rows="3" placeholder="${escapeHtml(t('createTrip.vessel.notesPlaceholder'))}"></textarea>
                </div>
                <div class="field">
                    <label for="vessel-photo">${escapeHtml(t('createTrip.vessel.photoLabel'))}</label>
                    <input type="file" id="vessel-photo" accept="image/jpeg,image/png">
                    <small>${escapeHtml(t('createTrip.vessel.photoHint'))}</small>
                    <img id="vessel-photo-preview" alt="" hidden
                         style="margin-top: var(--space-2); width: 96px; height: 96px; border-radius: var(--radius-md); object-fit: cover;">
                </div>
                <button class="btn btn-secondary btn-sm" type="button" id="save-vessel-btn">${escapeHtml(t('createTrip.vessel.saveButton'))}</button>
            </div>`;

        document.getElementById('toggle-new-vessel').addEventListener('click', () => {
            const form = document.getElementById('new-vessel-form');
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('save-vessel-btn').addEventListener('click', () => this.handleAddVessel());

        const photoInput = document.getElementById('vessel-photo');
        photoInput.addEventListener('change', () => {
            const preview = document.getElementById('vessel-photo-preview');
            const file = photoInput.files[0];
            if (file) {
                preview.src = URL.createObjectURL(file);
                preview.hidden = false;
            } else {
                preview.hidden = true;
            }
        });
    },

    async handleAddVessel() {
        const alertBox = document.getElementById('create-trip-alert');
        const name = document.getElementById('vessel-name').value.trim();
        const mmsi = document.getElementById('vessel-mmsi').value.trim();
        const callSign = document.getElementById('vessel-callsign').value.trim();
        const model = document.getElementById('vessel-model').value.trim();
        const year = document.getElementById('vessel-year').value.trim();
        const length = document.getElementById('vessel-length').value.trim();
        const width = document.getElementById('vessel-width').value.trim();
        const draft = document.getElementById('vessel-draft').value.trim();
        const notes = document.getElementById('vessel-notes').value.trim();
        const photoFile = document.getElementById('vessel-photo').files[0] || null;

        const error = Validate.name(name)
            || Validate.vesselYear(year)
            || Validate.vesselDimension(length, t('createTrip.vessel.length'))
            || Validate.vesselDimension(width, t('createTrip.vessel.width'))
            || Validate.vesselDimension(draft, t('createTrip.vessel.draft'));
        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        const response = await apiRequest('/vessels', {
            method: 'POST',
            body: JSON.stringify({
                vessel_name: name,
                mmsi: mmsi || null,
                call_sign: callSign || null,
                model: model || null,
                year_built: year ? Number(year) : null,
                length_m: length ? Number(length) : null,
                width_m: width ? Number(width) : null,
                draft_m: draft ? Number(draft) : null,
                notes: notes || null
            })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('createTrip.vessel.saveFailed')))}</div>`;
            return;
        }

        let vessel = response.data;

        if (vessel.mmsi_notice?.already_registered_elsewhere) {
            showToast(t('createTrip.vessel.mmsiAlreadyRegistered'), 'info');
        }

        if (photoFile) {
            const formData = new FormData();
            formData.append('photo', photoFile);
            const photoResponse = await apiUpload(`/vessels/${vessel.id}/photo`, formData, 'PUT');
            if (!photoResponse.success) {
                const photoError = photoResponse.code ? t.error(photoResponse.code) : (photoResponse.error || t('createTrip.vessel.unknownError'));
                showToast(t('createTrip.vessel.photoUploadFailed', { error: photoError }), 'error');
            } else {
                vessel = { ...vessel, photo_path: true };
            }
        }

        this.state.vessels.push(vessel);
        this.renderVesselSection();
        document.getElementById('vessel-select').value = vessel.id;
        showToast(t('createTrip.vessel.added'), 'success');
    },

    renderRoutes() {
        Object.values(this.state.drawMaps).forEach((m) => m.destroy());
        this.state.drawMaps = {};

        const routesContainer = document.getElementById('routes-container');

        routesContainer.innerHTML = this.state.routes.map((route, i) => `
            <div class="route-item" data-index="${i}">
                <div class="route-item__title">
                    <span class="route-color-dot" style="background:${this.ROUTE_COLORS[i % this.ROUTE_COLORS.length]};"></span>
                    ${i === 0 ? escapeHtml(t('createTrip.routes.primary')) : escapeHtml(t('createTrip.routes.alternative', { index: i }))}
                    <div class="btn-group" style="margin-left:auto;">
                        <button class="btn btn-ghost btn-sm" type="button" data-move-up="${i}" ${i === 0 ? 'disabled' : ''} title="${escapeHtml(t('createTrip.routes.moveUp'))}">↑</button>
                        <button class="btn btn-ghost btn-sm" type="button" data-move-down="${i}" ${i === this.state.routes.length - 1 ? 'disabled' : ''} title="${escapeHtml(t('createTrip.routes.moveDown'))}">↓</button>
                        ${i > 0 ? `<button class="btn btn-ghost btn-sm" type="button" data-remove="${i}">${escapeHtml(t('common.remove'))}</button>` : ''}
                    </div>
                </div>
                <div class="route-mode-toggle btn-group">
                    <button type="button" class="btn btn-sm ${route.mode !== 'manual' ? 'btn-primary' : 'btn-ghost'}" data-mode="windy" data-index="${i}">${escapeHtml(t('createTrip.routes.modeWindy'))}</button>
                    <button type="button" class="btn btn-sm ${route.mode === 'manual' ? 'btn-primary' : 'btn-ghost'}" data-mode="manual" data-index="${i}">${escapeHtml(t('createTrip.routes.modeManual'))}</button>
                </div>
                ${route.mode === 'manual' ? `
                <div class="field">
                    <label>${escapeHtml(t('createTrip.routes.drawLabel'))}</label>
                    <small class="text-muted">${escapeHtml(t('createTrip.routes.drawHint'))}</small>
                    <div id="route-draw-map-${i}" class="map-container route-draw-map"></div>
                    <div class="route-draw-footer">
                        <span class="text-muted" style="font-size: var(--font-size-sm);"><span id="route-draw-count-${i}">${route.coordinates.length}</span> ${escapeHtml(t('createTrip.routes.points'))}</span>
                        <button class="btn btn-ghost btn-sm" type="button" data-clear-route="${i}">${escapeHtml(t('createTrip.routes.clear'))}</button>
                    </div>
                </div>` : `
                <div class="field">
                    <label>${escapeHtml(t('createTrip.routes.windyUrlLabel'))}</label>
                    <input type="url" class="route-windy-url" data-index="${i}" value="${escapeHtml(route.windyUrl)}"
                           placeholder="${escapeHtml(t('createTrip.routes.windyUrlPlaceholder'))}">
                </div>`}
                ${i > 0 ? `
                <div class="field">
                    <label>${escapeHtml(t('createTrip.routes.reasonLabel'))}</label>
                    <input type="text" class="route-reason" data-index="${i}" value="${escapeHtml(route.reason)}"
                           placeholder="${escapeHtml(t('createTrip.routes.reasonPlaceholder'))}">
                </div>` : ''}
            </div>
        `).join('');

        routesContainer.querySelectorAll('.route-windy-url').forEach((input) => {
            input.addEventListener('input', (e) => {
                this.state.routes[Number(e.target.dataset.index)].windyUrl = e.target.value;
                this.updateMapPreview();
            });
        });
        routesContainer.querySelectorAll('.route-reason').forEach((input) => {
            input.addEventListener('input', (e) => {
                this.state.routes[Number(e.target.dataset.index)].reason = e.target.value;
            });
        });
        routesContainer.querySelectorAll('[data-remove]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                this.state.routes.splice(Number(e.target.dataset.remove), 1);
                this.renderRoutes();
            });
        });
        routesContainer.querySelectorAll('[data-move-up]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const i = Number(e.target.dataset.moveUp);
                this.moveRoute(i, i - 1);
            });
        });
        routesContainer.querySelectorAll('[data-move-down]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const i = Number(e.target.dataset.moveDown);
                this.moveRoute(i, i + 1);
            });
        });
        routesContainer.querySelectorAll('[data-mode]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const i = Number(e.target.dataset.index);
                const mode = e.target.dataset.mode;
                if (this.state.routes[i].mode === mode) return;
                this.state.routes[i].mode = mode;
                this.renderRoutes();
            });
        });
        routesContainer.querySelectorAll('[data-clear-route]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const i = Number(e.target.dataset.clearRoute);
                this.state.routes[i].coordinates = [];
                this.state.drawMaps[i]?.clear();
                document.getElementById(`route-draw-count-${i}`).textContent = '0';
                this.updateMapPreview();
            });
        });

        this.state.routes.forEach((route, i) => {
            if (route.mode === 'manual') this.initDrawMap(i);
        });

        this.updateMapPreview();
    },

    initDrawMap(i) {
        const container = document.getElementById(`route-draw-map-${i}`);
        if (!container) return;
        const route = this.state.routes[i];

        this.state.drawMaps[i] = renderRouteDrawMap(container, {
            initialCoordinates: route.coordinates,
            color: this.ROUTE_COLORS[i % this.ROUTE_COLORS.length],
            onChange: (coords) => {
                route.coordinates = coords;
                const countEl = document.getElementById(`route-draw-count-${i}`);
                if (countEl) countEl.textContent = coords.length;
                this.updateMapPreview();
            }
        });
    },

    moveRoute(from, to) {
        if (to < 0 || to >= this.state.routes.length) return;
        const routes = this.state.routes;
        [routes[from], routes[to]] = [routes[to], routes[from]];
        // The reason field only applies to alternative routes - clear it for
        // whichever route just became primary (index 0)
        if (from === 0 || to === 0) {
            routes[0].reason = '';
        }
        this.renderRoutes();
    },

    updateMapPreview() {
        const mapEl = document.getElementById('route-map');
        if (this.state.map) {
            this.state.map.remove();
            this.state.map = null;
        }
        mapEl.innerHTML = '';

        const routes = this.state.routes
            .map((r, i) => {
                const coords = r.mode === 'manual' ? r.coordinates : parseWindyUrl(r.windyUrl);
                return (coords && coords.length > 1) ? { coordinates: coords, color: this.ROUTE_COLORS[i % this.ROUTE_COLORS.length] } : null;
            })
            .filter(Boolean);

        // With a single manually-drawn route, its own dedicated drawing map
        // (see initDrawMap) already shows it, so skip the combined overview
        // to avoid rendering the same route twice. Once there's more than
        // one route, though, this overview is how the skipper compares
        // primary vs. alternate routes side by side, so every route belongs
        // in it regardless of which input method produced it - hiding the
        // primary here just because an alternate route uses a different
        // input mode would make it look like the primary route vanished.
        const isSingleManualRoute = this.state.routes.length === 1 && this.state.routes[0].mode === 'manual';

        if (isSingleManualRoute || routes.length === 0) {
            mapEl.hidden = true;
            return;
        }
        mapEl.hidden = false;
        this.state.map = renderRouteMap(mapEl, routes);
    },

    async handleSubmit() {
        const alertBox = document.getElementById('create-trip-alert');
        const submitBtn = document.getElementById('create-trip-submit');
        alertBox.innerHTML = '';

        const vesselSelect = document.getElementById('vessel-select');
        const vesselId = vesselSelect ? Number(vesselSelect.value) : null;
        const departure = document.getElementById('departure').value;
        const arrival = document.getElementById('arrival').value;
        const gracePeriod = Number(document.getElementById('grace-period').value);

        if (!vesselId) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.vesselRequired'))}</div>`;
            return;
        }
        if (!departure || !arrival) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.datesRequired'))}</div>`;
            return;
        }
        if (toApiDatetime(arrival) <= toApiDatetime(departure)) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.arrivalBeforeDeparture'))}</div>`;
            return;
        }

        const primaryRoute = this.state.routes[0];
        if (primaryRoute.mode === 'manual') {
            if (primaryRoute.coordinates.length < 2) {
                alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.primaryRouteMinPoints'))}</div>`;
                return;
            }
        } else {
            const primaryUrlError = Validate.windyUrl(primaryRoute.windyUrl);
            if (primaryUrlError) {
                alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(primaryUrlError)}</div>`;
                return;
            }
        }

        const routes = this.state.routes
            .filter((r) => r.mode === 'manual' ? r.coordinates.length >= 2 : r.windyUrl.trim())
            .map((r) => r.mode === 'manual'
                ? { coordinates: r.coordinates, reason: r.reason.trim() || null }
                : { windy_url: r.windyUrl.trim(), reason: r.reason.trim() || null });

        const iceContactSelect = document.getElementById('ice-contact-select');
        const iceContactId = iceContactSelect && iceContactSelect.value ? Number(iceContactSelect.value) : null;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('createTrip.submitting'))}`;

        const response = await apiRequest('/trips', {
            method: 'POST',
            body: JSON.stringify({
                vessel_id: vesselId,
                ice_contact_id: iceContactId,
                departure_scheduled: toApiDatetime(departure),
                arrival_scheduled: toApiDatetime(arrival),
                grace_period_seconds: gracePeriod,
                routes
            })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('createTrip.errors.createFailed')))}</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = t('createTrip.submit');
            return;
        }

        if (response.data.schedule_notice?.conflicting_trip_exists) {
            showToast(t('createTrip.scheduleConflictNotice'), 'info');
        }

        showToast(t('createTrip.created'), 'success');
        location.hash = `#/trips/${response.data.trip_id}`;
    }
};
