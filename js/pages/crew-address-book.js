const CrewAddressBookPage = {
    state: {
        entries: [],
        selectedIds: new Set(),
        eligibleTrips: []
    },

    async render(container) {
        this.state.selectedIds = new Set();

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('crewAddressBook.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('crewAddressBook.subtitle'))}</div>
                    </div>
                </div>
                <div class="card" id="address-book-bulk-bar" hidden>
                    <div class="field-row" style="align-items:center; flex-wrap:wrap; margin:0;">
                        <div class="checkbox-field" style="margin:0;">
                            <input type="checkbox" id="address-book-select-all">
                            <label for="address-book-select-all" id="address-book-selected-count"></label>
                        </div>
                        <div class="btn-group" style="margin-left:auto; flex-wrap:wrap;">
                            <button class="btn btn-secondary btn-sm" type="button" id="address-book-invite-new-trip-btn" disabled>${escapeHtml(t('crewAddressBook.bulk.inviteToNewTrip'))}</button>
                            <select class="btn btn-secondary btn-sm" id="address-book-add-to-trip-select" disabled>
                                <option value="">${escapeHtml(t('crewAddressBook.bulk.addToTripPlaceholder'))}</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div id="address-book-list-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('crewAddressBook.loading'))}</div></div>
            </div>`;

        document.getElementById('address-book-select-all').addEventListener('change', (e) => this.handleSelectAll(e.target.checked));
        document.getElementById('address-book-invite-new-trip-btn').addEventListener('click', () => this.handleInviteToNewTrip());
        document.getElementById('address-book-add-to-trip-select').addEventListener('change', (e) => {
            const tripId = e.target.value;
            e.target.value = '';
            if (tripId) this.handleAddToTrip(tripId);
        });

        await this.loadEntries();
        this.loadEligibleTrips();
    },

    async loadEntries() {
        const listContainer = document.getElementById('address-book-list-container');
        const response = await apiRequest('/crew/address-book/all');

        if (!response.success) {
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('crewAddressBook.loadFailed')))}</div>`;
            return;
        }

        this.state.entries = response.data || [];

        if (this.state.entries.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>${escapeHtml(t('crewAddressBook.emptyTitle'))}</h3>
                    <p>${escapeHtml(t('crewAddressBook.emptyBody'))}</p>
                </div>`;
            document.getElementById('address-book-bulk-bar').hidden = true;
            return;
        }

        document.getElementById('address-book-bulk-bar').hidden = false;

        listContainer.innerHTML = `<div class="trip-list">${this.state.entries.map((e) => this.renderCard(e)).join('')}</div>`;

        listContainer.querySelectorAll('[data-select]').forEach((checkbox) => {
            checkbox.addEventListener('change', (e) => this.handleSelect(Number(e.target.dataset.select), e.target.checked));
        });
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

        this.updateBulkBar();
    },

    // Populates the "add to trip" picker with the skipper's own trips that
    // can still gain crew - not completed/cancelled, and not Emergency-Locked
    // (Trip::isLocked - see CrewHandler::invite, which would reject those
    // server-side anyway; filtering here just avoids offering a dead end).
    async loadEligibleTrips() {
        const response = await apiRequest('/trips');
        if (!response.success) return;

        this.state.eligibleTrips = (response.data || []).filter((trip) =>
            trip.viewer_role === 'owner'
            && !['completed', 'cancelled'].includes(trip.status)
            && !trip.is_emergency_incident);

        this.renderAddToTripOptions();
    },

    renderAddToTripOptions() {
        const select = document.getElementById('address-book-add-to-trip-select');
        if (!select) return;

        const placeholder = `<option value="">${escapeHtml(t('crewAddressBook.bulk.addToTripPlaceholder'))}</option>`;

        if (this.state.eligibleTrips.length === 0) {
            select.innerHTML = `<option value="">${escapeHtml(t('crewAddressBook.bulk.addToTripNoneEligible'))}</option>`;
            select.disabled = true;
            return;
        }

        select.innerHTML = placeholder + this.state.eligibleTrips
            .map((trip) => `<option value="${trip.id}">${escapeHtml(trip.vessel_name)} — ${escapeHtml(formatDateTime(trip.departure_scheduled))}</option>`)
            .join('');
        select.disabled = this.state.selectedIds.size === 0;
    },

    renderCard(entry) {
        return `
            <div class="trip-card" data-id="${entry.id}">
                <div class="checkbox-field" style="margin:0 0 0 2px;">
                    <input type="checkbox" id="address-book-select-${entry.id}" data-select="${entry.id}" aria-label="${escapeHtml(entry.name || entry.email)}" ${this.state.selectedIds.has(entry.id) ? 'checked' : ''}>
                </div>
                <div class="stack" style="flex:1; gap: var(--space-2); min-width:0;">
                    <div class="trip-card__top" id="address-book-view-${entry.id}">
                        <span class="trip-card__title">${escapeHtml(entry.name || entry.email)}</span>
                    </div>
                    ${entry.name ? `<div class="trip-card__meta" id="address-book-email-${entry.id}"><span>${escapeHtml(entry.email)}</span></div>` : ''}
                    <div class="field-row" id="address-book-edit-form-${entry.id}" hidden>
                        <div class="field" style="flex:1;">
                            <label for="address-book-name-input-${entry.id}">${escapeHtml(t('crewAddressBook.form.nameLabel'))}</label>
                            <input type="text" id="address-book-name-input-${entry.id}" value="${escapeHtml(entry.name || '')}">
                        </div>
                        <div class="field" style="flex:1;">
                            <label for="address-book-email-input-${entry.id}">${escapeHtml(t('crewAddressBook.form.emailLabel'))}</label>
                            <input type="email" id="address-book-email-input-${entry.id}" value="${escapeHtml(entry.email)}">
                        </div>
                    </div>
                    <div class="btn-group" id="address-book-edit-actions-${entry.id}" hidden>
                        <button class="btn btn-primary btn-sm" type="button" data-save-edit="${entry.id}">${escapeHtml(t('common.save'))}</button>
                        <button class="btn btn-ghost btn-sm" type="button" data-cancel-edit="${entry.id}">${escapeHtml(t('common.cancel'))}</button>
                    </div>
                </div>
                <div class="trip-card__actions" id="address-book-view-actions-${entry.id}">
                    <button class="btn btn-secondary btn-sm" type="button" data-edit="${entry.id}">${escapeHtml(t('common.edit'))}</button>
                    <button class="btn btn-ghost btn-sm" type="button" data-delete="${entry.id}">${escapeHtml(t('common.remove'))}</button>
                </div>
            </div>`;
    },

    handleSelect(entryId, checked) {
        if (checked) {
            this.state.selectedIds.add(entryId);
        } else {
            this.state.selectedIds.delete(entryId);
        }
        this.updateBulkBar();
    },

    handleSelectAll(checked) {
        this.state.selectedIds = checked ? new Set(this.state.entries.map((e) => e.id)) : new Set();
        document.querySelectorAll('#address-book-list-container [data-select]').forEach((checkbox) => {
            checkbox.checked = checked;
        });
        this.updateBulkBar();
    },

    updateBulkBar() {
        const count = this.state.selectedIds.size;
        const selectAllCheckbox = document.getElementById('address-book-select-all');
        selectAllCheckbox.checked = count > 0 && count === this.state.entries.length;
        selectAllCheckbox.indeterminate = count > 0 && count < this.state.entries.length;

        document.getElementById('address-book-selected-count').textContent = t('crewAddressBook.bulk.selectAllLabel')
            + (count > 0 ? ` (${t('crewAddressBook.bulk.selectedCount', { count })})` : '');

        document.getElementById('address-book-invite-new-trip-btn').disabled = count === 0;

        const tripSelect = document.getElementById('address-book-add-to-trip-select');
        tripSelect.disabled = count === 0 || this.state.eligibleTrips.length === 0;
    },

    getSelectedEntries() {
        return this.state.entries.filter((e) => this.state.selectedIds.has(e.id));
    },

    handleInviteToNewTrip() {
        const selected = this.getSelectedEntries();
        if (selected.length === 0) return;

        PendingCrewInvites.set(selected.map((e) => ({ name: e.name || '', email: e.email })));
        location.hash = '#/trips/new';
    },

    async handleAddToTrip(tripId) {
        const selected = this.getSelectedEntries();
        if (selected.length === 0) return;

        const results = await Promise.all(selected.map((entry) =>
            apiRequest(`/trips/${tripId}/crew`, {
                method: 'POST',
                body: JSON.stringify({ email: entry.email, name: entry.name || undefined })
            })));

        const succeeded = results.filter((r) => r.success).length;

        if (succeeded === 0) {
            showToast(t('crewAddressBook.bulk.addFailed'), 'error');
            return;
        }

        if (succeeded < selected.length) {
            showToast(t('crewAddressBook.bulk.addPartial', { success: succeeded, total: selected.length }), 'info');
        } else {
            showToast(t('crewAddressBook.bulk.addSuccess', { count: succeeded }), 'success');
        }

        location.hash = `#/trips/${tripId}`;
    },

    startEdit(entryId) {
        document.getElementById(`address-book-edit-form-${entryId}`).hidden = false;
        document.getElementById(`address-book-edit-actions-${entryId}`).hidden = false;
        document.getElementById(`address-book-view-actions-${entryId}`).hidden = true;
    },

    cancelEdit(entryId) {
        document.getElementById(`address-book-edit-form-${entryId}`).hidden = true;
        document.getElementById(`address-book-edit-actions-${entryId}`).hidden = true;
        document.getElementById(`address-book-view-actions-${entryId}`).hidden = false;
    },

    async handleSaveEdit(entryId) {
        const name = document.getElementById(`address-book-name-input-${entryId}`).value.trim();
        const email = document.getElementById(`address-book-email-input-${entryId}`).value.trim();

        const emailError = Validate.email(email);
        if (emailError) {
            showToast(emailError, 'error');
            return;
        }

        const response = await apiRequest(`/crew/address-book/${entryId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, email })
        });

        if (!response.success) {
            showToast(response.code ? t.error(response.code) : (response.error || t('crewAddressBook.saveFailed')), 'error');
            return;
        }

        showToast(t('crewAddressBook.updated'), 'success');
        await this.loadEntries();
    },

    async handleDelete(entryId) {
        const entry = this.state.entries.find((e) => e.id === entryId);
        if (!entry) return;
        if (!confirm(t('crewAddressBook.confirmDelete', { name: entry.name || entry.email }))) return;

        const response = await apiRequest(`/crew/address-book/${entryId}`, { method: 'DELETE' });

        if (!response.success) {
            showToast(response.code ? t.error(response.code) : (response.error || t('crewAddressBook.deleteFailed')), 'error');
            return;
        }

        this.state.selectedIds.delete(entryId);
        showToast(t('crewAddressBook.deleted'), 'success');
        invalidateNavVisibility('crewAddressBook');
        await this.loadEntries();
    }
};
