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
                        <h1>Mina båtar</h1>
                        <div class="page-header__meta">Fartyg du kan välja när du skapar en ny resa</div>
                    </div>
                </div>
                <div id="vessel-list-container"><div class="loading-state"><span class="spinner"></span> Laddar båtar...</div></div>
                <div class="card">
                    <div class="card-header">
                        <h2 id="vessel-form-title">Lägg till båt</h2>
                        <button class="btn btn-ghost btn-sm" type="button" id="vessel-cancel" hidden>Avbryt ändring</button>
                    </div>
                    <div id="vessel-alert"></div>
                    <form id="vessel-form" novalidate>
                        <div class="field-row">
                            <div class="field">
                                <label for="vessel-name">Fartygsnamn</label>
                                <input type="text" id="vessel-name" placeholder="t.ex. Thrym">
                            </div>
                            <div class="field">
                                <label for="vessel-mmsi">MMSI (valfritt)</label>
                                <input type="text" id="vessel-mmsi">
                            </div>
                        </div>
                        <div class="field">
                            <label for="vessel-callsign">Anropssignal (valfritt)</label>
                            <input type="text" id="vessel-callsign">
                        </div>
                        <div class="field-row">
                            <div class="field">
                                <label for="vessel-model">Modell (valfritt)</label>
                                <input type="text" id="vessel-model" placeholder="t.ex. Bavaria 34">
                            </div>
                            <div class="field">
                                <label for="vessel-year">Årsmodell (valfritt)</label>
                                <input type="number" id="vessel-year" inputmode="numeric" step="1" placeholder="t.ex. 2011">
                            </div>
                        </div>
                        <div class="field-row">
                            <div class="field">
                                <label for="vessel-length">Längd, meter (valfritt)</label>
                                <input type="number" id="vessel-length" inputmode="decimal" step="0.01" min="0">
                            </div>
                            <div class="field">
                                <label for="vessel-width">Bredd, meter (valfritt)</label>
                                <input type="number" id="vessel-width" inputmode="decimal" step="0.01" min="0">
                            </div>
                            <div class="field">
                                <label for="vessel-draft">Djup, meter (valfritt)</label>
                                <input type="number" id="vessel-draft" inputmode="decimal" step="0.01" min="0">
                            </div>
                        </div>
                        <div class="field">
                            <label for="vessel-notes">Övrigt (valfritt)</label>
                            <textarea id="vessel-notes" rows="3" placeholder="Övrig information om båten"></textarea>
                        </div>
                        <div class="field">
                            <label for="vessel-photo">Fartygsfoto (valfritt)</label>
                            <input type="file" id="vessel-photo" accept="image/jpeg,image/png">
                            <small>Används av sjöräddningen för att identifiera fartyget. JPEG/PNG, max 10 MB.</small>
                            <img id="vessel-photo-preview" alt="" hidden
                                 style="margin-top: var(--space-2); width: 96px; height: 96px; border-radius: var(--radius-md); object-fit: cover;">
                        </div>
                        <button class="btn btn-primary" type="submit" id="vessel-submit">Spara båt</button>
                    </form>
                </div>
            </div>`;

        document.getElementById('vessel-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        document.getElementById('vessel-cancel').addEventListener('click', () => this.resetForm());

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
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta båtar.')}</div>`;
            return;
        }

        this.state.vessels = response.data || [];

        if (this.state.vessels.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Inga båtar än</h3>
                    <p>Lägg till en båt ovan för att kunna välja den när du skapar en resa.</p>
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
                        ${vessel.year_built ? `<span>Årsmodell ${escapeHtml(String(vessel.year_built))}</span>` : ''}
                        ${dims ? `<span>${escapeHtml(dims)}</span>` : ''}
                        ${vessel.mmsi ? `<span>MMSI ${escapeHtml(vessel.mmsi)}</span>` : ''}
                        ${vessel.call_sign ? `<span>Anropssignal ${escapeHtml(vessel.call_sign)}</span>` : ''}
                    </div>
                    ${vessel.notes ? `<div class="trip-card__meta" style="white-space:pre-wrap;">${escapeHtml(vessel.notes)}</div>` : ''}
                </div>
                <div class="trip-card__actions">
                    <button class="btn btn-secondary btn-sm" type="button" data-edit="${vessel.id}">Ändra</button>
                    <button class="btn btn-ghost btn-sm" type="button" data-delete="${vessel.id}">Ta bort</button>
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

    startEdit(vesselId) {
        const vessel = this.state.vessels.find((v) => v.id === vesselId);
        if (!vessel) return;

        this.state.editingId = vesselId;
        this.state.photoFile = null;
        document.getElementById('vessel-form-title').textContent = `Ändra: ${vessel.vessel_name}`;
        document.getElementById('vessel-name').value = vessel.vessel_name || '';
        document.getElementById('vessel-mmsi').value = vessel.mmsi || '';
        document.getElementById('vessel-callsign').value = vessel.call_sign || '';
        document.getElementById('vessel-model').value = vessel.model || '';
        document.getElementById('vessel-year').value = vessel.year_built ?? '';
        document.getElementById('vessel-length').value = vessel.length_m ?? '';
        document.getElementById('vessel-width').value = vessel.width_m ?? '';
        document.getElementById('vessel-draft').value = vessel.draft_m ?? '';
        document.getElementById('vessel-notes').value = vessel.notes || '';
        document.getElementById('vessel-photo').value = '';
        const preview = document.getElementById('vessel-photo-preview');
        preview.hidden = true;
        document.getElementById('vessel-submit').textContent = 'Spara ändringar';
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
        document.getElementById('vessel-form-title').textContent = 'Lägg till båt';
        document.getElementById('vessel-submit').textContent = 'Spara båt';
        document.getElementById('vessel-cancel').hidden = true;
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
        const year = document.getElementById('vessel-year').value.trim();
        const length = document.getElementById('vessel-length').value.trim();
        const width = document.getElementById('vessel-width').value.trim();
        const draft = document.getElementById('vessel-draft').value.trim();
        const notes = document.getElementById('vessel-notes').value.trim();

        const error = Validate.name(name)
            || Validate.vesselYear(year)
            || Validate.vesselDimension(length, 'Längd')
            || Validate.vesselDimension(width, 'Bredd')
            || Validate.vesselDimension(draft, 'Djup');
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
            year_built: year ? Number(year) : null,
            length_m: length ? Number(length) : null,
            width_m: width ? Number(width) : null,
            draft_m: draft ? Number(draft) : null,
            notes: notes || null
        });
        const response = this.state.editingId
            ? await apiRequest(`/vessels/${this.state.editingId}`, { method: 'PUT', body })
            : await apiRequest('/vessels', { method: 'POST', body });

        if (!response.success) {
            submitBtn.disabled = false;
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte spara båten.')}</div>`;
            return;
        }

        const vessel = response.data;

        if (vessel.mmsi_notice?.already_registered_elsewhere) {
            showToast('Detta MMSI-nummer finns redan registrerat i systemet.', 'info');
        }

        if (this.state.photoFile) {
            const formData = new FormData();
            formData.append('photo', this.state.photoFile);
            const photoResponse = await apiUpload(`/vessels/${vessel.id}/photo`, formData, 'PUT');
            if (!photoResponse.success) {
                showToast(`Båten sparades, men fotot kunde inte laddas upp (${photoResponse.error || 'okänt fel'})`, 'error');
            }
        }

        submitBtn.disabled = false;
        showToast(this.state.editingId ? 'Båten uppdaterad.' : 'Båten tillagd.', 'success');
        this.resetForm();
        await this.loadVessels();
    },

    async handleDelete(vesselId) {
        const vessel = this.state.vessels.find((v) => v.id === vesselId);
        if (!vessel) return;
        if (!confirm(`Ta bort båten ${vessel.vessel_name}?`)) return;

        const response = await apiRequest(`/vessels/${vesselId}`, { method: 'DELETE' });

        if (!response.success) {
            showToast(response.error || 'Kunde inte ta bort båten.', 'error');
            return;
        }

        if (this.state.editingId === vesselId) this.resetForm();
        showToast('Båten borttagen.', 'success');
        await this.loadVessels();
    }
};
