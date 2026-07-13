/**
 * Crew-facing view of a trip - the same purpose-limited baseline as the
 * ICE/SAR portal (see TripHandler::detail(), role 'crew'), plus a form for
 * the viewer's own crew row to manage what of their own contact details is
 * shared with the skipper's ICE contact.
 *
 * Reached via #/crew-view?trip={tripId}&token={crew_view token} - the link
 * issued at CrewHandler::accept() and mailed via
 * NotificationService::sendCrewViewLink() - or, for a logged-in crew
 * member, just #/crew-view?trip={tripId}: the backend recognizes an
 * accepted crew member's own JWT with no token needed.
 */
const CrewViewPage = {
    state: { tripId: null, token: null, viewerCrewId: null, map: null },

    formatVesselDimensions(vessel) {
        return [
            vessel?.length_m ? t('crewView.vessel.dimLength', { value: Number(vessel.length_m) }) : '',
            vessel?.width_m ? t('crewView.vessel.dimWidth', { value: Number(vessel.width_m) }) : '',
            vessel?.draft_m ? t('crewView.vessel.dimDraft', { value: Number(vessel.draft_m) }) : ''
        ].filter(Boolean).join(' × ');
    },

    async render(container, params, query) {
        this.state.tripId = query.get('trip');
        this.state.token = query.get('token');

        if (!this.state.tripId || (!this.state.token && !Auth.isAuthenticated())) {
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">${escapeHtml(t('crewView.invalidLink'))}</div>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="page"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('crewView.loadingTrip'))}</div></div>`;

        const lang = I18n._lang || I18n.getLang();
        const endpoint = `/trips/${this.state.tripId}`
            + (this.state.token ? `?token=${encodeURIComponent(this.state.token)}&lang=${encodeURIComponent(lang)}` : `?lang=${encodeURIComponent(lang)}`);
        const response = await apiRequest(endpoint);

        if (!response.success) {
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('crewView.loadFailed')))}</div>
                </div>`;
            return;
        }

        this.state.viewerCrewId = response.data.viewer_crew_id || null;
        this.renderPage(container, response.data);
    },

    renderPage(container, data) {
        const { trip, vessel, crew, routes, skipper, audit_log } = data;

        const viewerCrew = this.state.viewerCrewId
            ? (crew || []).find((c) => c.id === this.state.viewerCrewId)
            : null;
        // Editing sharing settings goes through PUT /crew/{crewId}, which
        // requires a Bearer JWT - a guest crew member using only the
        // crew_view token (no account) can see their own row above but
        // can't call that endpoint, so the edit form is JWT-only.
        const canEditSharing = !!viewerCrew && Auth.isAuthenticated();

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('crewView.title'))}
                            <span class="badge badge-${trip.status}">${escapeHtml(t('trip.status.' + trip.status) || trip.status)}</span>
                        </h1>
                    </div>
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('crewView.skipper.heading'))}</h3>
                    <div style="display:flex; align-items:center; gap: var(--space-3);">
                        ${skipper?.photo_path ? `<img id="crewview-skipper-photo" alt="" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">` : ''}
                        <p class="mb-0">
                            <strong>${escapeHtml(t('common.name'))}:</strong> ${escapeHtml(skipper?.name || '–')}
                            ${skipper?.phone ? ` · <strong>${escapeHtml(t('common.phone'))}:</strong> ${escapeHtml(skipper.phone)}` : ''}
                            ${skipper?.email ? ` · <strong>${escapeHtml(t('common.email'))}:</strong> ${escapeHtml(skipper.email)}` : ''}
                        </p>
                    </div>
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('crewView.trip.heading'))}</h3>
                    <p>
                        ${t('crewView.trip.plannedDeparture', { datetime: formatDateTime(trip.departure_scheduled) })}<br>
                        ${t('crewView.trip.plannedArrival', { datetime: formatDateTime(trip.arrival_scheduled) })}
                    </p>
                    <div style="display:flex; align-items:center; gap: var(--space-3);">
                        ${vessel?.photo_path ? `<img id="crewview-vessel-photo" alt="" style="width:64px;height:64px;border-radius:var(--radius-md);object-fit:cover;">` : ''}
                        <p class="mb-0">
                            ${escapeHtml(t('crewView.vessel.nameLine', { name: vessel?.vessel_name || '–' }))}
                            ${vessel?.model ? ` · ${escapeHtml(t('crewView.vessel.modelLabel', { value: vessel.model }))}` : ''}
                            ${vessel?.year_built ? ` · ${escapeHtml(t('crewView.vessel.yearBuilt', { year: String(vessel.year_built) }))}` : ''}
                            ${vessel?.mmsi ? ` · ${escapeHtml(t('crewView.vessel.mmsi', { value: vessel.mmsi }))}` : ''}
                            ${vessel?.call_sign ? ` · ${escapeHtml(t('crewView.vessel.callSign', { value: vessel.call_sign }))}` : ''}
                            ${CrewViewPage.formatVesselDimensions(vessel) ? ` · ${escapeHtml(CrewViewPage.formatVesselDimensions(vessel))}` : ''}
                        </p>
                    </div>
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('crewView.routes.heading'))}</h3>
                    <div id="crewview-routes-list"></div>
                    <div id="crewview-route-map" class="map-container"></div>
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('crewView.crew.heading'))}</h3>
                    <div id="crewview-crew-container"></div>
                </div>

                ${canEditSharing ? `
                <div class="card">
                    <h3>${escapeHtml(t('crewView.sharingSettings.heading'))}</h3>
                    <p>${escapeHtml(t('crewView.sharingSettings.hint'))}</p>
                    <div id="crewview-sharing-alert"></div>
                    <div class="checkbox-field">
                        <input type="checkbox" id="cvs-contact-ice">
                        <label for="cvs-contact-ice">${escapeHtml(t('crewView.sharingSettings.shareContactWithIce'))}</label>
                    </div>
                    <div class="checkbox-field">
                        <input type="checkbox" id="cvs-emergency-ice">
                        <label for="cvs-emergency-ice">${escapeHtml(t('crewView.sharingSettings.shareEmergencyWithIce'))}</label>
                    </div>
                    <button class="btn btn-secondary btn-sm" type="button" id="crewview-sharing-submit">${escapeHtml(t('crewView.sharingSettings.saveButton'))}</button>
                </div>` : ''}

                <div class="card">
                    <h3>${escapeHtml(t('crewView.log.heading'))}</h3>
                    <div id="crewview-log-container"></div>
                </div>
            </div>`;

        this.renderRoutes(routes);
        this.renderCrew(crew);
        this.renderLog(audit_log);
        this.loadPhotos(skipper, vessel);

        if (canEditSharing) {
            this.setupSharingForm(viewerCrew);
        }
    },

    renderRoutes(routes) {
        const list = document.getElementById('crewview-routes-list');

        if (!routes || routes.length === 0) {
            list.innerHTML = `<p class="text-muted">${escapeHtml(t('crewView.routes.empty'))}</p>`;
        } else {
            list.innerHTML = routes.map((r) => `
                <div class="route-item">
                    <div class="route-item__title">${escapeHtml(r.route_order === 1 ? t('crewView.routes.primary') : t('crewView.routes.alternate', { order: r.route_order }))}</div>
                    ${r.reason ? `<div class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(r.reason)}</div>` : ''}
                </div>
            `).join('');
        }

        const mapEl = document.getElementById('crewview-route-map');
        const colors = ['#1e88a8', '#a06600', '#b3261e', '#1a7f4e'];
        const mapRoutes = (routes || [])
            .map((r, i) => ({ coordinates: parseWktLineString(r.geometry_wkt), color: colors[i % colors.length], label: r.reason || t('crewView.routes.mapLabel', { order: r.route_order }) }))
            .filter((r) => r.coordinates.length > 1);

        if (mapRoutes.length > 0) {
            this.state.map = renderRouteMap(mapEl, mapRoutes);
        } else {
            mapEl.innerHTML = `<div class="empty-state">${escapeHtml(t('crewView.routes.noMap'))}</div>`;
        }
    },

    renderCrew(crew) {
        const container = document.getElementById('crewview-crew-container');
        const accepted = (crew || []).filter((c) => c.accepted_at);

        if (accepted.length === 0) {
            container.innerHTML = `<p class="text-muted">${escapeHtml(t('crewView.crew.empty'))}</p>`;
            return;
        }

        container.innerHTML = `<div class="crew-list">${accepted.map((c) => `
            <div class="crew-row">
                ${c.photo_path
                    ? `<img id="crewview-crew-photo-${c.id}" alt="${escapeHtml(c.name || '')}"
                          style="width:48px;height:48px;border-radius:50%;object-fit:cover;margin-right:var(--space-3);">`
                    : ''}
                <div class="crew-row__info">
                    <span class="crew-row__name">${escapeHtml(c.name || t('crewView.crew.unknownName'))}${c.id === this.state.viewerCrewId ? ` (${escapeHtml(t('crewView.crew.you'))})` : ''}</span>
                    <span class="crew-row__detail">
                        ${c.phone ? `${escapeHtml(t('common.phone'))}: ${escapeHtml(c.phone)}` : ''}
                        ${c.email ? ` · ${escapeHtml(t('common.email'))}: ${escapeHtml(c.email)}` : ''}
                        ${c.ice_contact ? ` · ${escapeHtml(t('crewView.crew.ownIceContact', { contact: c.ice_contact }))}` : ''}
                    </span>
                </div>
            </div>
        `).join('')}</div>`;

        accepted.filter((c) => c.photo_path).forEach((c) => {
            this.loadPhoto(`crewview-crew-photo-${c.id}`, `/photos/${c.id}`);
        });
    },

    renderLog(auditLog) {
        const container = document.getElementById('crewview-log-container');

        if (!auditLog || auditLog.length === 0) {
            container.innerHTML = `<p class="text-muted">${escapeHtml(t('crewView.log.empty'))}</p>`;
            return;
        }

        container.innerHTML = `<div class="change-log">${auditLog.map((entry) => `
                <div class="change-log__item">
                    <span class="change-log__time">${formatDateTime(entry.changed_at)}</span>
                    <span class="change-log__text">${escapeHtml(entry.message || entry.action)}</span>
                </div>`).join('')}</div>`;
    },

    loadPhotos(skipper, vessel) {
        if (skipper?.photo_path) {
            this.loadPhoto('crewview-skipper-photo', `/users/${skipper.id}/photo?trip=${encodeURIComponent(this.state.tripId)}`);
        }
        if (vessel?.photo_path) {
            this.loadPhoto('crewview-vessel-photo', `/vessels/${vessel.id}/photo?trip=${encodeURIComponent(this.state.tripId)}`);
        }
    },

    // Photos are served from an auth-gated endpoint. With a crew_view
    // token we can just append it to the query string like the ICE portal
    // does; without one (pure JWT access) a plain <img src> can't carry
    // the Authorization header, so fetch the bytes ourselves and hand the
    // browser a blob URL (mirrors profile.js's loadOwnPhoto()).
    async loadPhoto(imgId, endpoint) {
        const img = document.getElementById(imgId);
        if (!img) return;

        if (this.state.token) {
            const sep = endpoint.includes('?') ? '&' : '?';
            img.src = `${CONFIG.API_BASE_URL}${endpoint}${sep}token=${encodeURIComponent(this.state.token)}`;
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) return;
            img.src = URL.createObjectURL(await response.blob());
        } catch (err) { /* leave the photo hidden */ }
    },

    setupSharingForm(viewerCrew) {
        const contactScope = (viewerCrew.share_contact || '').split(',').filter(Boolean);
        const emergencyScope = (viewerCrew.share_emergency_contact || '').split(',').filter(Boolean);

        document.getElementById('cvs-contact-ice').checked = contactScope.includes('ice');
        document.getElementById('cvs-emergency-ice').checked = emergencyScope.includes('ice');

        document.getElementById('crewview-sharing-submit').addEventListener('click', () => this.handleSharingSubmit());
    },

    async handleSharingSubmit() {
        const alertBox = document.getElementById('crewview-sharing-alert');
        const btn = document.getElementById('crewview-sharing-submit');
        btn.disabled = true;

        const shareContact = [];
        if (document.getElementById('cvs-contact-ice').checked) shareContact.push('ice');
        const shareEmergencyContact = [];
        if (document.getElementById('cvs-emergency-ice').checked) shareEmergencyContact.push('ice');

        const response = await apiRequest(`/crew/${this.state.viewerCrewId}`, {
            method: 'PUT',
            body: JSON.stringify({ share_contact: shareContact, share_emergency_contact: shareEmergencyContact })
        });

        btn.disabled = false;

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('crewView.sharingSettings.saveFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast(t('crewView.sharingSettings.saved'), 'success');
    }
};
