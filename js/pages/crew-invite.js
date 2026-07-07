const CrewInvitePage = {
    state: { token: null },

    async render(container, params, query) {
        this.state.token = query.get('token');

        if (!this.state.token) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">Ingen inbjudningslänk hittades. Kontrollera att du klickade på hela länken.</div>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="page page--narrow"><div class="loading-state"><span class="spinner"></span> Laddar inbjudan...</div></div>`;

        const preview = await apiRequest(`/crew/invite/${this.state.token}`);

        if (!preview.success) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">${escapeHtml(preview.error || 'Inbjudan är ogiltig eller har gått ut.')}</div>
                    <a class="btn btn-secondary" href="#/login">Till startsidan</a>
                </div>`;
            return;
        }

        const p = preview.data;
        container.innerHTML = `
            <div class="page page--narrow">
                <h1>Du är inbjuden på en resa!</h1>
                <div class="invite-summary">
                    <dl>
                        <dt>Skeppare</dt><dd>${escapeHtml(p.skipper || '–')}</dd>
                        <dt>Fartyg</dt><dd>${escapeHtml(p.vessel || '–')}</dd>
                        <dt>Avgång</dt><dd>${formatDateTime(p.planned_departure)}</dd>
                        <dt>Ankomst</dt><dd>${formatDateTime(p.planned_arrival)}</dd>
                        <dt>Besättning hittills</dt><dd>${p.current_crew_count} personer</dd>
                    </dl>
                </div>

                <div id="accept-alert"></div>

                <form id="accept-form" novalidate>
                    <div class="field">
                        <label for="name">Ditt namn</label>
                        <input type="text" id="name" required>
                    </div>
                    <div class="field">
                        <label for="phone">Telefonnummer (valfritt)</label>
                        <input type="tel" id="phone" placeholder="+46701234567">
                    </div>
                    <div class="field">
                        <label for="ice-contact">Din ICE-kontakt (vid nödsituation)</label>
                        <input type="text" id="ice-contact" placeholder="t.ex. Erik (make) +46701234568">
                        <small>Namn och telefonnummer till någon som ska kontaktas om något händer.</small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-primary" type="submit" id="accept-submit">Acceptera & gå med</button>
                    </div>
                </form>
            </div>`;

        document.getElementById('accept-form').addEventListener('submit', (e) => this.handleAccept(e));
    },

    async handleAccept(e) {
        e.preventDefault();

        const alertBox = document.getElementById('accept-alert');
        const submitBtn = document.getElementById('accept-submit');

        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const iceContact = document.getElementById('ice-contact').value.trim();

        const error = Validate.name(name) || Validate.phone(phone, true);
        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Går med...';

        const response = await apiRequest(`/crew/invite/${this.state.token}`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                phone: phone || undefined,
                ice_contact: iceContact || undefined
            })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte gå med i resan.')}</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Acceptera & gå med';
            return;
        }

        document.getElementById('accept-form').outerHTML = `
            <div class="alert alert-success">Du är nu med i besättningen. Ha en trevlig och säker resa!</div>`;
    }
};
