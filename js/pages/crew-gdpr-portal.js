/**
 * Public crew self-service GDPR portal (#/crew-gdpr-portal?token=..).
 * Reached via the magic link mailed by CrewGdprHandler::requestLink(). Lets
 * a crew/ICE-contact guest (no account) export their data, erase what's
 * safe to erase immediately (trip_crew rows on already-finished trips), or
 * send a message - all scoped to the token's email address.
 */
const CrewGdprPortalPage = {
    state: { token: null, summary: null },

    async render(container, params, query) {
        this.container = container;
        this.state.token = query.get('token');

        if (!this.state.token) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">${escapeHtml(t('crewGdprPortal.noToken'))}</div>
                    <a class="btn btn-secondary" href="#/crew-gdpr">${escapeHtml(t('crewGdprPortal.requestNew'))}</a>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="page page--narrow"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('crewGdprPortal.loading'))}</div></div>`;

        const response = await apiRequest(`/crew-gdpr/portal/${encodeURIComponent(this.state.token)}`);

        if (!response.success) {
            const message = response.code === 'CREW_GDPR_TOKEN_EXPIRED'
                ? t('crewGdprPortal.linkExpired')
                : (response.code ? t.error(response.code) : (response.error || t('crewGdprPortal.invalidLink')));
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">${escapeHtml(message)}</div>
                    <a class="btn btn-secondary" href="#/crew-gdpr">${escapeHtml(t('crewGdprPortal.requestNew'))}</a>
                </div>`;
            return;
        }

        this.state.summary = response.data;
        this.renderPortal();
    },

    renderPortal() {
        const { email, crew_memberships: memberships, ice_contact_count: iceCount } = this.state.summary;

        const membershipsHtml = memberships.length
            ? memberships.map((m) => `
                <li class="card" style="margin-bottom: var(--space-2);">
                    <strong>${escapeHtml(m.vessel_name)}</strong> ${escapeHtml(t('crewGdprPortal.withSkipper', { skipper: m.skipper_name }))}<br>
                    <span class="text-muted" style="font-size: var(--font-size-sm);">
                        ${escapeHtml(formatDateTime(m.departure_scheduled))} &rarr; ${escapeHtml(formatDateTime(m.arrival_scheduled))}
                        &middot; ${escapeHtml(t('crewGdprPortal.tripStatus.' + m.trip_status))}
                    </span>
                    ${m.locked ? `<div class="alert alert-info" style="margin-top: var(--space-2);">${escapeHtml(t('crewGdprPortal.notErasableLocked'))}</div>` : (!m.erasable ? `<div class="alert alert-info" style="margin-top: var(--space-2);">${escapeHtml(t('crewGdprPortal.notErasableActive'))}</div>` : '')}
                </li>`).join('')
            : `<p class="text-muted">${escapeHtml(t('crewGdprPortal.noMemberships'))}</p>`;

        const hasErasable = memberships.some((m) => m.erasable);

        this.container.innerHTML = `
            <div class="page page--narrow">
                <h1>${escapeHtml(t('crewGdprPortal.title'))}</h1>
                <p class="text-muted">${escapeHtml(t('crewGdprPortal.intro', { email }))}</p>

                <h2>${escapeHtml(t('crewGdprPortal.membershipsTitle'))}</h2>
                <ul style="list-style:none; padding:0;">${membershipsHtml}</ul>
                ${iceCount > 0 ? `<p class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(t('crewGdprPortal.iceContactNote', { count: iceCount }))}</p>` : ''}

                <div class="card">
                    <h2>${escapeHtml(t('crewGdprPortal.exportTitle'))}</h2>
                    <p class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(t('crewGdprPortal.exportHint'))}</p>
                    <a class="btn btn-secondary" href="${CONFIG.API_BASE_URL}/crew-gdpr/export/${encodeURIComponent(this.state.token)}">${escapeHtml(t('crewGdprPortal.exportButton'))}</a>
                </div>

                <div class="card">
                    <h2>${escapeHtml(t('crewGdprPortal.eraseTitle'))}</h2>
                    <p class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(t('crewGdprPortal.eraseHint'))}</p>
                    <div id="crew-gdpr-erase-alert"></div>
                    <button type="button" class="btn btn-danger" id="crew-gdpr-erase-btn" ${hasErasable ? '' : 'disabled'}>${escapeHtml(t('crewGdprPortal.eraseButton'))}</button>
                </div>

                <div class="card">
                    <h2>${escapeHtml(t('crewGdprPortal.contactTitle'))}</h2>
                    <p class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(t('crewGdprPortal.contactHint'))}</p>
                    <div id="crew-gdpr-contact-alert"></div>
                    <form id="crew-gdpr-contact-form" novalidate>
                        <div class="field">
                            <label for="crew-gdpr-message">${escapeHtml(t('crewGdprPortal.messageLabel'))}</label>
                            <textarea id="crew-gdpr-message" rows="4"></textarea>
                        </div>
                        <button class="btn btn-primary" type="submit" id="crew-gdpr-contact-submit">${escapeHtml(t('crewGdprPortal.contactSubmit'))}</button>
                    </form>
                </div>
            </div>`;

        document.getElementById('crew-gdpr-erase-btn').addEventListener('click', () => this.handleErase());
        document.getElementById('crew-gdpr-contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContactSubmit();
        });
    },

    async handleErase() {
        if (!confirm(t('crewGdprPortal.eraseConfirm'))) {
            return;
        }

        const alertBox = document.getElementById('crew-gdpr-erase-alert');
        const btn = document.getElementById('crew-gdpr-erase-btn');
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('crewGdprPortal.erasing'))}`;

        const response = await apiRequest(`/crew-gdpr/erase/${encodeURIComponent(this.state.token)}`, { method: 'POST' });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('crewGdprPortal.eraseFailed')))}</div>`;
            btn.disabled = false;
            btn.textContent = t('crewGdprPortal.eraseButton');
            return;
        }

        const { erased, kept_active: keptActive, kept_locked: keptLocked } = response.data;
        let message = t('crewGdprPortal.eraseSuccess', { count: erased });
        if (keptActive.length) {
            message += ' ' + t('crewGdprPortal.eraseKeptActive', { count: keptActive.length });
        }
        if (keptLocked && keptLocked.length) {
            message += ' ' + t('crewGdprPortal.eraseKeptLocked', { count: keptLocked.length });
        }
        alertBox.innerHTML = `<div class="alert alert-success">${escapeHtml(message)}</div>`;
        btn.remove();

        // Refresh the portal data so the erased memberships disappear from the list.
        const refreshed = await apiRequest(`/crew-gdpr/portal/${encodeURIComponent(this.state.token)}`);
        if (refreshed.success) {
            this.state.summary = refreshed.data;
            this.renderPortal();
        }
    },

    async handleContactSubmit() {
        const alertBox = document.getElementById('crew-gdpr-contact-alert');
        const message = document.getElementById('crew-gdpr-message').value.trim();

        const error = Validate.contactMessage(message);
        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        const submitBtn = document.getElementById('crew-gdpr-contact-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('crewGdprPortal.contactSubmitting'))}`;

        const response = await apiRequest(`/crew-gdpr/contact/${encodeURIComponent(this.state.token)}`, {
            method: 'POST',
            body: JSON.stringify({ message })
        });

        submitBtn.disabled = false;
        submitBtn.textContent = t('crewGdprPortal.contactSubmit');

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('crewGdprPortal.contactFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = `<div class="alert alert-success">${escapeHtml(t('crewGdprPortal.contactSuccess'))}</div>`;
        document.getElementById('crew-gdpr-contact-form').reset();
    }
};
