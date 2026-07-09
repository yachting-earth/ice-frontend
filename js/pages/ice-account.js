const IceAccountPage = {
    CHANNEL_LABELS: {
        email: 'E-post',
        telegram: 'Telegram',
        whatsapp: 'WhatsApp'
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
                        <h1>Mitt ICE-konto</h1>
                        <div class="page-header__meta">Skeppare du är nödkontakt (In Case of Emergency) för, och dina egna uppgifter</div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2>Radera konto efter resan</h2>
                    </div>
                    <div id="policy-alert"></div>
                    <div class="checkbox-field">
                        <input type="checkbox" id="delete-after-trip">
                        <label for="delete-after-trip">Radera mitt konto och mina uppgifter automatiskt när resan/resorna jag är nödkontakt för är avslutade</label>
                    </div>
                    <p class="text-muted" style="font-size: var(--font-size-sm);">
                        Som standard behålls ditt konto permanent. Kryssa i rutan om du istället vill att det
                        raderas automatiskt en tid efter att du inte längre är nödkontakt för någon aktiv resa.
                    </p>
                </div>

                <div id="contacts-container"><div class="loading-state"><span class="spinner"></span> Laddar...</div></div>
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
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte spara valet.')}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast(checked
            ? 'Ditt konto raderas nu automatiskt när resan/resorna är avslutade.'
            : 'Ditt konto behålls permanent.', 'success');
    },

    async loadContacts() {
        const listContainer = document.getElementById('contacts-container');
        const response = await apiRequest('/ice-contacts/me');

        if (!response.success) {
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta dina kopplingar.')}</div>`;
            return;
        }

        this.state.contacts = response.data || [];

        if (this.state.contacts.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Inga kopplingar än</h3>
                    <p>Du är inte bekräftad som nödkontakt hos någon skeppare med det här kontot.</p>
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
                    ${!editing ? `<button class="btn btn-secondary btn-sm" type="button" data-edit="${contact.id}">Ändra mina uppgifter</button>` : ''}
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
                <span>${this.CHANNEL_LABELS[contact.preferred_channel] || escapeHtml(contact.preferred_channel)}</span>
            </div>`;
    },

    renderEditForm(contact) {
        return `
            <form class="contact-edit-form" data-contact-form="${contact.id}" novalidate>
                <div class="field">
                    <label for="my-phone-${contact.id}">Telefon</label>
                    <input type="tel" id="my-phone-${contact.id}" value="${escapeHtml(contact.phone || '')}" placeholder="+46701234567">
                </div>
                <div class="field">
                    <label for="my-channel-${contact.id}">Föredragen notifieringskanal</label>
                    <select id="my-channel-${contact.id}">
                        <option value="email" ${contact.preferred_channel === 'email' ? 'selected' : ''}>E-post</option>
                        <option value="telegram" ${contact.preferred_channel === 'telegram' ? 'selected' : ''}>Telegram</option>
                        <option value="whatsapp" ${contact.preferred_channel === 'whatsapp' ? 'selected' : ''}>WhatsApp</option>
                    </select>
                </div>
                <div class="btn-group">
                    <button class="btn btn-primary btn-sm" type="submit">Spara</button>
                    <button class="btn btn-ghost btn-sm" type="button" data-cancel="${contact.id}">Avbryt</button>
                </div>
            </form>`;
    },

    startEdit(contactId) {
        this.state.editingId = contactId;
        this.rerenderCard(contactId);

        document.querySelector(`[data-contact-form="${contactId}"]`).addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave(contactId);
        });
        document.querySelector(`[data-cancel="${contactId}"]`).addEventListener('click', () => {
            this.state.editingId = null;
            this.rerenderCard(contactId);
        });
    },

    rerenderCard(contactId) {
        const contact = this.state.contacts.find((c) => c.id === contactId);
        if (!contact) return;
        const card = document.querySelector(`[data-contact="${contactId}"]`);
        if (!card) return;
        card.outerHTML = this.renderContactCard(contact);

        if (this.state.editingId === contactId) {
            document.querySelector(`[data-contact-form="${contactId}"]`).addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSave(contactId);
            });
            document.querySelector(`[data-cancel="${contactId}"]`).addEventListener('click', () => {
                this.state.editingId = null;
                this.rerenderCard(contactId);
            });
        } else {
            document.querySelector(`[data-edit="${contactId}"]`).addEventListener('click', () => this.startEdit(contactId));
        }
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
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte spara ändringarna.')}</div>`;
            return;
        }

        const index = this.state.contacts.findIndex((c) => c.id === contactId);
        this.state.contacts[index] = { ...this.state.contacts[index], ...response.data };
        this.state.editingId = null;
        this.rerenderCard(contactId);
        showToast('Dina uppgifter har uppdaterats.', 'success');
    }
};
