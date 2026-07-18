const CreateTripPage = {
    ROUTE_COLORS: ['#1e88a8', '#a06600', '#b3261e', '#1a7f4e'],

    state: {
        vessels: [],
        iceContacts: [],
        savedRoutes: [],
        routes: [{ mode: 'windy', windyUrl: '', reason: '', coordinates: [], saveToArchive: false, saveName: '' }],
        map: null,
        drawMaps: {}
    },

    async render(container) {
        this.state.routes = [{ mode: 'windy', windyUrl: '', reason: '', coordinates: [], saveToArchive: false, saveName: '' }];
        this.state.map = null;
        Object.values(this.state.drawMaps).forEach((m) => m.destroy());
        this.state.drawMaps = {};

        container.innerHTML = `
            <div class="page page--narrow" style="max-width: 640px;">
                <div class="page-header">
                    <h1>${escapeHtml(t('createTrip.title'))}</h1>
                </div>
                <div id="create-trip-alert"></div>

                <div id="pending-crew-card"></div>

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
                    <div class="field">
                        <label for="departure">${escapeHtml(t('createTrip.schedule.departureLabel'))}</label>
                        <input type="datetime-local" id="departure" required>
                    </div>
                    <div class="field">
                        <label>${escapeHtml(t('createTrip.schedule.durationLabel'))}</label>
                        <div class="field-row">
                            <div class="field">
                                <input type="number" id="duration-days" min="0" step="1" value="0" aria-label="${escapeHtml(t('createTrip.schedule.durationDays'))}">
                                <small>${escapeHtml(t('createTrip.schedule.durationDays'))}</small>
                            </div>
                            <div class="field">
                                <input type="number" id="duration-hours" min="0" max="23" step="1" value="0" aria-label="${escapeHtml(t('createTrip.schedule.durationHours'))}">
                                <small>${escapeHtml(t('createTrip.schedule.durationHours'))}</small>
                            </div>
                            <div class="field">
                                <input type="number" id="duration-minutes" min="0" max="59" step="1" value="0" aria-label="${escapeHtml(t('createTrip.schedule.durationMinutes'))}">
                                <small>${escapeHtml(t('createTrip.schedule.durationMinutes'))}</small>
                            </div>
                        </div>
                        <small id="arrival-preview" class="text-muted"></small>
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
                        <div class="btn-group">
                            <button class="btn btn-secondary btn-sm" type="button" id="add-route-btn">${escapeHtml(t('createTrip.routes.addAlternative'))}</button>
                            <div id="saved-route-picker"></div>
                        </div>
                    </div>
                    <div id="routes-container"></div>
                    <div id="route-map" class="map-container"></div>
                    <p class="text-muted" style="margin-bottom:0;">${escapeHtml(t('createTrip.routes.crewNextStepHint'))}</p>
                </div>

                <div class="btn-group">
                    <a class="btn btn-ghost" href="#/dashboard">${escapeHtml(t('common.cancel'))}</a>
                    <button class="btn btn-primary" type="button" id="create-trip-submit">${escapeHtml(t('createTrip.submit'))}</button>
                </div>
            </div>`;

        document.getElementById('add-route-btn').addEventListener('click', () => {
            this.state.routes.push({ mode: 'windy', windyUrl: '', reason: '', coordinates: [], saveToArchive: false, saveName: '' });
            this.renderRoutes();
        });
        document.getElementById('create-trip-submit').addEventListener('click', () => this.handleSubmit());

        ['departure', 'duration-days', 'duration-hours', 'duration-minutes'].forEach((id) => {
            document.getElementById(id).addEventListener('input', () => this.updateArrivalPreview());
        });

        this.renderPendingCrewCard();
        this.renderRoutes();
        await Promise.all([this.loadVessels(), this.loadIceContacts(), this.loadSavedRoutes()]);
    },

    // Shows the address book selection carried over from the "Invite to
    // trip" bulk action (crew-address-book.js) - these people are invited
    // automatically once this trip is created (see handleSubmit).
    renderPendingCrewCard() {
        const card = document.getElementById('pending-crew-card');
        const pending = PendingCrewInvites.get();

        if (pending.length === 0) {
            card.innerHTML = '';
            return;
        }

        card.innerHTML = `
            <div class="card">
                <h3>${escapeHtml(t('createTrip.pendingCrew.heading'))}</h3>
                <p class="text-muted" style="margin-top:0;">${escapeHtml(t('createTrip.pendingCrew.hint'))}</p>
                <div class="crew-list">
                    ${pending.map((entry) => `
                        <div class="crew-row">
                            <div class="crew-row__info">
                                <span class="crew-row__name">${escapeHtml(entry.name || entry.email)}</span>
                                ${entry.name ? `<span class="crew-row__detail">${escapeHtml(entry.email)}</span>` : ''}
                            </div>
                            <button class="btn btn-ghost btn-sm" type="button" data-remove-pending-crew="${escapeHtml(entry.email)}" aria-label="${escapeHtml(t('createTrip.pendingCrew.removeAria', { name: entry.name || entry.email }))}">${escapeHtml(t('common.remove'))}</button>
                        </div>`).join('')}
                </div>
            </div>`;

        card.querySelectorAll('[data-remove-pending-crew]').forEach((btn) => {
            btn.addEventListener('click', () => {
                PendingCrewInvites.remove(btn.dataset.removePendingCrew);
                this.renderPendingCrewCard();
            });
        });
    },

    async loadSavedRoutes() {
        const response = await apiRequest('/saved-routes');
        if (response.success) {
            this.state.savedRoutes = response.data || [];
        }
        this.renderSavedRoutePicker();
    },

    renderSavedRoutePicker() {
        const picker = document.getElementById('saved-route-picker');
        if (!picker) return;

        if (this.state.savedRoutes.length === 0) {
            picker.innerHTML = '';
            return;
        }

        picker.innerHTML = `
            <select class="btn btn-secondary btn-sm" id="add-saved-route-select">
                <option value="">${escapeHtml(t('createTrip.routes.addSavedRoute'))}</option>
                ${this.state.savedRoutes.map((r) => `<option value="${r.id}">${escapeHtml(r.name)}</option>`).join('')}
            </select>`;

        document.getElementById('add-saved-route-select').addEventListener('change', (e) => {
            const savedRouteId = Number(e.target.value);
            e.target.value = '';
            if (!savedRouteId) return;
            this.addSavedRouteToTrip(savedRouteId);
        });
    },

    addSavedRouteToTrip(savedRouteId) {
        const saved = this.state.savedRoutes.find((r) => r.id === savedRouteId);
        if (!saved) return;

        const newRoute = saved.raw_windy_url
            ? { mode: 'windy', windyUrl: saved.raw_windy_url, reason: '', coordinates: [], saveToArchive: false, saveName: '' }
            : { mode: 'manual', windyUrl: '', reason: '', coordinates: parseWktLineString(saved.geometry_wkt), saveToArchive: false, saveName: '' };

        // If the primary route slot (index 0) is still the untouched blank
        // placeholder, fill it directly instead of appending as an
        // "alternative" - otherwise importing a saved route as the only
        // route leaves the primary slot empty and blocks save.
        const primary = this.state.routes[0];
        const primaryIsBlank = primary && !primary.windyUrl.trim() && primary.coordinates.length === 0;
        if (primaryIsBlank) {
            this.state.routes[0] = newRoute;
        } else {
            this.state.routes.push(newRoute);
        }

        this.renderRoutes();
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

        // A deactivated contact (issue #268 - the linked account was deleted)
        // can no longer be picked; keep it out of the selectable list.
        const selectable = this.state.iceContacts.filter((c) => !c.deactivated_at);

        section.innerHTML = `
            ${selectable.length > 0 ? `
                <div class="field">
                    <label for="ice-contact-select">${escapeHtml(t('createTrip.iceContact.selectLabel'))}</label>
                    <select id="ice-contact-select">
                        ${selectable.map((c) => `<option value="${c.id}" data-confirmed="${c.confirmed_at ? '1' : '0'}">${escapeHtml(c.name)}${c.relationship ? ` (${escapeHtml(c.relationship)})` : ''}${!c.confirmed_at ? ` — ${escapeHtml(t('iceContacts.pending'))}` : ''}</option>`).join('')}
                    </select>
                    <small>${escapeHtml(t('createTrip.iceContact.selectHint'))}</small>
                    <div id="ice-contact-pending-warning" class="alert alert-info" style="display:none; margin-top: var(--space-2);">${escapeHtml(t('createTrip.iceContact.pendingWarning'))}</div>
                </div>` : `<div class="alert alert-info">${escapeHtml(t('createTrip.iceContact.noneRegistered'))}</div>`}
            <button class="btn btn-ghost btn-sm" type="button" id="toggle-new-ice-contact">${escapeHtml(t('createTrip.iceContact.addNew'))}</button>
            <div id="new-ice-contact-form" style="display:${selectable.length > 0 ? 'none' : 'block'}; margin-top: var(--space-3);">
                <div class="field-row">
                    <div class="field">
                        <label for="ice-contact-name">${escapeHtml(t('common.name'))}</label>
                        <input type="text" id="ice-contact-name" autocomplete="name">
                    </div>
                    <div class="field">
                        <label for="ice-contact-relationship">${escapeHtml(t('iceContacts.relationshipLabel'))}</label>
                        <input type="text" id="ice-contact-relationship" placeholder="${escapeHtml(t('iceContacts.relationshipPlaceholder'))}">
                    </div>
                </div>
                <div class="field-row">
                    <div class="field">
                        <label for="ice-contact-email">${escapeHtml(t('common.email'))}</label>
                        <input type="email" id="ice-contact-email" autocomplete="email">
                    </div>
                    <div class="field">
                        <label for="ice-contact-phone">${escapeHtml(t('common.phone'))}</label>
                        <input type="tel" id="ice-contact-phone" placeholder="${escapeHtml(t('iceContacts.phonePlaceholder'))}">
                    </div>
                </div>
                <button class="btn btn-secondary btn-sm" type="button" id="save-ice-contact-btn">${escapeHtml(t('createTrip.iceContact.saveButton'))}</button>
            </div>`;

        document.getElementById('toggle-new-ice-contact').addEventListener('click', () => {
            const form = document.getElementById('new-ice-contact-form');
            form.style.display = form.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('save-ice-contact-btn').addEventListener('click', () => this.handleAddIceContact());

        const select = document.getElementById('ice-contact-select');
        if (select) {
            const updatePendingWarning = () => {
                const selected = select.options[select.selectedIndex];
                const warning = document.getElementById('ice-contact-pending-warning');
                warning.style.display = selected && selected.dataset.confirmed === '0' ? 'block' : 'none';
            };
            select.addEventListener('change', updatePendingWarning);
            updatePendingWarning();
        }
    },

    async handleAddIceContact() {
        const alertBox = document.getElementById('create-trip-alert');
        const name = document.getElementById('ice-contact-name').value.trim();
        const relationship = document.getElementById('ice-contact-relationship').value.trim();
        const email = document.getElementById('ice-contact-email').value.trim();
        const phone = document.getElementById('ice-contact-phone').value.trim();

        const error = Validate.name(name)
            || (!relationship ? t('iceContacts.relationshipRequired') : null)
            || (relationship.length > 50 ? t('iceContacts.relationshipTooLong') : null)
            || Validate.email(email)
            || Validate.phone(phone);
        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        const response = await apiRequest('/ice-contacts', {
            method: 'POST',
            body: JSON.stringify({ name, relationship, email, phone })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('iceContacts.saveFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        invalidateNavVisibility('iceContacts');

        const contact = response.data;
        this.state.iceContacts.push(contact);
        this.renderIceContactSection();
        document.getElementById('ice-contact-select').value = contact.id;

        showToast(response.data.confirmation_sent ? t('createTrip.iceContact.added') : t('createTrip.iceContact.addedEmailFailed'), response.data.confirmation_sent ? 'success' : 'info');
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
                        <label for="vessel-color">${escapeHtml(t('createTrip.vessel.colorLabel'))}</label>
                        <input type="text" id="vessel-color" placeholder="${escapeHtml(t('createTrip.vessel.colorPlaceholder'))}">
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
                    <label>${escapeHtml(t('createTrip.vessel.equipmentLabel'))}</label>
                    <div class="checkbox-field">
                        <input type="checkbox" id="vessel-eq-flares">
                        <label for="vessel-eq-flares">${escapeHtml(t('common.vesselEquipment.flares'))}</label>
                    </div>
                    <div class="checkbox-field">
                        <input type="checkbox" id="vessel-eq-epirb">
                        <label for="vessel-eq-epirb">${escapeHtml(t('common.vesselEquipment.epirb'))}</label>
                    </div>
                    <small>${escapeHtml(t('createTrip.vessel.epirbHint'))}</small>
                    <div class="checkbox-field">
                        <input type="checkbox" id="vessel-eq-vhf">
                        <label for="vessel-eq-vhf">${escapeHtml(t('common.vesselEquipment.vhf'))}</label>
                    </div>
                    <div class="checkbox-field">
                        <input type="checkbox" id="vessel-eq-satphone">
                        <label for="vessel-eq-satphone">${escapeHtml(t('common.vesselEquipment.satellitePhone'))}</label>
                    </div>
                    <div class="checkbox-field">
                        <input type="checkbox" id="vessel-eq-liferaft">
                        <label for="vessel-eq-liferaft">${escapeHtml(t('common.vesselEquipment.liferaft'))}</label>
                    </div>
                </div>
                <div class="field">
                    <label for="vessel-emergency-beacon">${escapeHtml(t('createTrip.vessel.emergencyBeaconLabel'))}</label>
                    <input type="text" id="vessel-emergency-beacon" placeholder="${escapeHtml(t('createTrip.vessel.emergencyBeaconPlaceholder'))}">
                    <small>${escapeHtml(t('createTrip.vessel.emergencyBeaconHint'))}</small>
                </div>
                <div class="field">
                    <label for="vessel-photo">${escapeHtml(t('createTrip.vessel.photoLabel'))}</label>
                    <input type="file" id="vessel-photo" accept="image/jpeg,image/png">
                    <small>${escapeHtml(t('createTrip.vessel.photoHint'))}</small>
                    <img id="vessel-photo-preview" class="lightbox-trigger" alt="" hidden
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
                bindLightboxImages(document);
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
        const color = document.getElementById('vessel-color').value.trim();
        const year = document.getElementById('vessel-year').value.trim();
        const length = document.getElementById('vessel-length').value.trim();
        const width = document.getElementById('vessel-width').value.trim();
        const draft = document.getElementById('vessel-draft').value.trim();
        const notes = document.getElementById('vessel-notes').value.trim();
        const hasFlares = document.getElementById('vessel-eq-flares').checked;
        const hasEpirb = document.getElementById('vessel-eq-epirb').checked;
        const hasVhf = document.getElementById('vessel-eq-vhf').checked;
        const hasSatellitePhone = document.getElementById('vessel-eq-satphone').checked;
        const hasLiferaft = document.getElementById('vessel-eq-liferaft').checked;
        const emergencyBeacon = document.getElementById('vessel-emergency-beacon').value.trim();
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
                color: color || null,
                year_built: year ? Number(year) : null,
                length_m: length ? Number(length) : null,
                width_m: width ? Number(width) : null,
                draft_m: draft ? Number(draft) : null,
                notes: notes || null,
                has_flares: hasFlares,
                has_epirb: hasEpirb,
                has_vhf: hasVhf,
                has_satellite_phone: hasSatellitePhone,
                has_liferaft: hasLiferaft,
                emergency_beacon: emergencyBeacon || null
            })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('createTrip.vessel.saveFailed')))}</div>`;
            return;
        }

        let vessel = response.data;

        invalidateNavVisibility('myVessels');

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
                    <button type="button" class="btn btn-sm ${route.mode === 'windy' ? 'btn-primary' : 'btn-ghost'}" data-mode="windy" data-index="${i}">${escapeHtml(t('createTrip.routes.modeWindy'))}</button>
                    <button type="button" class="btn btn-sm ${route.mode === 'manual' ? 'btn-primary' : 'btn-ghost'}" data-mode="manual" data-index="${i}">${escapeHtml(t('createTrip.routes.modeManual'))}</button>
                    <button type="button" class="btn btn-sm ${route.mode === 'gpx' ? 'btn-primary' : 'btn-ghost'}" data-mode="gpx" data-index="${i}">${escapeHtml(t('createTrip.routes.modeGpx'))}</button>
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
                </div>` : route.mode === 'gpx' ? `
                <div class="field">
                    <label>${escapeHtml(t('createTrip.routes.gpxLabel'))}</label>
                    <small class="text-muted">${escapeHtml(t('createTrip.routes.gpxHint'))}</small>
                    <input type="file" class="route-gpx-file" data-index="${i}" accept=".gpx,application/gpx+xml">
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
                <div class="checkbox-field">
                    <input type="checkbox" id="route-save-toggle-${i}" data-save-toggle="${i}" ${route.saveToArchive ? 'checked' : ''}>
                    <label for="route-save-toggle-${i}">${escapeHtml(t('createTrip.routes.saveToArchive'))}</label>
                </div>
                <div class="field" id="route-save-form-${i}" ${route.saveToArchive ? '' : 'hidden'}>
                    <input type="text" id="route-save-name-${i}" data-index="${i}" value="${escapeHtml(route.saveName)}" placeholder="${escapeHtml(t('createTrip.routes.saveRouteNamePlaceholder'))}">
                </div>
            </div>
        `).join('');

        routesContainer.querySelectorAll('.route-windy-url').forEach((input) => {
            input.addEventListener('input', (e) => {
                this.state.routes[Number(e.target.dataset.index)].windyUrl = e.target.value;
                this.updateMapPreview();
            });
        });
        routesContainer.querySelectorAll('.route-gpx-file').forEach((input) => {
            input.addEventListener('change', (e) => this.handleGpxFileSelected(Number(e.target.dataset.index), e.target));
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
        routesContainer.querySelectorAll('[data-save-toggle]').forEach((checkbox) => {
            checkbox.addEventListener('change', (e) => {
                const i = Number(e.target.dataset.saveToggle);
                this.state.routes[i].saveToArchive = e.target.checked;
                const form = document.getElementById(`route-save-form-${i}`);
                form.hidden = !e.target.checked;
                if (e.target.checked) document.getElementById(`route-save-name-${i}`).focus();
            });
        });
        routesContainer.querySelectorAll('[id^="route-save-name-"]').forEach((input) => {
            input.addEventListener('input', (e) => {
                this.state.routes[Number(e.target.dataset.index)].saveName = e.target.value;
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

    async archiveRoute(route) {
        const body = (route.mode === 'manual' || route.mode === 'gpx')
            ? { name: route.saveName.trim(), coordinates: route.coordinates }
            : { name: route.saveName.trim(), windy_url: route.windyUrl.trim() };

        const response = await apiRequest('/saved-routes', { method: 'POST', body: JSON.stringify(body) });
        if (response.success) invalidateNavVisibility('savedRoutes');
        return response.success;
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

    async handleGpxFileSelected(i, inputEl) {
        const alertBox = document.getElementById('create-trip-alert');
        const file = inputEl.files[0];
        inputEl.value = ''; // the file is only read in-memory; discard it once we've extracted its coordinates
        if (!file) return;

        const coords = parseGpxFile(await file.text());
        if (!coords) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.gpxParseError'))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        this.state.routes[i].coordinates = coords;
        const countEl = document.getElementById(`route-draw-count-${i}`);
        if (countEl) countEl.textContent = coords.length;
        this.updateMapPreview();
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
                const coords = (r.mode === 'manual' || r.mode === 'gpx') ? r.coordinates : parseWindyUrl(r.windyUrl);
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

    // Live "estimated arrival" preview - the skipper only enters departure +
    // duration, so this is the only place arrival is ever shown before the
    // trip is created (the API computes and stores the real value).
    updateArrivalPreview() {
        const preview = document.getElementById('arrival-preview');
        if (!preview) return;

        const departureIso = toApiDatetime(document.getElementById('departure').value);
        const seconds = durationToSeconds({
            days: document.getElementById('duration-days').value,
            hours: document.getElementById('duration-hours').value,
            minutes: document.getElementById('duration-minutes').value
        });

        if (!departureIso || seconds <= 0) {
            preview.textContent = '';
            return;
        }

        const arrivalIso = addDurationSeconds(departureIso, seconds);
        preview.textContent = t('createTrip.schedule.estimatedArrival', { datetime: formatDateTime(arrivalIso) });
    },

    async handleSubmit() {
        const alertBox = document.getElementById('create-trip-alert');
        const submitBtn = document.getElementById('create-trip-submit');
        alertBox.innerHTML = '';

        const vesselSelect = document.getElementById('vessel-select');
        const vesselId = vesselSelect ? Number(vesselSelect.value) : null;
        const departure = document.getElementById('departure').value;
        const durationSeconds = durationToSeconds({
            days: document.getElementById('duration-days').value,
            hours: document.getElementById('duration-hours').value,
            minutes: document.getElementById('duration-minutes').value
        });
        const gracePeriod = Number(document.getElementById('grace-period').value);

        if (!vesselId) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.vesselRequired'))}</div>`;
            return;
        }
        if (!departure) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.datesRequired'))}</div>`;
            return;
        }
        if (durationSeconds <= 0) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.durationRequired'))}</div>`;
            return;
        }

        const primaryRoute = this.state.routes[0];
        if (primaryRoute.mode === 'manual' || primaryRoute.mode === 'gpx') {
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

        const routesToArchive = this.state.routes.filter((r) => r.saveToArchive);
        for (const route of routesToArchive) {
            if (!route.saveName.trim()) {
                alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.routes.saveRouteNameRequired'))}</div>`;
                return;
            }
            if (route.mode === 'manual' || route.mode === 'gpx') {
                if (route.coordinates.length < 2) {
                    alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.primaryRouteMinPoints'))}</div>`;
                    return;
                }
            } else {
                const urlError = Validate.windyUrl(route.windyUrl);
                if (urlError) {
                    alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(urlError)}</div>`;
                    return;
                }
            }
        }

        const routes = this.state.routes
            .filter((r) => (r.mode === 'manual' || r.mode === 'gpx') ? r.coordinates.length >= 2 : r.windyUrl.trim())
            .map((r) => (r.mode === 'manual' || r.mode === 'gpx')
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
                duration_seconds: durationSeconds,
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

        if (routesToArchive.length > 0) {
            const results = await Promise.all(routesToArchive.map((route) => this.archiveRoute(route)));
            const failures = results.filter((ok) => !ok).length;
            if (failures > 0) showToast(t('createTrip.routes.saveRouteFailed'), 'error');
            if (failures < routesToArchive.length) showToast(t('createTrip.routes.saveRouteSuccess'), 'success');
        }

        await this.invitePendingCrew(response.data.trip_id);

        showToast(t('createTrip.created'), 'success');
        location.hash = `#/trips/${response.data.trip_id}`;
    },

    // Invites everyone carried over via the address book's "Invite to trip"
    // bulk action (see PendingCrewInvites / renderPendingCrewCard above) now
    // that the trip they were staged for actually exists.
    async invitePendingCrew(tripId) {
        const pending = PendingCrewInvites.get();
        if (pending.length === 0) return;

        PendingCrewInvites.clear();

        const results = await Promise.all(pending.map((entry) =>
            apiRequest(`/trips/${tripId}/crew`, {
                method: 'POST',
                body: JSON.stringify({ email: entry.email, name: entry.name || undefined })
            })));

        const succeeded = results.filter((r) => r.success).length;

        if (succeeded === 0) {
            showToast(t('createTrip.crewInviteFailed'), 'error');
        } else if (succeeded < pending.length) {
            showToast(t('createTrip.crewInvitePartial', { success: succeeded, total: pending.length }), 'info');
        } else {
            showToast(t('createTrip.crewInvited', { count: succeeded }), 'success');
        }
    }
};
