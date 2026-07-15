const SavedRoutesPage = {
    ROUTE_COLOR: '#1e88a8',

    state: {
        savedRoutes: [],
        maps: {}
    },

    async render(container) {
        Object.values(this.state.maps).forEach((m) => m && m.remove());
        this.state.maps = {};

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('savedRoutes.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('savedRoutes.subtitle'))}</div>
                    </div>
                </div>
                <div id="saved-route-list-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('savedRoutes.loading'))}</div></div>
            </div>`;

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
