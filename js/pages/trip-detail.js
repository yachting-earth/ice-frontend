const TripDetailPage = {
    STATUS_LABELS: {
        draft: 'Utkast',
        published: 'Publicerad',
        active: 'Aktiv',
        completed: 'Avslutad',
        cancelled: 'Inställd'
    },

    state: { tripId: null, data: null, map: null },

    async render(container, params) {
        this.state.tripId = params.tripId;
        container.innerHTML = `<div class="page"><div class="loading-state"><span class="spinner"></span> Laddar resa...</div></div>`;
        await this.load(container);
    },

    async load(container) {
        const response = await apiRequest(`/trips/${this.state.tripId}`);

        if (!response.success) {
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta resan.')}</div>
                    <a class="btn btn-secondary" href="#/dashboard">Tillbaka till mina resor</a>
                </div>`;
            return;
        }

        this.state.data = response.data;
        this.renderPage(container);
    },

    renderPage(container) {
        const { trip, vessel, crew, routes } = this.state.data;
        const graceLabel = CONFIG.GRACE_PERIOD_OPTIONS.find((g) => g.seconds === Number(trip.grace_period_seconds))?.label
            || `${Math.round(trip.grace_period_seconds / 3600)} tim`;

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(vessel?.vessel_name || 'Okänt fartyg')}
                            <span class="badge badge-${trip.status}">${this.STATUS_LABELS[trip.status] || trip.status}</span>
                        </h1>
                        <div class="page-header__meta">
                            Avgång ${formatDateTime(trip.departure_scheduled)} · Ankomst ${formatDateTime(trip.arrival_scheduled)}
                            · Marginal ${graceLabel}
                            ${trip.ice_notified ? ' · <strong>ICE-kontakt notifierad</strong>' : ''}
                        </div>
                    </div>
                    <a class="btn btn-ghost btn-sm" href="#/dashboard">← Tillbaka</a>
                </div>

                <div id="trip-detail-alert"></div>

                <div class="card" id="actions-card"></div>

                <div class="card">
                    <h3>Fartyg</h3>
                    <div style="display:flex; align-items:center; gap: var(--space-3);">
                        <img id="vessel-photo" alt=""
                            style="width:64px;height:64px;border-radius:var(--radius-md);object-fit:cover;background:var(--color-bg);" hidden>
                        <p class="mb-0">
                            ${escapeHtml(vessel?.vessel_name || '–')}
                            ${vessel?.model ? ` · ${escapeHtml(vessel.model)}` : ''}
                            ${vessel?.year_built ? ` · Årsmodell ${escapeHtml(String(vessel.year_built))}` : ''}
                            ${vessel?.mmsi ? ` · MMSI ${escapeHtml(vessel.mmsi)}` : ''}
                            ${vessel?.call_sign ? ` · Anropssignal ${escapeHtml(vessel.call_sign)}` : ''}
                            ${this.formatDimensions(vessel) ? ` · ${escapeHtml(this.formatDimensions(vessel))}` : ''}
                        </p>
                    </div>
                    ${vessel?.notes ? `<p class="mb-0" style="margin-top: var(--space-2); color: var(--color-text-muted); white-space: pre-wrap;">${escapeHtml(vessel.notes)}</p>` : ''}
                    <div id="vessel-photo-alert"></div>
                    <div class="field-row" style="margin-top: var(--space-3);">
                        <div class="field">
                            <label for="vessel-photo-input">${vessel?.photo_path ? 'Byt fartygsfoto' : 'Lägg till fartygsfoto'}</label>
                            <input type="file" id="vessel-photo-input" accept="image/jpeg,image/png">
                        </div>
                        <button class="btn btn-secondary btn-sm" type="button" id="vessel-photo-submit" style="align-self:flex-end;">Spara foto</button>
                    </div>
                </div>

                <div class="card">
                    <h3>Rutter</h3>
                    <div id="routes-alert"></div>
                    <div id="routes-list"></div>
                    <div id="trip-route-map" class="map-container"></div>
                    <hr class="section-divider">
                    <h3>Lägg till alternativ rutt</h3>
                    <div class="field">
                        <label for="new-route-windy-url">Windy-länk</label>
                        <input type="url" id="new-route-windy-url" placeholder="https://www.windy.com/route-planner/boat/...">
                    </div>
                    <div class="field">
                        <label for="new-route-reason">Anledning (valfritt)</label>
                        <input type="text" id="new-route-reason" placeholder="t.ex. Om vinden vrider nordlig">
                    </div>
                    <button class="btn btn-secondary btn-sm" type="button" id="add-route-btn">+ Lägg till rutt</button>
                </div>

                <div class="card">
                    <h3>Besättning</h3>
                    <div id="crew-list-container"></div>
                    <hr class="section-divider">
                    <h3>Bjud in besättningsmedlem</h3>
                    <div id="invite-alert"></div>
                    <div class="field-row">
                        <div class="field">
                            <label for="invite-email">E-post</label>
                            <input type="email" id="invite-email">
                        </div>
                        <div class="field">
                            <label for="invite-name">Namn (valfritt)</label>
                            <input type="text" id="invite-name">
                        </div>
                    </div>
                    <button class="btn btn-secondary" type="button" id="invite-crew-btn">Skicka inbjudan</button>
                </div>
            </div>`;

        this.renderActions(trip);
        this.renderRoutes(routes);
        this.renderCrew(crew);
        if (vessel?.photo_path) {
            this.loadVesselPhoto(vessel.id);
        }

        document.getElementById('invite-crew-btn').addEventListener('click', () => this.handleInviteCrew());
        document.getElementById('vessel-photo-submit').addEventListener('click', () => this.handleVesselPhotoSubmit(vessel.id));
        document.getElementById('add-route-btn').addEventListener('click', () => this.handleAddRoute());
    },

    formatDimensions(vessel) {
        return [
            vessel?.length_m ? `L ${Number(vessel.length_m)} m` : '',
            vessel?.width_m ? `B ${Number(vessel.width_m)} m` : '',
            vessel?.draft_m ? `D ${Number(vessel.draft_m)} m` : ''
        ].filter(Boolean).join(' × ');
    },

    // Photos are auth-protected, so a plain <img src> won't do (no way to
    // attach the Authorization header) - fetch as blob and swap in
    async loadVesselPhoto(vesselId) {
        const img = document.getElementById('vessel-photo');
        if (!img) return;
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/vessels/${vesselId}/photo`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) return;
            img.src = URL.createObjectURL(await response.blob());
            img.hidden = false;
        } catch (err) { /* leave the photo hidden */ }
    },

    async handleVesselPhotoSubmit(vesselId) {
        const alertBox = document.getElementById('vessel-photo-alert');
        const photoFile = document.getElementById('vessel-photo-input').files[0];

        if (!photoFile) {
            alertBox.innerHTML = `<div class="alert alert-error">Välj en bild först.</div>`;
            return;
        }

        const submitBtn = document.getElementById('vessel-photo-submit');
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('photo', photoFile);
        const response = await apiUpload(`/vessels/${vesselId}/photo`, formData, 'PUT');

        submitBtn.disabled = false;

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte spara fotot.')}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast('Fartygsfotot har sparats.', 'success');
        await this.loadVesselPhoto(vesselId);
    },

    renderActions(trip) {
        const actionsCard = document.getElementById('actions-card');

        if (trip.status === 'draft' || trip.status === 'published') {
            actionsCard.innerHTML = `
                <h3>Åtgärder</h3>
                <p class="text-muted">Resan är inte aktiv än. Aktivera den manuellt, eller så aktiveras den automatiskt när första besättningsmedlemmen accepterar sin inbjudan.</p>
                <button class="btn btn-primary" type="button" id="activate-btn">Aktivera resa</button>`;
            document.getElementById('activate-btn').addEventListener('click', () => this.handleActivate());
            return;
        }

        if (trip.status === 'active') {
            actionsCard.innerHTML = `
                <h3>Åtgärder</h3>
                <div class="stack">
                    <div>
                        <label style="font-size: var(--font-size-sm); font-weight:600; color: var(--color-text-muted);">Snooza ankomsttid</label>
                        <div class="btn-group" style="margin-top: var(--space-2);">
                            ${CONFIG.SNOOZE_PRESETS.map((m) => `<button class="btn btn-secondary btn-sm snooze-btn" data-minutes="${m}" type="button">+${m} min</button>`).join('')}
                        </div>
                    </div>
                    <button class="btn btn-primary" type="button" id="verify-btn">✓ Verifiera ankomst</button>
                </div>`;

            actionsCard.querySelectorAll('.snooze-btn').forEach((btn) => {
                btn.addEventListener('click', () => this.handleSnooze(Number(btn.dataset.minutes)));
            });
            document.getElementById('verify-btn').addEventListener('click', () => this.handleVerify());
            return;
        }

        actionsCard.innerHTML = `<h3>Åtgärder</h3><p class="text-muted mb-0">Resan är ${this.STATUS_LABELS[trip.status]?.toLowerCase() || trip.status} - inga fler åtgärder tillgängliga.</p>`;
    },

    renderRoutes(routes) {
        const list = document.getElementById('routes-list');
        routes = routes || [];

        if (routes.length === 0) {
            list.innerHTML = `<p class="text-muted">Inga rutter tillagda.</p>`;
        } else {
            list.innerHTML = routes.map((r, i) => `
                <div class="route-item" data-route-id="${r.id}">
                    <div class="route-item__title">
                        ${i === 0 ? 'Huvudrutt' : `Alternativ rutt ${i}`}
                        <div class="btn-group" style="margin-left:auto;">
                            <button class="btn btn-ghost btn-sm move-route-up" type="button" data-id="${r.id}" ${i === 0 ? 'disabled' : ''} title="Flytta upp">↑</button>
                            <button class="btn btn-ghost btn-sm move-route-down" type="button" data-id="${r.id}" ${i === routes.length - 1 ? 'disabled' : ''} title="Flytta ner">↓</button>
                            <button class="btn btn-ghost btn-sm edit-route-btn" type="button" data-id="${r.id}">Redigera</button>
                            <button class="btn btn-danger btn-sm delete-route-btn" type="button" data-id="${r.id}">Ta bort</button>
                        </div>
                    </div>
                    <div class="route-item__view" data-id="${r.id}">
                        ${r.reason ? `<div class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(r.reason)}</div>` : ''}
                    </div>
                    <div class="route-item__edit" data-id="${r.id}" hidden>
                        <div class="field">
                            <label>Windy-länk</label>
                            <input type="url" class="edit-route-windy-url" data-id="${r.id}" value="${escapeHtml(r.raw_windy_url || '')}">
                        </div>
                        <div class="field">
                            <label>Anledning</label>
                            <input type="text" class="edit-route-reason" data-id="${r.id}" value="${escapeHtml(r.reason || '')}">
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-primary btn-sm save-route-btn" type="button" data-id="${r.id}">Spara</button>
                            <button class="btn btn-ghost btn-sm cancel-route-edit-btn" type="button" data-id="${r.id}">Avbryt</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        list.querySelectorAll('.move-route-up').forEach((btn) => {
            btn.addEventListener('click', () => this.handleMoveRoute(btn.dataset.id, -1));
        });
        list.querySelectorAll('.move-route-down').forEach((btn) => {
            btn.addEventListener('click', () => this.handleMoveRoute(btn.dataset.id, 1));
        });
        list.querySelectorAll('.delete-route-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.handleDeleteRoute(btn.dataset.id));
        });
        list.querySelectorAll('.edit-route-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                list.querySelector(`.route-item__view[data-id="${btn.dataset.id}"]`).hidden = true;
                list.querySelector(`.route-item__edit[data-id="${btn.dataset.id}"]`).hidden = false;
            });
        });
        list.querySelectorAll('.cancel-route-edit-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                list.querySelector(`.route-item__view[data-id="${btn.dataset.id}"]`).hidden = false;
                list.querySelector(`.route-item__edit[data-id="${btn.dataset.id}"]`).hidden = true;
            });
        });
        list.querySelectorAll('.save-route-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.handleSaveRoute(btn.dataset.id));
        });

        const mapEl = document.getElementById('trip-route-map');
        const colors = ['#1e88a8', '#a06600', '#b3261e', '#1a7f4e'];
        const mapRoutes = routes
            .map((r, i) => ({ coordinates: parseWktLineString(r.geometry_wkt), color: colors[i % colors.length], label: r.reason || (i === 0 ? 'Huvudrutt' : `Alternativ rutt ${i}`) }))
            .filter((r) => r.coordinates.length > 1);

        if (mapRoutes.length > 0) {
            this.state.map = renderRouteMap(mapEl, mapRoutes);
        } else {
            mapEl.innerHTML = '<div class="empty-state">Ingen rutt att visa</div>';
        }
    },

    async handleAddRoute() {
        const alertBox = document.getElementById('routes-alert');
        const windyUrl = document.getElementById('new-route-windy-url').value.trim();
        const reason = document.getElementById('new-route-reason').value.trim();

        const urlError = Validate.windyUrl(windyUrl);
        if (urlError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(urlError)}</div>`;
            return;
        }

        const response = await apiRequest(`/trips/${this.state.tripId}/routes`, {
            method: 'POST',
            body: JSON.stringify({ windy_url: windyUrl, reason: reason || null })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte lägga till rutten.')}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast('Rutt tillagd', 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleSaveRoute(routeId) {
        const alertBox = document.getElementById('routes-alert');
        const windyUrl = document.querySelector(`.edit-route-windy-url[data-id="${routeId}"]`).value.trim();
        const reason = document.querySelector(`.edit-route-reason[data-id="${routeId}"]`).value.trim();

        const urlError = Validate.windyUrl(windyUrl);
        if (urlError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(urlError)}</div>`;
            return;
        }

        const response = await apiRequest(`/routes/${routeId}`, {
            method: 'PUT',
            body: JSON.stringify({ windy_url: windyUrl, reason: reason || null })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte spara rutten.')}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast('Rutten har sparats', 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleDeleteRoute(routeId) {
        if (!confirm('Ta bort den här rutten?')) return;

        const response = await apiRequest(`/routes/${routeId}`, { method: 'DELETE' });
        if (!response.success) {
            document.getElementById('routes-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte ta bort rutten.')}</div>`;
            return;
        }

        showToast('Rutten har tagits bort', 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleMoveRoute(routeId, direction) {
        const routes = this.state.data.routes || [];
        const ids = routes.map((r) => r.id);
        const index = ids.indexOf(routeId);
        const targetIndex = index + direction;

        if (index === -1 || targetIndex < 0 || targetIndex >= ids.length) return;

        [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];

        const response = await apiRequest(`/trips/${this.state.tripId}/routes/reorder`, {
            method: 'PUT',
            body: JSON.stringify({ route_ids: ids })
        });

        if (!response.success) {
            document.getElementById('routes-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte ändra ordning.')}</div>`;
            return;
        }

        await this.load(document.getElementById('page-content'));
    },

    renderCrew(crew) {
        const container = document.getElementById('crew-list-container');

        if (!crew || crew.length === 0) {
            container.innerHTML = `<p class="text-muted">Ingen besättning inbjuden än.</p>`;
            return;
        }

        container.innerHTML = `<div class="crew-list">${crew.map((c) => {
            const accepted = !!c.accepted_at;
            return `
                <div class="crew-row">
                    <img class="crew-photo" data-crew-id="${c.id}" alt=""
                        style="width:40px;height:40px;border-radius:50%;object-fit:cover;margin-right:var(--space-3);background:var(--color-bg);" hidden>
                    <div class="crew-row__info">
                        <span class="crew-row__name">${escapeHtml(c.name || c.email || 'Okänd')}</span>
                        <span class="crew-row__detail">
                            ${c.email ? escapeHtml(c.email) : ''}${c.phone ? ` · ${escapeHtml(c.phone)}` : ''}
                            ${c.ice_contact ? ` · ICE: ${escapeHtml(c.ice_contact)}` : ''}
                        </span>
                        <label class="text-muted" style="font-size: var(--font-size-sm); display:block; margin-top: var(--space-1);">
                            <input type="file" class="crew-photo-input" data-crew-id="${c.id}" accept="image/jpeg,image/png" style="max-width: 220px;">
                        </label>
                    </div>
                    <div class="stack" style="flex-direction: row; align-items: center; gap: var(--space-3);">
                        <span class="crew-status ${accepted ? 'crew-status--accepted' : 'crew-status--pending'}">
                            ${accepted ? '✓ Accepterad' : '⏳ Väntar'}
                        </span>
                        <button class="btn btn-ghost btn-sm crew-photo-submit" data-crew-id="${c.id}" type="button">${c.photo_path ? 'Byt foto' : 'Lägg till foto'}</button>
                        ${!accepted && c.invitation_token ? `<button class="btn btn-ghost btn-sm copy-link-btn" data-token="${escapeHtml(c.invitation_token)}" type="button">Kopiera länk</button>` : ''}
                        <button class="btn btn-danger btn-sm remove-crew-btn" data-crew-id="${c.id}" type="button">Ta bort</button>
                    </div>
                </div>`;
        }).join('')}</div>`;

        container.querySelectorAll('.copy-link-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.copyInviteLink(btn.dataset.token));
        });
        container.querySelectorAll('.remove-crew-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.handleRemoveCrew(btn.dataset.crewId));
        });
        container.querySelectorAll('.crew-photo-submit').forEach((btn) => {
            btn.addEventListener('click', () => this.handleCrewPhotoSubmit(btn.dataset.crewId));
        });

        this.loadCrewPhotos(container);
    },

    async handleCrewPhotoSubmit(crewId) {
        const input = document.querySelector(`.crew-photo-input[data-crew-id="${crewId}"]`);
        const photoFile = input.files[0];

        if (!photoFile) {
            showToast('Välj en bild först.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('photo', photoFile);
        const response = await apiUpload(`/crew/${crewId}/photo`, formData, 'PUT');

        if (!response.success) {
            showToast(response.error || 'Kunde inte spara fotot.', 'error');
            return;
        }

        showToast('Fotot har sparats.', 'success');
        await this.load(document.getElementById('page-content'));
    },

    // Photos are auth-protected, so a plain <img src> won't do (no way to
    // attach the Authorization header) - fetch as blob and swap in
    async loadCrewPhotos(container) {
        const token = Auth.getToken();
        container.querySelectorAll('.crew-photo').forEach(async (img) => {
            try {
                const response = await fetch(`${CONFIG.API_BASE_URL}/photos/${img.dataset.crewId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) return;
                img.src = URL.createObjectURL(await response.blob());
                img.hidden = false;
            } catch (err) { /* leave the photo hidden */ }
        });
    },

    buildInviteLink(token) {
        return `${location.origin}${location.pathname}#/crew-join?token=${token}`;
    },

    async copyInviteLink(token) {
        const link = this.buildInviteLink(token);
        try {
            await navigator.clipboard.writeText(link);
            showToast('Länk kopierad', 'success');
        } catch (err) {
            showToast(link, 'info');
        }
    },

    async handleActivate() {
        const response = await apiRequest(`/trips/${this.state.tripId}/activate`, { method: 'POST' });
        if (!response.success) {
            document.getElementById('trip-detail-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.error)}</div>`;
            return;
        }
        showToast('Resan är aktiverad', 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleSnooze(minutes) {
        const response = await apiRequest(`/trips/${this.state.tripId}/snooze`, {
            method: 'POST',
            body: JSON.stringify({ snooze_minutes: minutes })
        });
        if (!response.success) {
            document.getElementById('trip-detail-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.error)}</div>`;
            return;
        }
        showToast(`Ankomsttid framflyttad ${minutes} min`, 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleVerify() {
        if (!confirm('Bekräfta att fartyget har anlänt säkert?')) return;

        const response = await apiRequest(`/trips/${this.state.tripId}/verify`, { method: 'POST' });
        if (!response.success) {
            document.getElementById('trip-detail-alert').innerHTML = `<div class="alert alert-error">${escapeHtml(response.error)}</div>`;
            return;
        }
        showToast('Ankomst verifierad - resan är avslutad', 'success');
        await this.load(document.getElementById('page-content'));
    },

    async handleInviteCrew() {
        const alertBox = document.getElementById('invite-alert');
        const email = document.getElementById('invite-email').value.trim();
        const name = document.getElementById('invite-name').value.trim();

        const emailError = Validate.email(email);
        if (emailError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(emailError)}</div>`;
            return;
        }

        const response = await apiRequest(`/trips/${this.state.tripId}/crew`, {
            method: 'POST',
            body: JSON.stringify({ email, name: name || undefined })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte skicka inbjudan.')}</div>`;
            return;
        }

        const link = response.data.invitation_link || this.buildInviteLink(response.data.invitation_token);
        alertBox.innerHTML = `
            <div class="alert alert-success">
                Inbjudan skapad. E-postutskick är inte inkopplat än - dela länken manuellt:<br>
                <code style="word-break: break-all;">${escapeHtml(link)}</code>
            </div>`;
        document.getElementById('invite-email').value = '';
        document.getElementById('invite-name').value = '';

        await this.load(document.getElementById('page-content'));
    },

    async handleRemoveCrew(crewId) {
        if (!confirm('Ta bort denna besättningsmedlem från resan?')) return;

        const response = await apiRequest(`/crew/${crewId}`, { method: 'DELETE' });
        if (!response.success) {
            showToast(response.error || 'Kunde inte ta bort besättningsmedlemmen', 'error');
            return;
        }
        showToast('Besättningsmedlem borttagen', 'success');
        await this.load(document.getElementById('page-content'));
    }
};
