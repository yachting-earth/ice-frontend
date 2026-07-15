const SavedRoutesPage = {
    ROUTE_COLOR: '#1e88a8',

    state: {
        savedRoutes: [],
        maps: {},
        createForm: { mode: 'windy', windyUrl: '', coordinates: [], name: '' },
        createDrawMap: null
    },

    async render(container) {
        Object.values(this.state.maps).forEach((m) => m && m.remove());
        this.state.maps = {};
        this.state.createDrawMap?.destroy();
        this.state.createDrawMap = null;
        this.state.createForm = { mode: 'windy', windyUrl: '', coordinates: [], name: '' };

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('savedRoutes.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('savedRoutes.subtitle'))}</div>
                    </div>
                    <button class="btn btn-primary" type="button" id="saved-route-add-toggle">${escapeHtml(t('savedRoutes.form.addTitle'))}</button>
                </div>
                <div class="card" id="saved-route-form-card" hidden>
                    <h3>${escapeHtml(t('savedRoutes.form.addTitle'))}</h3>
                    <div id="saved-route-create-alert"></div>
                    <div class="field">
                        <label for="saved-route-create-name">${escapeHtml(t('savedRoutes.form.nameLabel'))}</label>
                        <input type="text" id="saved-route-create-name" placeholder="${escapeHtml(t('savedRoutes.form.namePlaceholder'))}">
                    </div>
                    <div class="route-mode-toggle btn-group">
                        <button type="button" class="btn btn-sm btn-primary" data-create-mode="windy">${escapeHtml(t('createTrip.routes.modeWindy'))}</button>
                        <button type="button" class="btn btn-sm btn-ghost" data-create-mode="manual">${escapeHtml(t('createTrip.routes.modeManual'))}</button>
                        <button type="button" class="btn btn-sm btn-ghost" data-create-mode="gpx">${escapeHtml(t('createTrip.routes.modeGpx'))}</button>
                    </div>
                    <div id="saved-route-create-mode-content"></div>
                    <button class="btn btn-primary" type="button" id="saved-route-create-submit">${escapeHtml(t('savedRoutes.form.submit'))}</button>
                </div>
                <div id="saved-route-list-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('savedRoutes.loading'))}</div></div>
            </div>`;

        document.getElementById('saved-route-add-toggle').addEventListener('click', () => {
            if (document.getElementById('saved-route-form-card').hidden) {
                this.openCreateForm();
            } else {
                this.resetCreateForm();
            }
        });
        document.getElementById('saved-route-create-submit').addEventListener('click', () => this.handleCreateSubmit());

        this.renderCreateModeContent();
        await this.loadSavedRoutes();
    },

    openCreateForm() {
        document.getElementById('saved-route-form-card').hidden = false;
        document.getElementById('saved-route-add-toggle').textContent = t('common.close');
        document.getElementById('saved-route-create-name').focus();
    },

    resetCreateForm() {
        this.state.createDrawMap?.destroy();
        this.state.createDrawMap = null;
        this.state.createForm = { mode: 'windy', windyUrl: '', coordinates: [], name: '' };
        document.getElementById('saved-route-create-name').value = '';
        document.getElementById('saved-route-create-alert').innerHTML = '';
        document.getElementById('saved-route-form-card').hidden = true;
        document.getElementById('saved-route-add-toggle').textContent = t('savedRoutes.form.addTitle');
        this.renderCreateModeContent();
    },

    renderCreateModeContent() {
        this.state.createDrawMap?.destroy();
        this.state.createDrawMap = null;

        const mode = this.state.createForm.mode;
        const content = document.getElementById('saved-route-create-mode-content');

        document.querySelectorAll('[data-create-mode]').forEach((btn) => {
            const active = btn.dataset.createMode === mode;
            btn.classList.toggle('btn-primary', active);
            btn.classList.toggle('btn-ghost', !active);
        });

        content.innerHTML = mode === 'manual' ? `
            <div class="field">
                <label>${escapeHtml(t('createTrip.routes.drawLabel'))}</label>
                <small class="text-muted">${escapeHtml(t('createTrip.routes.drawHint'))}</small>
                <div id="saved-route-create-draw-map" class="map-container route-draw-map"></div>
                <div class="route-draw-footer">
                    <span class="text-muted" style="font-size: var(--font-size-sm);"><span id="saved-route-create-draw-count">${this.state.createForm.coordinates.length}</span> ${escapeHtml(t('createTrip.routes.points'))}</span>
                    <button class="btn btn-ghost btn-sm" type="button" id="saved-route-create-clear">${escapeHtml(t('createTrip.routes.clear'))}</button>
                </div>
            </div>` : mode === 'gpx' ? `
            <div class="field">
                <label>${escapeHtml(t('createTrip.routes.gpxLabel'))}</label>
                <small class="text-muted">${escapeHtml(t('createTrip.routes.gpxHint'))}</small>
                <input type="file" id="saved-route-create-gpx-file" accept=".gpx,application/gpx+xml">
                <div class="route-draw-footer">
                    <span class="text-muted" style="font-size: var(--font-size-sm);"><span id="saved-route-create-draw-count">${this.state.createForm.coordinates.length}</span> ${escapeHtml(t('createTrip.routes.points'))}</span>
                    <button class="btn btn-ghost btn-sm" type="button" id="saved-route-create-clear">${escapeHtml(t('createTrip.routes.clear'))}</button>
                </div>
            </div>` : `
            <div class="field">
                <label>${escapeHtml(t('createTrip.routes.windyUrlLabel'))}</label>
                <input type="url" id="saved-route-create-windy-url" value="${escapeHtml(this.state.createForm.windyUrl)}"
                       placeholder="${escapeHtml(t('createTrip.routes.windyUrlPlaceholder'))}">
            </div>`;

        document.querySelectorAll('[data-create-mode]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (this.state.createForm.mode === btn.dataset.createMode) return;
                this.state.createForm.mode = btn.dataset.createMode;
                this.renderCreateModeContent();
            });
        });

        const windyInput = document.getElementById('saved-route-create-windy-url');
        if (windyInput) {
            windyInput.addEventListener('input', (e) => {
                this.state.createForm.windyUrl = e.target.value;
            });
        }

        const gpxInput = document.getElementById('saved-route-create-gpx-file');
        if (gpxInput) {
            gpxInput.addEventListener('change', (e) => this.handleCreateGpxFileSelected(e.target));
        }

        const clearBtn = document.getElementById('saved-route-create-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.state.createForm.coordinates = [];
                this.state.createDrawMap?.clear();
                document.getElementById('saved-route-create-draw-count').textContent = '0';
            });
        }

        if (mode === 'manual') this.initCreateDrawMap();
    },

    initCreateDrawMap() {
        const container = document.getElementById('saved-route-create-draw-map');
        if (!container) return;

        this.state.createDrawMap = renderRouteDrawMap(container, {
            initialCoordinates: this.state.createForm.coordinates,
            color: this.ROUTE_COLOR,
            onChange: (coords) => {
                this.state.createForm.coordinates = coords;
                const countEl = document.getElementById('saved-route-create-draw-count');
                if (countEl) countEl.textContent = coords.length;
            }
        });
    },

    async handleCreateGpxFileSelected(inputEl) {
        const alertBox = document.getElementById('saved-route-create-alert');
        const file = inputEl.files[0];
        inputEl.value = '';
        if (!file) return;

        const coords = parseGpxFile(await file.text());
        if (!coords) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.gpxParseError'))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        this.state.createForm.coordinates = coords;
        const countEl = document.getElementById('saved-route-create-draw-count');
        if (countEl) countEl.textContent = coords.length;
    },

    async handleCreateSubmit() {
        const alertBox = document.getElementById('saved-route-create-alert');
        const name = document.getElementById('saved-route-create-name').value.trim();
        const form = this.state.createForm;

        const nameError = Validate.name(name);
        if (nameError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(nameError)}</div>`;
            return;
        }

        let body;
        if (form.mode === 'manual' || form.mode === 'gpx') {
            if (form.coordinates.length < 2) {
                alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('createTrip.errors.primaryRouteMinPoints'))}</div>`;
                return;
            }
            body = { name, coordinates: form.coordinates };
        } else {
            const urlError = Validate.windyUrl(form.windyUrl);
            if (urlError) {
                alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(urlError)}</div>`;
                return;
            }
            body = { name, windy_url: form.windyUrl.trim() };
        }

        const submitBtn = document.getElementById('saved-route-create-submit');
        submitBtn.disabled = true;
        alertBox.innerHTML = '';

        const response = await apiRequest('/saved-routes', { method: 'POST', body: JSON.stringify(body) });

        submitBtn.disabled = false;

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('savedRoutes.saveFailed')))}</div>`;
            return;
        }

        showToast(t('createTrip.routes.saveRouteSuccess'), 'success');
        invalidateNavVisibility('savedRoutes');
        this.resetCreateForm();
        await this.loadSavedRoutes();
    },

    async loadSavedRoutes() {
        const listContainer = document.getElementById('saved-route-list-container');
        const response = await apiRequest('/saved-routes');

        if (!response.success) {
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('savedRoutes.loadFailed')))}</div>`;
            return;
        }

        Object.values(this.state.maps).forEach((m) => m && m.remove());
        this.state.maps = {};
        this.state.savedRoutes = response.data || [];

        if (this.state.savedRoutes.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>${escapeHtml(t('savedRoutes.emptyTitle'))}</h3>
                    <p>${escapeHtml(t('savedRoutes.emptyBody'))}</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = `<div class="trip-list">${this.state.savedRoutes.map((r) => this.renderCard(r)).join('')}</div>`;

        listContainer.querySelectorAll('[data-edit]').forEach((btn) => {
            btn.addEventListener('click', () => this.startEdit(Number(btn.dataset.edit)));
        });
        listContainer.querySelectorAll('[data-cancel-edit]').forEach((btn) => {
            btn.addEventListener('click', () => this.cancelEdit(Number(btn.dataset.cancelEdit)));
        });
        listContainer.querySelectorAll('[data-save-edit]').forEach((btn) => {
            btn.addEventListener('click', () => this.handleSaveEdit(Number(btn.dataset.saveEdit)));
        });
        listContainer.querySelectorAll('[data-delete]').forEach((btn) => {
            btn.addEventListener('click', () => this.handleDelete(Number(btn.dataset.delete)));
        });

        this.state.savedRoutes.forEach((r) => this.renderMap(r));
    },

    renderCard(route) {
        return `
            <div class="trip-card" data-id="${route.id}">
                <div class="stack" style="flex:1; gap: var(--space-2); min-width:0;">
                    <div class="trip-card__top">
                        <span class="trip-card__title">${escapeHtml(route.name)}</span>
                    </div>
                    <div id="saved-route-map-${route.id}" class="map-container" style="height:180px;"></div>
                    <div class="field-row" id="saved-route-edit-form-${route.id}" hidden>
                        <div class="field" style="flex:1;">
                            <label for="saved-route-name-input-${route.id}">${escapeHtml(t('savedRoutes.form.nameLabel'))}</label>
                            <input type="text" id="saved-route-name-input-${route.id}" value="${escapeHtml(route.name)}">
                        </div>
                        ${route.raw_windy_url ? `
                        <div class="field" style="flex:2;">
                            <label for="saved-route-url-input-${route.id}">${escapeHtml(t('savedRoutes.form.windyUrlLabel'))}</label>
                            <input type="url" id="saved-route-url-input-${route.id}" value="${escapeHtml(route.raw_windy_url)}">
                        </div>` : ''}
                    </div>
                    <div class="btn-group" id="saved-route-edit-actions-${route.id}" hidden>
                        <button class="btn btn-primary btn-sm" type="button" data-save-edit="${route.id}">${escapeHtml(t('common.save'))}</button>
                        <button class="btn btn-ghost btn-sm" type="button" data-cancel-edit="${route.id}">${escapeHtml(t('common.cancel'))}</button>
                    </div>
                </div>
                <div class="trip-card__actions" id="saved-route-view-actions-${route.id}">
                    <button class="btn btn-secondary btn-sm" type="button" data-edit="${route.id}">${escapeHtml(t('common.edit'))}</button>
                    <button class="btn btn-ghost btn-sm" type="button" data-delete="${route.id}">${escapeHtml(t('common.remove'))}</button>
                </div>
            </div>`;
    },

    renderMap(route) {
        const container = document.getElementById(`saved-route-map-${route.id}`);
        if (!container) return;
        const coordinates = parseWktLineString(route.geometry_wkt);
        if (coordinates.length < 2) return;
        this.state.maps[route.id] = renderRouteMap(container, [{ coordinates, color: this.ROUTE_COLOR }]);
    },

    startEdit(routeId) {
        document.getElementById(`saved-route-edit-form-${routeId}`).hidden = false;
        document.getElementById(`saved-route-edit-actions-${routeId}`).hidden = false;
        document.getElementById(`saved-route-view-actions-${routeId}`).hidden = true;
    },

    cancelEdit(routeId) {
        document.getElementById(`saved-route-edit-form-${routeId}`).hidden = true;
        document.getElementById(`saved-route-edit-actions-${routeId}`).hidden = true;
        document.getElementById(`saved-route-view-actions-${routeId}`).hidden = false;
    },

    async handleSaveEdit(routeId) {
        const name = document.getElementById(`saved-route-name-input-${routeId}`).value.trim();
        if (!name) {
            showToast(t('validation.nameRequired'), 'error');
            return;
        }

        const body = { name };
        const urlInput = document.getElementById(`saved-route-url-input-${routeId}`);
        if (urlInput) {
            const urlError = Validate.windyUrl(urlInput.value);
            if (urlError) {
                showToast(urlError, 'error');
                return;
            }
            body.windy_url = urlInput.value.trim();
        }

        const response = await apiRequest(`/saved-routes/${routeId}`, { method: 'PUT', body: JSON.stringify(body) });

        if (!response.success) {
            showToast(response.code ? t.error(response.code) : (response.error || t('savedRoutes.saveFailed')), 'error');
            return;
        }

        showToast(t('savedRoutes.updated'), 'success');
        await this.loadSavedRoutes();
    },

    async handleDelete(routeId) {
        const route = this.state.savedRoutes.find((r) => r.id === routeId);
        if (!route) return;
        if (!confirm(t('savedRoutes.confirmDelete', { name: route.name }))) return;

        const response = await apiRequest(`/saved-routes/${routeId}`, { method: 'DELETE' });

        if (!response.success) {
            showToast(response.code ? t.error(response.code) : (response.error || t('savedRoutes.deleteFailed')), 'error');
            return;
        }

        showToast(t('savedRoutes.deleted'), 'success');
        invalidateNavVisibility('savedRoutes');
        await this.loadSavedRoutes();
    }
};
