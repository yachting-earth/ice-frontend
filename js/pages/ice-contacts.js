const IceContactsPage = {
    CHANNEL_LABELS: {
        email: 'E-post',
        telegram: 'Telegram',
        whatsapp: 'WhatsApp'
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
                        <h1>ICE-kontakter</h1>
                        <div class="page-header__meta">Dina nödkontakter (In Case of Emergency) som larmas om en resa inte bekräftas i tid</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h2 id="contact-form-title">Lägg till kontakt</h2>
                        <button class="btn btn-ghost btn-sm" type="button" id="contact-cancel" hidden>Avbryt ändring</button>
                    </div>
                    <div id="contact-alert"></div>
                    <form id="contact-form" novalidate>
                        <div class="field-row">
                            <div class="field">
                                <label for="contact-name">Namn</label>
                                <input type="text" id="contact-name" autocomplete="name">
                            </div>
                            <div class="field">
                                <label for="contact-relationship">Relation</label>
                                <input type="text" id="contact-relationship" placeholder="t.ex. maka, bror, vän">
                            </div>
                        </div>
                        <div class="field-row">
                            <div class="field">
                                <label for="contact-email">E-post</label>
                                <input type="email" id="contact-email" autocomplete="email">
                            </div>
                            <div class="field">
                                <label for="contact-phone">Telefon</label>
                                <input type="tel" id="contact-phone" placeholder="+46701234567">
                            </div>
                        </div>
                        <div class="field">
                            <label for="contact-channel">Föredragen notifieringskanal</label>
                            <select id="contact-channel">
                                <option value="email" selected>E-post</option>
                                <option value="telegram">Telegram</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                            <small>Larm skickas till kontakten via den här kanalen när en resa inte bekräftats i tid.</small>
                        </div>
                        <button class="btn btn-primary" type="submit" id="contact-submit">Spara kontakt</button>
                    </form>
                </div>
                <div id="contact-list-container"><div class="loading-state"><span class="spinner"></span> Laddar kontakter...</div></div>
            </div>`;

        document.getElementById('contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        document.getElementById('contact-cancel').addEventListener('click', () => this.resetForm());

        await this.loadContacts();
    },

    async loadContacts() {
        const listContainer = document.getElementById('contact-list-container');
        const response = await apiRequest('/ice-contacts');

        if (!response.success) {
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta kontakter.')}</div>`;
            return;
        }

        this.state.contacts = response.data || [];

        if (this.state.contacts.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>Inga ICE-kontakter än</h3>
                    <p>Utan en ICE-kontakt kan systemet inte larma någon om din resa inte bekräftas i tid. Lägg till minst en kontakt ovan.</p>
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
                        <span class="badge badge-published">${this.CHANNEL_LABELS[contact.preferred_channel] || escapeHtml(contact.preferred_channel)}</span>
                        <span class="crew-status ${confirmed ? 'crew-status--accepted' : 'crew-status--pending'}">
                            ${confirmed ? '✓ Bekräftad' : '⏳ Väntar på bekräftelse'}
                        </span>
                    </div>
                    <div class="trip-card__meta">
                        <span>${escapeHtml(contact.relationship || '')}</span>
                        <span>${escapeHtml(contact.email)}</span>
                        <span>${escapeHtml(contact.phone)}</span>
                    </div>
                </div>
                <div class="trip-card__actions">
                    ${!confirmed && contact.confirmation_token ? `<button class="btn btn-ghost btn-sm" type="button" data-copy-confirm="${escapeHtml(contact.confirmation_token)}">Kopiera bekräftelselänk</button>` : ''}
                    <button class="btn btn-secondary btn-sm" type="button" data-edit="${contact.id}">Ändra</button>
                    <button class="btn btn-ghost btn-sm" type="button" data-delete="${contact.id}">Ta bort</button>
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
            showToast('Länk kopierad', 'success');
        } catch (err) {
            showToast(link, 'info');
        }
    },

    startEdit(contactId) {
        const contact = this.state.contacts.find((c) => c.id === contactId);
        if (!contact) return;

        this.state.editingId = contactId;
        document.getElementById('contact-form-title').textContent = `Ändra: ${contact.name}`;
        document.getElementById('contact-name').value = contact.name || '';
        document.getElementById('contact-relationship').value = contact.relationship || '';
        document.getElementById('contact-email').value = contact.email || '';
        document.getElementById('contact-phone').value = contact.phone || '';
        document.getElementById('contact-channel').value = contact.preferred_channel || 'email';
        document.getElementById('contact-submit').textContent = 'Spara ändringar';
        document.getElementById('contact-cancel').hidden = false;
        document.getElementById('contact-alert').innerHTML = '';
        document.getElementById('contact-name').focus();
    },

    resetForm(keepAlert = false) {
        this.state.editingId = null;
        document.getElementById('contact-form').reset();
        document.getElementById('contact-form-title').textContent = 'Lägg till kontakt';
        document.getElementById('contact-submit').textContent = 'Spara kontakt';
        document.getElementById('contact-cancel').hidden = true;
        if (!keepAlert) {
            document.getElementById('contact-alert').innerHTML = '';
        }
    },

    validate(values) {
        const error = Validate.name(values.name)
            || (!values.relationship ? 'Relation krävs' : null)
            || (values.relationship.length > 50 ? 'Relation: max 50 tecken' : null)
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
                `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte spara kontakten.')}</div>`;
            return;
        }

        if (!this.state.editingId) {
            const link = response.data.confirmation_link || this.buildConfirmLink(response.data.confirmation_token);
            const alertBox = document.getElementById('contact-alert');
            alertBox.innerHTML = `
                <div class="alert alert-success">
                    Kontakten tillagd. ${response.data.confirmation_sent ? 'Ett bekräftelsemejl har skickats.' : 'E-postutskick misslyckades - dela länken manuellt:'}
                    ${!response.data.confirmation_sent ? `<br><code style="word-break: break-all;">${escapeHtml(link)}</code>` : ''}
                </div>`;
        } else {
            showToast('Kontakten uppdaterad.', 'success');
        }

        this.resetForm(true);
        await this.loadContacts();
    },

    async handleDelete(contactId) {
        const contact = this.state.contacts.find((c) => c.id === contactId);
        if (!contact) return;
        if (!confirm(`Ta bort ICE-kontakten ${contact.name}?`)) return;

        const response = await apiRequest(`/ice-contacts/${contactId}`, { method: 'DELETE' });

        if (!response.success) {
            showToast(response.error || 'Kunde inte ta bort kontakten.', 'error');
            return;
        }

        if (this.state.editingId === contactId) this.resetForm();
        showToast('Kontakten borttagen.', 'success');
        await this.loadContacts();
    }
};
