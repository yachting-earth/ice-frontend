const IceContactsPage = {
    channelLabels() {
        return {
            email: t('iceContacts.channelLabels.email'),
            telegram: t('iceContacts.channelLabels.telegram'),
            whatsapp: t('iceContacts.channelLabels.whatsapp')
        };
    },

    state: {
        contacts: [],
        editingId: null
    },

    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('iceContacts.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('iceContacts.subtitle'))}</div>
                    </div>
                    <button class="btn btn-primary" type="button" id="contact-add-toggle">${escapeHtml(t('iceContacts.addTitle'))}</button>
                </div>
                <div class="card" id="contact-form-card" hidden>
                    <div class="card-header">
                        <h2 id="contact-form-title">${escapeHtml(t('iceContacts.addTitle'))}</h2>
                        <button class="btn btn-ghost btn-sm" type="button" id="contact-cancel" hidden>${escapeHtml(t('iceContacts.cancelEdit'))}</button>
                    </div>
                    <div id="contact-alert"></div>
                    <form id="contact-form" novalidate>
                        <div class="field-row">
                            <div class="field">
                                <label for="contact-name">${escapeHtml(t('common.name'))}</label>
                                <input type="text" id="contact-name" autocomplete="name">
                            </div>
                            <div class="field">
                                <label for="contact-relationship">${escapeHtml(t('iceContacts.relationshipLabel'))}</label>
                                <input type="text" id="contact-relationship" placeholder="${escapeHtml(t('iceContacts.relationshipPlaceholder'))}">
                            </div>
                        </div>
                        <div class="field-row">
                            <div class="field">
                                <label for="contact-email">${escapeHtml(t('common.email'))}</label>
                                <input type="email" id="contact-email" autocomplete="email">
                            </div>
                            <div class="field">
                                <label for="contact-phone">${escapeHtml(t('common.phone'))}</label>
                                <input type="tel" id="contact-phone" placeholder="${escapeHtml(t('iceContacts.phonePlaceholder'))}">
                            </div>
                        </div>
                        <div class="field">
                            <label for="contact-channel">${escapeHtml(t('iceContacts.channelLabel'))}</label>
                            <select id="contact-channel">
                                <option value="email" selected>${escapeHtml(t('iceContacts.channelLabels.email'))}</option>
                                <option value="telegram">${escapeHtml(t('iceContacts.channelLabels.telegram'))}</option>
                                <option value="whatsapp">${escapeHtml(t('iceContacts.channelLabels.whatsapp'))}</option>
                            </select>
                            <small>${escapeHtml(t('iceContacts.channelHint'))}</small>
                        </div>
                        <button class="btn btn-primary" type="submit" id="contact-submit">${escapeHtml(t('iceContacts.submitAdd'))}</button>
                    </form>
                </div>
                <div id="contact-list-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('iceContacts.loadingContacts'))}</div></div>
            </div>`;

        document.getElementById('contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        document.getElementById('contact-cancel').addEventListener('click', () => this.resetForm());
        document.getElementById('contact-add-toggle').addEventListener('click', () => {
            if (document.getElementById('contact-form-card').hidden) {
                this.openForm();
            } else {
                this.resetForm();
            }
        });

        await this.loadContacts();
    },

    openForm() {
        document.getElementById('contact-form-card').hidden = false;
        document.getElementById('contact-add-toggle').textContent = t('common.close');
        document.getElementById('contact-name').focus();
    },

    async loadContacts() {
        const listContainer = document.getElementById('contact-list-container');
        const response = await apiRequest('/ice-contacts');

        if (!response.success) {
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('iceContacts.loadFailed')))}</div>`;
            return;
        }

        this.state.contacts = response.data || [];

        if (this.state.contacts.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>${escapeHtml(t('iceContacts.emptyTitle'))}</h3>
                    <p>${escapeHtml(t('iceContacts.emptyBody'))}</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = `<div class="trip-list">${this.state.contacts.map((c) => this.renderContactCard(c)).join('')}</div>`;

        listContainer.querySelectorAll('[data-edit]').forEach((btn) => {
            btn.addEventListener('click', () => this.startEdit(Number(btn.dataset.edit)));
        });
        listContainer.querySelectorAll('[data-delete]').forEach((btn) => {
            btn.addEventListener('click', () => this.handleDelete(Number(btn.dataset.delete)));
        });
        listContainer.querySelectorAll('[data-copy-confirm]').forEach((btn) => {
            btn.addEventListener('click', () => this.copyConfirmLink(btn.dataset.copyConfirm));
        });
    },

    renderContactCard(contact) {
        const confirmed = !!contact.confirmed_at;
        return `
            <div class="trip-card">
                <div class="stack" style="flex:1; gap: 0.35rem;">
                    <div class="trip-card__top">
                        <span class="trip-card__title">${escapeHtml(contact.name)}</span>
                        <span class="badge badge-published">${escapeHtml(this.channelLabels()[contact.preferred_channel] || contact.preferred_channel)}</span>
                        <span class="crew-status ${confirmed ? 'crew-status--accepted' : 'crew-status--pending'}">
                            ${escapeHtml(confirmed ? t('iceContacts.confirmed') : t('iceContacts.pending'))}
                        </span>
                    </div>
                    <div class="trip-card__meta">
                        <span>${escapeHtml(contact.relationship || '')}</span>
                        <span>${escapeHtml(contact.email)}</span>
                        <span>${escapeHtml(contact.phone)}</span>
                    </div>
                </div>
                <div class="trip-card__actions trip-card__actions--top">
                    ${!confirmed && contact.confirmation_token ? `<button class="btn btn-ghost btn-sm" type="button" data-copy-confirm="${escapeHtml(contact.confirmation_token)}">${escapeHtml(t('iceContacts.copyConfirmLink'))}</button>` : ''}
                    <button class="btn btn-secondary btn-sm" type="button" data-edit="${contact.id}">${escapeHtml(t('iceContacts.editButton'))}</button>
                    <button class="btn btn-ghost btn-sm" type="button" data-delete="${contact.id}">${escapeHtml(t('common.remove'))}</button>
                </div>
            </div>`;
    },

    buildConfirmLink(token) {
        return `${location.origin}${location.pathname}#/ice-confirm?token=${token}`;
    },

    async copyConfirmLink(token) {
        const link = this.buildConfirmLink(token);
        try {
            await navigator.clipboard.writeText(link);
            showToast(t('iceContacts.linkCopied'), 'success');
        } catch (err) {
            showToast(link, 'info');
        }
    },

    startEdit(contactId) {
        const contact = this.state.contacts.find((c) => c.id === contactId);
        if (!contact) return;

        this.state.editingId = contactId;
        document.getElementById('contact-form-card').hidden = false;
        document.getElementById('contact-add-toggle').textContent = t('common.close');
        document.getElementById('contact-form-title').textContent = t('iceContacts.editTitle', { name: contact.name });
        document.getElementById('contact-name').value = contact.name || '';
        document.getElementById('contact-relationship').value = contact.relationship || '';
        document.getElementById('contact-email').value = contact.email || '';
        document.getElementById('contact-phone').value = contact.phone || '';
        document.getElementById('contact-channel').value = contact.preferred_channel || 'email';
        document.getElementById('contact-submit').textContent = t('common.saveChanges');
        document.getElementById('contact-cancel').hidden = false;
        document.getElementById('contact-alert').innerHTML = '';
        document.getElementById('contact-name').focus();
    },

    resetForm(keepAlert = false, keepOpen = false) {
        this.state.editingId = null;
        document.getElementById('contact-form').reset();
        document.getElementById('contact-form-title').textContent = t('iceContacts.addTitle');
        document.getElementById('contact-submit').textContent = t('iceContacts.submitAdd');
        document.getElementById('contact-cancel').hidden = true;
        if (!keepOpen) {
            document.getElementById('contact-form-card').hidden = true;
            document.getElementById('contact-add-toggle').textContent = t('iceContacts.addTitle');
        }
        if (!keepAlert) {
            document.getElementById('contact-alert').innerHTML = '';
        }
    },

    validate(values) {
        const error = Validate.name(values.name)
            || (!values.relationship ? t('iceContacts.relationshipRequired') : null)
            || (values.relationship.length > 50 ? t('iceContacts.relationshipTooLong') : null)
            || Validate.email(values.email)
            || Validate.phone(values.phone);

        const alertBox = document.getElementById('contact-alert');
        alertBox.innerHTML = error ? `<div class="alert alert-error">${escapeHtml(error)}</div>` : '';
        return !error;
    },

    async handleSubmit() {
        const values = {
            name: document.getElementById('contact-name').value.trim(),
            relationship: document.getElementById('contact-relationship').value.trim(),
            email: document.getElementById('contact-email').value.trim(),
            phone: document.getElementById('contact-phone').value.trim(),
            preferred_channel: document.getElementById('contact-channel').value
        };

        if (!this.validate(values)) return;

        const submitBtn = document.getElementById('contact-submit');
        submitBtn.disabled = true;

        const response = this.state.editingId
            ? await apiRequest(`/ice-contacts/${this.state.editingId}`, { method: 'PUT', body: JSON.stringify(values) })
            : await apiRequest('/ice-contacts', { method: 'POST', body: JSON.stringify(values) });

        submitBtn.disabled = false;

        if (!response.success) {
            document.getElementById('contact-alert').innerHTML =
                `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('iceContacts.saveFailed')))}</div>`;
            return;
        }

        if (!this.state.editingId) {
            invalidateNavVisibility('iceContacts');
            const link = response.data.confirmation_link || this.buildConfirmLink(response.data.confirmation_token);
            const alertBox = document.getElementById('contact-alert');
            alertBox.innerHTML = `
                <div class="alert alert-success">
                    ${escapeHtml(response.data.confirmation_sent ? t('iceContacts.addedEmailSent') : t('iceContacts.addedEmailFailed'))}
                    ${!response.data.confirmation_sent ? `<br><code style="word-break: break-all;">${escapeHtml(link)}</code>` : ''}
                </div>`;
            this.resetForm(true, true);
        } else {
            showToast(t('iceContacts.updated'), 'success');
            this.resetForm();
        }

        await this.loadContacts();
    },

    async handleDelete(contactId) {
        const contact = this.state.contacts.find((c) => c.id === contactId);
        if (!contact) return;
        if (!confirm(t('iceContacts.deleteConfirm', { name: contact.name }))) return;

        const response = await apiRequest(`/ice-contacts/${contactId}`, { method: 'DELETE' });

        if (!response.success) {
            showToast(response.code ? t.error(response.code) : (response.error || t('iceContacts.deleteFailed')), 'error');
            return;
        }

        if (this.state.editingId === contactId) this.resetForm();
        showToast(t('iceContacts.deleted'), 'success');
        invalidateNavVisibility('iceContacts');
        await this.loadContacts();
    }
};
