const VesselsPage = {
    state: {
        vessels: [],
        editingId: null,
        photoFile: null
    },

    async render(container) {
        this.state.editingId = null;
        this.state.photoFile = null;

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('vessels.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('vessels.subtitle'))}</div>
                    </div>
                    <button class="btn btn-primary" type="button" id="vessel-add-toggle">${escapeHtml(t('vessels.form.addTitle'))}</button>
                </div>
                <div class="card" id="vessel-form-card" hidden>
                    <div class="card-header">
                        <h2 id="vessel-form-title">${escapeHtml(t('vessels.form.addTitle'))}</h2>
                        <button class="btn btn-ghost btn-sm" type="button" id="vessel-cancel" hidden>${escapeHtml(t('vessels.form.cancelEdit'))}</button>
                    </div>
                    <div id="vessel-alert"></div>
                    <form id="vessel-form" novalidate>
                        <div class="field-row">
                            <div class="field">
                                <label for="vessel-name">${escapeHtml(t('vessels.form.nameLabel'))}</label>
                                <input type="text" id="vessel-name" placeholder="${escapeHtml(t('vessels.form.namePlaceholder'))}">
                            </div>
                            <div class="field">
                                <label for="vessel-mmsi">${escapeHtml(t('vessels.form.mmsiLabel'))}</label>
                                <input type="text" id="vessel-mmsi">
                            </div>
                        </div>
                        <div class="field">
                            <label for="vessel-callsign">${escapeHtml(t('vessels.form.callSignLabel'))}</label>
                            <input type="text" id="vessel-callsign">
                        </div>
                        <div class="field-row">
                            <div class="field">
                                <label for="vessel-model">${escapeHtml(t('vessels.form.modelLabel'))}</label>
                                <input type="text" id="vessel-model" placeholder="${escapeHtml(t('vessels.form.modelPlaceholder'))}">
                            </div>
                            <div class="field">
                                <label for="vessel-color">${escapeHtml(t('vessels.form.colorLabel'))}</label>
                                <input type="text" id="vessel-color" placeholder="${escapeHtml(t('vessels.form.colorPlaceholder'))}">
                            </div>
                            <div class="field">
                                <label for="vessel-year">${escapeHtml(t('vessels.form.yearLabel'))}</label>
                                <input type="number" id="vessel-year" inputmode="numeric" step="1" placeholder="${escapeHtml(t('vessels.form.yearPlaceholder'))}">
                            </div>
                        </div>
                        <div class="field-row">
                            <div class="field">
                                <label for="vessel-length">${escapeHtml(t('vessels.form.lengthLabel'))}</label>
                                <input type="number" id="vessel-length" inputmode="decimal" step="0.01" min="0">
                            </div>
                            <div class="field">
                                <label for="vessel-width">${escapeHtml(t('vessels.form.widthLabel'))}</label>
                                <input type="number" id="vessel-width" inputmode="decimal" step="0.01" min="0">
                            </div>
                            <div class="field">
                                <label for="vessel-draft">${escapeHtml(t('vessels.form.draftLabel'))}</label>
                                <input type="number" id="vessel-draft" inputmode="decimal" step="0.01" min="0">
                            </div>
                        </div>
                        <div class="field">
                            <label for="vessel-notes">${escapeHtml(t('vessels.form.notesLabel'))}</label>
                            <textarea id="vessel-notes" rows="3" placeholder="${escapeHtml(t('vessels.form.notesPlaceholder'))}"></textarea>
                        </div>
                        <div class="field">
                            <label>${escapeHtml(t('vessels.form.equipmentLabel'))}</label>
                            <div class="checkbox-field">
                                <input type="checkbox" id="vessel-eq-flares">
                                <label for="vessel-eq-flares">${escapeHtml(t('common.vesselEquipment.flares'))}</label>
                            </div>
                            <div class="checkbox-field">
                                <input type="checkbox" id="vessel-eq-epirb">
                                <label for="vessel-eq-epirb">${escapeHtml(t('common.vesselEquipment.epirb'))}</label>
                            </div>
                            <small>${escapeHtml(t('vessels.form.epirbHint'))}</small>
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
                            <label for="vessel-emergency-beacon">${escapeHtml(t('vessels.form.emergencyBeaconLabel'))}</label>
                            <input type="text" id="vessel-emergency-beacon" placeholder="${escapeHtml(t('vessels.form.emergencyBeaconPlaceholder'))}">
                            <small>${escapeHtml(t('vessels.form.emergencyBeaconHint'))}</small>
                        </div>
                        <div class="field">
                            <label for="vessel-photo">${escapeHtml(t('vessels.form.photoLabel'))}</label>
                            <input type="file" id="vessel-photo" accept="image/jpeg,image/png">
                            <small>${escapeHtml(t('vessels.form.photoHint'))}</small>
                            <img id="vessel-photo-preview" alt="" hidden
                                 style="margin-top: var(--space-2); width: 96px; height: 96px; border-radius: var(--radius-md); object-fit: cover;">
                        </div>
                        <button class="btn btn-primary" type="submit" id="vessel-submit">${escapeHtml(t('vessels.form.submit'))}</button>
                    </form>
                </div>
                <div id="vessel-list-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('vessels.loadingVessels'))}</div></div>
            </div>`;

        document.getElementById('vessel-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        document.getElementById('vessel-cancel').addEventListener('click', () => this.resetForm());
        document.getElementById('vessel-add-toggle').addEventListener('click', () => {
            if (document.getElementById('vessel-form-card').hidden) {
                this.openForm();
            } else {
                this.resetForm();
            }
        });

        const photoInput = document.getElementById('vessel-photo');
        photoInput.addEventListener('change', () => {
            const preview = document.getElementById('vessel-photo-preview');
            const file = photoInput.files[0];
            this.state.photoFile = file || null;
            if (file) {
                preview.src = URL.createObjectURL(file);
                preview.hidden = false;
            } else {
                preview.hidden = true;
            }
        });

        await this.loadVessels();
    },

    async loadVessels() {
        const listContainer = document.getElementById('vessel-list-container');
        const response = await apiRequest('/vessels');

        if (!response.success) {
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('vessels.loadFailed')))}</div>`;
            return;
        }

        this.state.vessels = response.data || [];

        if (this.state.vessels.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>${escapeHtml(t('vessels.emptyTitle'))}</h3>
                    <p>${escapeHtml(t('vessels.emptyBody'))}</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = `<div class="trip-list">${this.state.vessels.map((v) => this.renderVesselCard(v)).join('')}</div>`;

        listContainer.querySelectorAll('[data-edit]').forEach((btn) => {
            btn.addEventListener('click', () => this.startEdit(Number(btn.dataset.edit)));
        });
        listContainer.querySelectorAll('[data-delete]').forEach((btn) => {
            btn.addEventListener('click', () => this.handleDelete(Number(btn.dataset.delete)));
        });

        this.state.vessels.filter((v) => v.photo_path).forEach((v) => this.loadVesselThumbnail(v.id));
    },

    renderVesselCard(vessel) {
        const dims = [
            vessel.length_m ? `L ${Number(vessel.length_m)} m` : '',
            vessel.width_m ? `B ${Number(vessel.width_m)} m` : '',
            vessel.draft_m ? `D ${Number(vessel.draft_m)} m` : ''
        ].filter(Boolean).join(' × ');

        return `
            <div class="trip-card">
                ${vessel.photo_path ? `<img id="vessel-thumb-${vessel.id}" alt="" hidden
                    style="width:56px;height:56px;border-radius:var(--radius-md);object-fit:cover;">` : ''}
                <div class="stack" style="flex:1; gap: 0.35rem;">
                    <div class="trip-card__top">
                        <span class="trip-card__title">${escapeHtml(vessel.vessel_name)}</span>
                    </div>
                    <div class="trip-card__meta">
                        ${vessel.model ? `<span>${escapeHtml(vessel.model)}</span>` : ''}
                        ${vessel.color ? `<span>${escapeHtml(vessel.color)}</span>` : ''}
                        ${vessel.year_built ? `<span>${escapeHtml(t('vessels.card.yearBuilt', { year: vessel.year_built }))}</span>` : ''}
                        ${dims ? `<span>${escapeHtml(dims)}</span>` : ''}
                        ${vessel.mmsi ? `<span>${escapeHtml(t('vessels.card.mmsi', { mmsi: vessel.mmsi }))}</span>` : ''}
                        ${vessel.call_sign ? `<span>${escapeHtml(t('vessels.card.callSign', { callSign: vessel.call_sign }))}</span>` : ''}
                    </div>
                    ${vessel.notes ? `<div class="trip-card__meta" style="white-space:pre-wrap;">${escapeHtml(vessel.notes)}</div>` : ''}
                    ${formatVesselEquipment(vessel) ? `<div class="trip-card__meta">${escapeHtml(t('vessels.card.equipment', { value: formatVesselEquipment(vessel) }))}</div>` : ''}
                    ${vessel.emergency_beacon ? `<div class="trip-card__meta" style="white-space:pre-wrap;">${escapeHtml(t('vessels.card.emergencyBeacon', { value: vessel.emergency_beacon }))}</div>` : ''}
                </div>
                <div class="trip-card__actions">
                    <button class="btn btn-secondary btn-sm" type="button" data-edit="${vessel.id}">${escapeHtml(t('vessels.card.editButton'))}</button>
                    <button class="btn btn-ghost btn-sm" type="button" data-delete="${vessel.id}">${escapeHtml(t('common.remove'))}</button>
                </div>
            </div>`;
    },

    // Photos are auth-protected, so a plain <img src> won't do (no way to
    // attach the Authorization header) - fetch as blob and swap in
    async loadVesselThumbnail(vesselId) {
        const img = document.getElementById(`vessel-thumb-${vesselId}`);
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

    openForm() {
        document.getElementById('vessel-form-card').hidden = false;
        document.getElementById('vessel-add-toggle').textContent = t('common.close');
        document.getElementById('vessel-name').focus();
    },

    startEdit(vesselId) {
        const vessel = this.state.vessels.find((v) => v.id === vesselId);
        if (!vessel) return;

        this.state.editingId = vesselId;
        this.state.photoFile = null;
        document.getElementById('vessel-form-card').hidden = false;
        document.getElementById('vessel-add-toggle').textContent = t('common.close');
        document.getElementById('vessel-form-title').textContent = t('vessels.form.editTitle', { name: vessel.vessel_name });
        document.getElementById('vessel-name').value = vessel.vessel_name || '';
        document.getElementById('vessel-mmsi').value = vessel.mmsi || '';
        document.getElementById('vessel-callsign').value = vessel.call_sign || '';
        document.getElementById('vessel-model').value = vessel.model || '';
        document.getElementById('vessel-color').value = vessel.color || '';
        document.getElementById('vessel-year').value = vessel.year_built ?? '';
        document.getElementById('vessel-length').value = vessel.length_m ?? '';
        document.getElementById('vessel-width').value = vessel.width_m ?? '';
        document.getElementById('vessel-draft').value = vessel.draft_m ?? '';
        document.getElementById('vessel-notes').value = vessel.notes || '';
        document.getElementById('vessel-eq-flares').checked = !!vessel.has_flares;
        document.getElementById('vessel-eq-epirb').checked = !!vessel.has_epirb;
        document.getElementById('vessel-eq-vhf').checked = !!vessel.has_vhf;
        document.getElementById('vessel-eq-satphone').checked = !!vessel.has_satellite_phone;
        document.getElementById('vessel-eq-liferaft').checked = !!vessel.has_liferaft;
        document.getElementById('vessel-emergency-beacon').value = vessel.emergency_beacon || '';
        document.getElementById('vessel-photo').value = '';
        const preview = document.getElementById('vessel-photo-preview');
        preview.hidden = true;
        document.getElementById('vessel-submit').textContent = t('vessels.form.submitEdit');
        document.getElementById('vessel-cancel').hidden = false;
        document.getElementById('vessel-alert').innerHTML = '';
        document.getElementById('vessel-name').focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    resetForm(keepAlert = false) {
        this.state.editingId = null;
        this.state.photoFile = null;
        document.getElementById('vessel-form').reset();
        document.getElementById('vessel-photo-preview').hidden = true;
        document.getElementById('vessel-form-title').textContent = t('vessels.form.addTitle');
        document.getElementById('vessel-submit').textContent = t('vessels.form.submit');
        document.getElementById('vessel-cancel').hidden = true;
        document.getElementById('vessel-form-card').hidden = true;
        document.getElementById('vessel-add-toggle').textContent = t('vessels.form.addTitle');
        if (!keepAlert) {
            document.getElementById('vessel-alert').innerHTML = '';
        }
    },

    async handleSubmit() {
        const alertBox = document.getElementById('vessel-alert');
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

        const error = Validate.name(name)
            || Validate.vesselYear(year)
            || Validate.vesselDimension(length, t('vessels.dimensions.length'))
            || Validate.vesselDimension(width, t('vessels.dimensions.width'))
            || Validate.vesselDimension(draft, t('vessels.dimensions.draft'));
        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        const submitBtn = document.getElementById('vessel-submit');
        submitBtn.disabled = true;
        alertBox.innerHTML = '';

        const body = JSON.stringify({
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
        });
        const response = this.state.editingId
            ? await apiRequest(`/vessels/${this.state.editingId}`, { method: 'PUT', body })
            : await apiRequest('/vessels', { method: 'POST', body });

        if (!response.success) {
            submitBtn.disabled = false;
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('vessels.saveFailed')))}</div>`;
            return;
        }

        const vessel = response.data;

        if (!this.state.editingId) invalidateNavVisibility('myVessels');

        if (vessel.mmsi_notice?.already_registered_elsewhere) {
            showToast(t('vessels.mmsiAlreadyRegistered'), 'info');
        }

        if (this.state.photoFile) {
            const formData = new FormData();
            formData.append('photo', this.state.photoFile);
            const photoResponse = await apiUpload(`/vessels/${vessel.id}/photo`, formData, 'PUT');
            if (!photoResponse.success) {
                const photoError = photoResponse.code ? t.error(photoResponse.code) : (photoResponse.error || t('vessels.unknownError'));
                showToast(t('vessels.photoUploadFailed', { error: photoError }), 'error');
            }
        }

        submitBtn.disabled = false;
        showToast(this.state.editingId ? t('vessels.updated') : t('vessels.added'), 'success');
        this.resetForm();
        await this.loadVessels();
    },

    async handleDelete(vesselId) {
        const vessel = this.state.vessels.find((v) => v.id === vesselId);
        if (!vessel) return;
        if (!confirm(t('vessels.confirmDelete', { name: vessel.vessel_name }))) return;

        const response = await apiRequest(`/vessels/${vesselId}`, { method: 'DELETE' });

        if (!response.success) {
            showToast(response.code ? t.error(response.code) : (response.error || t('vessels.deleteFailed')), 'error');
            return;
        }

        if (this.state.editingId === vesselId) this.resetForm();
        showToast(t('vessels.deleted'), 'success');
        invalidateNavVisibility('myVessels');
        await this.loadVessels();
    }
};
