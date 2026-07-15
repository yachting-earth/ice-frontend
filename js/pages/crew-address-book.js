const CrewAddressBookPage = {
    state: {
        entries: []
    },

    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('crewAddressBook.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('crewAddressBook.subtitle'))}</div>
                    </div>
                </div>
                <div id="address-book-list-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('crewAddressBook.loading'))}</div></div>
            </div>`;

        await this.loadEntries();
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
            return;
        }

        listContainer.innerHTML = `<div class="trip-list">${this.state.entries.map((e) => this.renderCard(e)).join('')}</div>`;

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
    },

    renderCard(entry) {
        return `
            <div class="trip-card" data-id="${entry.id}">
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

        showToast(t('crewAddressBook.deleted'), 'success');
        invalidateNavVisibility('crewAddressBook');
        await this.loadEntries();
    }
};
