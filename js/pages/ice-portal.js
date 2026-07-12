/**
 * Read-only trip view for ICE contacts and SAR authorities.
 *
 * Reached via #/ice-portal?trip={tripId}&token={ice_read_only token} -
 * the link included in the alert message, or via the SAR lookup page.
 * No account/login involved; access is granted by the opaque token.
 */
const IcePortalPage = {
    state: { tripId: null, token: null, map: null },

    formatVesselDimensions(vessel) {
        return [
            vessel?.length_m ? t('icePortal.vessel.dimLength', { value: Number(vessel.length_m) }) : '',
            vessel?.width_m ? t('icePortal.vessel.dimWidth', { value: Number(vessel.width_m) }) : '',
            vessel?.draft_m ? t('icePortal.vessel.dimDraft', { value: Number(vessel.draft_m) }) : ''
        ].filter(Boolean).join(' × ');
    },

    async render(container, params, query) {
        this.state.tripId = query.get('trip');
        this.state.token = query.get('token');

        if (!this.state.tripId || !this.state.token) {
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">${escapeHtml(t('icePortal.invalidLink'))}</div>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="page"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('icePortal.loadingTrip'))}</div></div>`;

        const lang = I18n._lang || I18n.getLang();
        const response = await apiRequest(`/trips/${this.state.tripId}?token=${encodeURIComponent(this.state.token)}&lang=${encodeURIComponent(lang)}`);

        if (!response.success) {
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('icePortal.loadFailed')))}</div>
                </div>`;
            return;
        }

        this.renderPage(container, response.data);
    },

    renderPage(container, data) {
        const { trip, vessel, crew, routes, skipper, audit_log } = data;

        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('icePortal.title'))}
                            <span class="badge badge-${trip.status}">${escapeHtml(t('trip.status.' + trip.status) || trip.status)}</span>
                        </h1>
                        <div class="page-header__meta">
                            ${escapeHtml(t('icePortal.readOnlyNotice'))}
                            ${trip.ice_notified ? ' · ' + t('icePortal.alertTriggered') : ''}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('icePortal.skipper.heading'))}</h3>
                    <div style="display:flex; align-items:center; gap: var(--space-3);">
                        ${skipper?.photo_path
                            ? `<img src="${CONFIG.API_BASE_URL}/users/${skipper.id}/photo?trip=${encodeURIComponent(this.state.tripId)}&token=${encodeURIComponent(this.state.token)}"
                                    alt="" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">`
                            : ''}
                        <p class="mb-0">
                            ${escapeHtml(skipper?.name || '–')}
                            ${skipper?.phone ? ` · ${escapeHtml(skipper.phone)}` : ''}
                            ${skipper?.email ? ` · ${escapeHtml(skipper.email)}` : ''}
                        </p>
                    </div>
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('icePortal.trip.heading'))}</h3>
                    <p>
                        ${t('icePortal.trip.plannedDeparture', { datetime: formatDateTime(trip.departure_scheduled) })}<br>
                        ${t('icePortal.trip.plannedArrival', { datetime: formatDateTime(trip.arrival_scheduled) })}
                    </p>
                    <div style="display:flex; align-items:center; gap: var(--space-3);">
                        ${vessel?.photo_path
                            ? `<img src="${CONFIG.API_BASE_URL}/vessels/${vessel.id}/photo?trip=${encodeURIComponent(this.state.tripId)}&token=${encodeURIComponent(this.state.token)}"
                                    alt="" style="width:64px;height:64px;border-radius:var(--radius-md);object-fit:cover;">`
                            : ''}
                        <p class="mb-0">
                            ${escapeHtml(t('icePortal.vessel.nameLine', { name: vessel?.vessel_name || '–' }))}
                            ${vessel?.model ? ` · ${escapeHtml(vessel.model)}` : ''}
                            ${vessel?.year_built ? ` · ${escapeHtml(t('icePortal.vessel.yearBuilt', { year: String(vessel.year_built) }))}` : ''}
                            ${vessel?.mmsi ? ` · ${escapeHtml(t('icePortal.vessel.mmsi', { value: vessel.mmsi }))}` : ''}
                            ${vessel?.call_sign ? ` · ${escapeHtml(t('icePortal.vessel.callSign', { value: vessel.call_sign }))}` : ''}
                            ${IcePortalPage.formatVesselDimensions(vessel) ? ` · ${escapeHtml(IcePortalPage.formatVesselDimensions(vessel))}` : ''}
                        </p>
                    </div>
                    ${vessel?.notes ? `<p class="mb-0" style="margin-top: var(--space-2); color: var(--color-text-muted); white-space: pre-wrap;">${escapeHtml(vessel.notes)}</p>` : ''}
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('icePortal.routes.heading'))}</h3>
                    <div id="portal-routes-list"></div>
                    <div id="portal-route-map" class="map-container"></div>
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('icePortal.crew.heading'))}</h3>
                    <div id="portal-crew-container"></div>
                </div>

                <div class="card">
                    <h3>${escapeHtml(t('icePortal.log.heading'))}</h3>
                    <div id="portal-log-container"></div>
                </div>
            </div>`;

        this.renderRoutes(routes);
        this.renderCrew(crew);
        this.renderLog(audit_log);
    },

    renderRoutes(routes) {
        const list = document.getElementById('portal-routes-list');

        if (!routes || routes.length === 0) {
            list.innerHTML = `<p class="text-muted">${escapeHtml(t('icePortal.routes.empty'))}</p>`;
        } else {
            list.innerHTML = routes.map((r) => `
                <div class="route-item">
                    <div class="route-item__title">${escapeHtml(r.route_order === 1 ? t('icePortal.routes.primary') : t('icePortal.routes.alternate', { order: r.route_order }))}</div>
                    ${r.reason ? `<div class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(r.reason)}</div>` : ''}
                </div>
            `).join('');
        }

        const mapEl = document.getElementById('portal-route-map');
        const colors = ['#1e88a8', '#a06600', '#b3261e', '#1a7f4e'];
        const mapRoutes = (routes || [])
            .map((r, i) => ({ coordinates: parseWktLineString(r.geometry_wkt), color: colors[i % colors.length], label: r.reason || t('icePortal.routes.mapLabel', { order: r.route_order }) }))
            .filter((r) => r.coordinates.length > 1);

        if (mapRoutes.length > 0) {
            this.state.map = renderRouteMap(mapEl, mapRoutes);
        } else {
            mapEl.innerHTML = `<div class="empty-state">${escapeHtml(t('icePortal.routes.noMap'))}</div>`;
        }
    },

    renderCrew(crew) {
        const container = document.getElementById('portal-crew-container');
        const accepted = (crew || []).filter((c) => c.accepted_at);

        if (accepted.length === 0) {
            container.innerHTML = `<p class="text-muted">${escapeHtml(t('icePortal.crew.empty'))}</p>`;
            return;
        }

        const token = encodeURIComponent(this.state.token);
        container.innerHTML = `<div class="crew-list">${accepted.map((c) => `
            <div class="crew-row">
                ${c.photo_path
                    ? `<img src="${CONFIG.API_BASE_URL}/photos/${c.id}?token=${token}" alt="${escapeHtml(c.name || '')}"
                          style="width:48px;height:48px;border-radius:50%;object-fit:cover;margin-right:var(--space-3);">`
                    : ''}
                <div class="crew-row__info">
                    <span class="crew-row__name">${escapeHtml(c.name || t('icePortal.crew.unknownName'))}</span>
                    <span class="crew-row__detail">
                        ${c.phone ? escapeHtml(c.phone) : ''}
                        ${c.email ? ` · ${escapeHtml(c.email)}` : ''}
                        ${c.ice_contact ? ` · ${escapeHtml(t('icePortal.crew.ownIceContact', { contact: c.ice_contact }))}` : ''}
                    </span>
                </div>
            </div>
        `).join('')}</div>`;
    },

    renderLog(auditLog) {
        const container = document.getElementById('portal-log-container');

        if (!auditLog || auditLog.length === 0) {
            container.innerHTML = `<p class="text-muted">${escapeHtml(t('icePortal.log.empty'))}</p>`;
            return;
        }

        container.innerHTML = `<div class="change-log">${auditLog.map((entry) => `
                <div class="change-log__item">
                    <span class="change-log__time">${formatDateTime(entry.changed_at)}</span>
                    <span class="change-log__text">${escapeHtml(entry.message || entry.action)}</span>
                </div>`).join('')}</div>`;
    }
};
