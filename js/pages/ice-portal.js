/**
 * Read-only trip view for ICE contacts and SAR authorities.
 *
 * Reached via #/ice-portal?trip={tripId}&token={ice_read_only token} -
 * the link included in the alert message, or via the SAR lookup page.
 * No account/login involved; access is granted by the opaque token.
 */
const IcePortalPage = {
    STATUS_LABELS: {
        draft: 'Utkast',
        published: 'Publicerad',
        active: 'Aktiv',
        completed: 'Avslutad',
        cancelled: 'Inställd'
    },

    ACTION_LABELS: {
        UPDATE: 'Resan uppdaterad',
        SNOOZE: 'Ankomsttid framflyttad',
        VERIFY: 'Ankomst verifierad',
        ACTIVATE: 'Resan aktiverad',
        CREW_PHOTO_UPDATED: 'Besättningsfoto uppdaterat'
    },

    state: { tripId: null, token: null, map: null },

    async render(container, params, query) {
        this.state.tripId = query.get('trip');
        this.state.token = query.get('token');

        if (!this.state.tripId || !this.state.token) {
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">Ogiltig länk - resa eller åtkomstkod saknas. Använd länken från notifieringsmeddelandet.</div>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="page"><div class="loading-state"><span class="spinner"></span> Laddar resa...</div></div>`;

        const response = await apiRequest(`/trips/${this.state.tripId}?token=${encodeURIComponent(this.state.token)}`);

        if (!response.success) {
            container.innerHTML = `
                <div class="page">
                    <div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta resan. Länken kan vara ogiltig eller återkallad.')}</div>
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
                        <h1>Reseinformation
                            <span class="badge badge-${trip.status}">${this.STATUS_LABELS[trip.status] || trip.status}</span>
                        </h1>
                        <div class="page-header__meta">
                            Skrivskyddad vy för nödkontakt (ICE) och sjöräddning (SAR)
                            ${trip.ice_notified ? ' · <strong>Larm utlöst - ankomst ej bekräftad i tid</strong>' : ''}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>Skeppare</h3>
                    <p class="mb-0">
                        ${escapeHtml(skipper?.name || '–')}
                        ${skipper?.phone ? ` · ${escapeHtml(skipper.phone)}` : ''}
                        ${skipper?.email ? ` · ${escapeHtml(skipper.email)}` : ''}
                    </p>
                </div>

                <div class="card">
                    <h3>Resa</h3>
                    <p>
                        Planerad avgång: <strong>${formatDateTime(trip.departure_scheduled)}</strong><br>
                        Planerad ankomst: <strong>${formatDateTime(trip.arrival_scheduled)}</strong>
                    </p>
                    <p class="mb-0">
                        Fartyg: ${escapeHtml(vessel?.vessel_name || '–')}
                        ${vessel?.mmsi ? ` · MMSI ${escapeHtml(vessel.mmsi)}` : ''}
                        ${vessel?.call_sign ? ` · Anropssignal ${escapeHtml(vessel.call_sign)}` : ''}
                    </p>
                </div>

                <div class="card">
                    <h3>Rutter</h3>
                    <div id="portal-routes-list"></div>
                    <div id="portal-route-map" class="map-container"></div>
                </div>

                <div class="card">
                    <h3>Besättning ombord</h3>
                    <div id="portal-crew-container"></div>
                </div>

                <div class="card">
                    <h3>Ändringslogg</h3>
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
            list.innerHTML = `<p class="text-muted">Inga rutter registrerade.</p>`;
        } else {
            list.innerHTML = routes.map((r) => `
                <div class="route-item">
                    <div class="route-item__title">${r.route_order === 1 ? 'Huvudrutt' : `Alternativ rutt ${r.route_order}`}</div>
                    ${r.reason ? `<div class="text-muted" style="font-size: var(--font-size-sm);">${escapeHtml(r.reason)}</div>` : ''}
                </div>
            `).join('');
        }

        const mapEl = document.getElementById('portal-route-map');
        const colors = ['#1e88a8', '#a06600', '#b3261e', '#1a7f4e'];
        const mapRoutes = (routes || [])
            .map((r, i) => ({ coordinates: parseWktLineString(r.geometry_wkt), color: colors[i % colors.length], label: r.reason || `Rutt ${r.route_order}` }))
            .filter((r) => r.coordinates.length > 1);

        if (mapRoutes.length > 0) {
            this.state.map = renderRouteMap(mapEl, mapRoutes);
        } else {
            mapEl.innerHTML = '<div class="empty-state">Ingen rutt att visa</div>';
        }
    },

    renderCrew(crew) {
        const container = document.getElementById('portal-crew-container');
        const accepted = (crew || []).filter((c) => c.accepted_at);

        if (accepted.length === 0) {
            container.innerHTML = `<p class="text-muted">Ingen bekräftad besättning registrerad.</p>`;
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
                    <span class="crew-row__name">${escapeHtml(c.name || 'Okänd')}</span>
                    <span class="crew-row__detail">
                        ${c.phone ? escapeHtml(c.phone) : ''}
                        ${c.ice_contact ? ` · Egen nödkontakt: ${escapeHtml(c.ice_contact)}` : ''}
                    </span>
                </div>
            </div>
        `).join('')}</div>`;
    },

    renderLog(auditLog) {
        const container = document.getElementById('portal-log-container');

        if (!auditLog || auditLog.length === 0) {
            container.innerHTML = `<p class="text-muted">Inga ändringar loggade.</p>`;
            return;
        }

        container.innerHTML = `<div class="change-log">${auditLog.map((entry) => {
            let text = this.ACTION_LABELS[entry.action] || entry.action;
            try {
                const value = JSON.parse(entry.new_value);
                if (entry.action === 'SNOOZE' && value?.minutes) {
                    text += ` (+${value.minutes} min)`;
                } else if (entry.action === 'UPDATE' && value?.arrival_scheduled) {
                    text += ` - ny ankomst ${formatDateTime(value.arrival_scheduled)}`;
                }
            } catch (err) { /* new_value isn't always JSON - show the plain label */ }

            return `
                <div class="change-log__item">
                    <span class="change-log__time">${formatDateTime(entry.changed_at)}</span>
                    <span class="change-log__text">${escapeHtml(text)}</span>
                </div>`;
        }).join('')}</div>`;
    }
};
