const IceAccountPage = {
    channelLabels() {
        return {
            email: t('iceAccount.channelLabels.email'),
            telegram: t('iceAccount.channelLabels.telegram')
        };
    },

    state: {
        user: null,
        contacts: [],
        editingId: null
    },

    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('iceAccount.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('iceAccount.subtitle'))}</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2>${escapeHtml(t('iceAccount.deletePolicyHeading'))}</h2>
                    </div>
                    <div id="policy-alert"></div>
                    <div class="checkbox-field">
                        <input type="checkbox" id="delete-after-trip">
                        <label for="delete-after-trip">${escapeHtml(t('iceAccount.deletePolicyLabel'))}</label>
                    </div>
                    <p class="text-muted" style="font-size: var(--font-size-sm);">
                        ${escapeHtml(t('iceAccount.deletePolicyHint'))}
                    </p>
                </div>

                <div id="contacts-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('iceAccount.loading'))}</div></div>
            </div>`;

        document.getElementById('delete-after-trip').addEventListener('change', (e) => this.handlePolicyChange(e.target.checked));

        await this.loadUser();
        await this.loadContacts();
    },

    async loadUser() {
        const response = await apiRequest('/user/profile');
        if (!response.success) return;

        this.state.user = response.data;
        document.getElementById('delete-after-trip').checked = !!Number(response.data.delete_after_trip);
    },

    async handlePolicyChange(checked) {
        const alertBox = document.getElementById('policy-alert');
        const response = await apiRequest('/user/delete-after-trip', {
            method: 'PUT',
            body: JSON.stringify({ delete_after_trip: checked })
        });

        if (!response.success) {
            document.getElementById('delete-after-trip').checked = !checked;
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('iceAccount.policySaveFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast(checked
            ? t('iceAccount.policyEnabled')
            : t('iceAccount.policyDisabled'), 'success');
    },

    async loadContacts() {
        const listContainer = document.getElementById('contacts-container');
        const response = await apiRequest('/ice-contacts/me');

        if (!response.success) {
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('iceAccount.loadContactsFailed')))}</div>`;
            return;
        }

        this.state.contacts = response.data || [];

        if (this.state.contacts.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>${escapeHtml(t('iceAccount.emptyTitle'))}</h3>
                    <p>${escapeHtml(t('iceAccount.emptyBody'))}</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = this.state.contacts.map((c) => this.renderContactCard(c)).join('');

        listContainer.querySelectorAll('[data-edit]').forEach((btn) => {
            btn.addEventListener('click', () => this.startEdit(Number(btn.dataset.edit)));
        });
    },

    renderContactCard(contact) {
        const editing = this.state.editingId === contact.id;

        return `
            <div class="card" data-contact="${contact.id}">
                <div class="card-header">
                    <h2>${escapeHtml(contact.skipper_name || '–')}</h2>
                    ${!editing ? `<button class="btn btn-secondary btn-sm" type="button" data-edit="${contact.id}">${escapeHtml(t('iceAccount.editMyDetails'))}</button>` : ''}
                </div>
                <div class="trip-card__meta">
                    <span>${escapeHtml(contact.relationship || '')}</span>
                </div>
                <div id="contact-alert-${contact.id}"></div>
                ${editing ? this.renderEditForm(contact) : this.renderSummary(contact)}
            </div>`;
    },

    renderSummary(contact) {
        return `
            <div class="trip-card__meta">
                <span>${escapeHtml(contact.phone || '')}</span>
                <span>${escapeHtml(this.channelLabels()[contact.preferred_channel] || contact.preferred_channel)}</span>
            </div>`;
    },

    renderEditForm(contact) {
        return `
            <form class="contact-edit-form" data-contact-form="${contact.id}" novalidate>
                <div class="field">
                    <label for="my-phone-${contact.id}">${escapeHtml(t('common.phone'))}</label>
                    <input type="tel" id="my-phone-${contact.id}" value="${escapeHtml(contact.phone || '')}" placeholder="${escapeHtml(t('iceAccount.phonePlaceholder'))}">
                </div>
                <div class="field">
                    <label for="my-channel-${contact.id}">${escapeHtml(t('iceAccount.channelLabel'))}</label>
                    <select id="my-channel-${contact.id}">
                        <option value="email" ${contact.preferred_channel === 'email' ? 'selected' : ''}>${escapeHtml(t('iceAccount.channelLabels.email'))}</option>
                        <option value="telegram" ${contact.preferred_channel === 'telegram' ? 'selected' : ''}>${escapeHtml(t('iceAccount.channelLabels.telegram'))}</option>
                    </select>
                </div>
                <div id="telegram-widget-${contact.id}" hidden></div>
                <div class="btn-group">
                    <button class="btn btn-primary btn-sm" type="submit">${escapeHtml(t('common.save'))}</button>
                    <button class="btn btn-ghost btn-sm" type="button" data-cancel="${contact.id}">${escapeHtml(t('common.cancel'))}</button>
                </div>
            </form>`;
    },

    startEdit(contactId) {
        this.state.editingId = contactId;
        this.rerenderCard(contactId);
        this.bindEditFormListeners(contactId);
    },

    rerenderCard(contactId) {
        const contact = this.state.contacts.find((c) => c.id === contactId);
        if (!contact) return;
        const card = document.querySelector(`[data-contact="${contactId}"]`);
        if (!card) return;
        card.outerHTML = this.renderContactCard(contact);

        if (this.state.editingId === contactId) {
            this.bindEditFormListeners(contactId);
        } else {
            document.querySelector(`[data-edit="${contactId}"]`).addEventListener('click', () => this.startEdit(contactId));
        }
    },

    bindEditFormListeners(contactId) {
        document.querySelector(`[data-contact-form="${contactId}"]`).addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave(contactId);
        });
        document.querySelector(`[data-cancel="${contactId}"]`).addEventListener('click', () => {
            this.state.editingId = null;
            this.rerenderCard(contactId);
        });

        const channelSelect = document.getElementById(`my-channel-${contactId}`);
        channelSelect.addEventListener('change', (e) => this.handleChannelSelect(contactId, e.target.value));

        // Selecting telegram earlier (or a legacy row saved before this
        // account was linked) should still surface the onboarding widget
        // if the account isn't actually linked (yet/anymore).
        if (channelSelect.value === 'telegram') {
            this.handleChannelSelect(contactId, 'telegram');
        }
    },

    // Triggered by the per-contact preferred-channel <select> - see
    // renderEditForm(). Telegram delivery for this contact rides on the
    // caller's own account-wide Telegram link (backend gates this too, in
    // IceContactHandler::updateMine()), so picking "telegram" here shows the
    // same onboarding widget used on the profile page rather than a
    // per-contact chat ID field.
    async handleChannelSelect(contactId, channel) {
        const widget = document.getElementById(`telegram-widget-${contactId}`);
        if (!widget) return;

        if (channel !== 'telegram') {
            widget.hidden = true;
            return;
        }

        const status = await apiRequest('/user/telegram/status');
        if (status.success && status.data.linked) {
            widget.hidden = true;
            return;
        }

        widget.hidden = false;
        await TelegramLink.render(widget);
    },

    async handleSave(contactId) {
        const phone = document.getElementById(`my-phone-${contactId}`).value.trim();
        const preferredChannel = document.getElementById(`my-channel-${contactId}`).value;
        const alertBox = document.getElementById(`contact-alert-${contactId}`);

        const error = Validate.phone(phone);
        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        const response = await apiRequest(`/ice-contacts/me/${contactId}`, {
            method: 'PUT',
            body: JSON.stringify({ phone, preferred_channel: preferredChannel })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('iceAccount.saveFailed')))}</div>`;
            return;
        }

        const index = this.state.contacts.findIndex((c) => c.id === contactId);
        this.state.contacts[index] = { ...this.state.contacts[index], ...response.data };
        this.state.editingId = null;
        this.rerenderCard(contactId);
        showToast(t('iceAccount.updated'), 'success');
    }
};
