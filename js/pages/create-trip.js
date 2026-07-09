const CreateTripPage = {
    ROUTE_COLORS: ['#1e88a8', '#a06600', '#b3261e', '#1a7f4e'],

    state: {
        vessels: [],
        routes: [{ windyUrl: '', reason: '' }],
        map: null
    },

    async render(container) {
        this.state.routes = [{ windyUrl: '', reason: '' }];
        this.state.map = null;

        container.innerHTML = `
            <div class="page page--narrow" style="max-width: 640px;">
                <div class="page-header">
                    <h1>Skapa ny resa</h1>
                </div>
                <div id="create-trip-alert"></div>

                <div class="card">
                    <h3>Fartyg</h3>
                    <div id="vessel-section"><div class="loading-state"><span class="spinner"></span> Laddar fartyg...</div></div>
                </div>

                <div class="card">
                    <h3>Tidsplan</h3>
                    <div class="field-row">
                        <div class="field">
                            <label for="departure">Avgång (UTC)</label>
                            <input type="datetime-local" id="departure" required>
                        </div>
                        <div class="field">
                            <label for="arrival">Planerad ankomst (UTC)</label>
                            <input type="datetime-local" id="arrival" required>
                        </div>
                    </div>
                    <div class="field">
                        <label for="grace-period">Marginal innan ICE-kontakt varnas</label>
                        <select id="grace-period">
                            ${CONFIG.GRACE_PERIOD_OPTIONS.map((g) => `<option value="${g.seconds}" ${g.seconds === 86400 ? 'selected' : ''}>${g.label}</option>`).join('')}
                        </select>
                        <small>Tid efter planerad ankomst innan ICE-kontakten notifieras om du inte har verifierat ankomst.</small>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>Rutter</h3>
                        <button class="btn btn-secondary btn-sm" type="button" id="add-route-btn">+ Lägg till alternativ rutt</button>
                    </div>
                    <div id="routes-container"></div>
                    <div id="route-map" class="map-container"></div>
                </div>

                <div class="btn-group">
                    <a class="btn btn-ghost" href="#/dashboard">Avbryt</a>
                    <button class="btn btn-primary" type="button" id="create-trip-submit">Skapa resa</button>
                </div>
            </div>`;

        document.getElementById('add-route-btn').addEventListener('click', () => {
            this.state.routes.push({ windyUrl: '', reason: '' });
            this.renderRoutes();
        });
        document.getElementById('create-trip-submit').addEventListener('click', () => this.handleSubmit());

        this.renderRoutes();
        await this.loadVessels();
    },

    async loadVessels() {
        const response = await apiRequest('/vessels');
        const section = document.getElementById('vessel-section');

        if (response.success) {
            this.state.vessels = response.data;
        }

        this.renderVesselSection();
    },

    renderVesselSection() {
        const section = document.getElementById('vessel-section');

        section.innerHTML = `
            ${this.state.vessels.length > 0 ? `
                <div class="field">
                    <label for="vessel-select">Välj fartyg</label>
                    <select id="vessel-select">
                        ${this.state.vessels.map((v) => `<option value="${v.id}">${escapeHtml(v.vessel_name)}${v.mmsi ? ` (MMSI ${escapeHtml(v.mmsi)})` : ''}</option>`).join('')}
                    </select>
                </div>` : `<div class="alert alert-info">Du har inga fartyg registrerade än. Lägg till ett nedan.</div>`}
            <button class="btn btn-ghost btn-sm" type="button" id="toggle-new-vessel">+ Lägg till nytt fartyg</button>
            <div id="new-vessel-form" style="display:${this.state.vessels.length > 0 ? 'none' : 'block'}; margin-top: var(--space-3);">
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
                <button class="btn btn-secondary btn-sm" type="button" id="save-vessel-btn">Spara fartyg</button>
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
            || Validate.vesselDimension(length, 'Längd')
            || Validate.vesselDimension(width, 'Bredd')
            || Validate.vesselDimension(draft, 'Djup');
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
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte spara fartyget.')}</div>`;
            return;
        }

        let vessel = response.data;

        if (photoFile) {
            const formData = new FormData();
            formData.append('photo', photoFile);
            const photoResponse = await apiUpload(`/vessels/${vessel.id}/photo`, formData, 'PUT');
            if (!photoResponse.success) {
                showToast(`Fartyget sparades, men fotot kunde inte laddas upp (${photoResponse.error || 'okänt fel'})`, 'error');
            } else {
                vessel = { ...vessel, photo_path: true };
            }
        }

        this.state.vessels.push(vessel);
        this.renderVesselSection();
        document.getElementById('vessel-select').value = vessel.id;
        showToast('Fartyg tillagt', 'success');
    },

    renderRoutes() {
        const routesContainer = document.getElementById('routes-container');

        routesContainer.innerHTML = this.state.routes.map((route, i) => `
            <div class="route-item" data-index="${i}">
                <div class="route-item__title">
                    <span class="route-color-dot" style="background:${this.ROUTE_COLORS[i % this.ROUTE_COLORS.length]};"></span>
                    ${i === 0 ? 'Huvudrutt' : `Alternativ rutt ${i}`}
                    <div class="btn-group" style="margin-left:auto;">
                        <button class="btn btn-ghost btn-sm" type="button" data-move-up="${i}" ${i === 0 ? 'disabled' : ''} title="Flytta upp">↑</button>
                        <button class="btn btn-ghost btn-sm" type="button" data-move-down="${i}" ${i === this.state.routes.length - 1 ? 'disabled' : ''} title="Flytta ner">↓</button>
                        ${i > 0 ? `<button class="btn btn-ghost btn-sm" type="button" data-remove="${i}">Ta bort</button>` : ''}
                    </div>
                </div>
                <div class="field">
                    <label>Windy-länk</label>
                    <input type="url" class="route-windy-url" data-index="${i}" value="${escapeHtml(route.windyUrl)}"
                           placeholder="https://www.windy.com/route-planner/boat/...">
                </div>
                ${i > 0 ? `
                <div class="field">
                    <label>Anledning</label>
                    <input type="text" class="route-reason" data-index="${i}" value="${escapeHtml(route.reason)}"
                           placeholder="t.ex. Om vinden vrider nordlig">
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
                this.updateMapPreview();
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
        this.updateMapPreview();
    },

    updateMapPreview() {
        const mapEl = document.getElementById('route-map');
        if (this.state.map) {
            this.state.map.remove();
            this.state.map = null;
        }
        mapEl.innerHTML = '';

        const routes = this.state.routes
            .map((r) => parseWindyUrl(r.windyUrl))
            .map((coords, i) => coords ? { coordinates: coords, color: this.ROUTE_COLORS[i % this.ROUTE_COLORS.length] } : null)
            .filter(Boolean);

        if (routes.length === 0) return;
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
            alertBox.innerHTML = `<div class="alert alert-error">Välj eller lägg till ett fartyg.</div>`;
            return;
        }
        if (!departure || !arrival) {
            alertBox.innerHTML = `<div class="alert alert-error">Ange både avgångs- och ankomsttid.</div>`;
            return;
        }
        if (toApiDatetime(arrival) <= toApiDatetime(departure)) {
            alertBox.innerHTML = `<div class="alert alert-error">Ankomsttiden måste vara efter avgångstiden.</div>`;
            return;
        }

        const primaryUrlError = Validate.windyUrl(this.state.routes[0].windyUrl);
        if (primaryUrlError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(primaryUrlError)}</div>`;
            return;
        }

        const routes = this.state.routes
            .filter((r) => r.windyUrl.trim())
            .map((r) => ({ windy_url: r.windyUrl.trim(), reason: r.reason.trim() || null }));

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Skapar resa...';

        const response = await apiRequest('/trips', {
            method: 'POST',
            body: JSON.stringify({
                vessel_id: vesselId,
                departure_scheduled: toApiDatetime(departure),
                arrival_scheduled: toApiDatetime(arrival),
                grace_period_seconds: gracePeriod,
                routes
            })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte skapa resan.')}</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Skapa resa';
            return;
        }

        showToast('Resa skapad', 'success');
        location.hash = `#/trips/${response.data.trip_id}`;
    }
};
