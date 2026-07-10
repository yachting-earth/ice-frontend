const AdminPage = {
    STAT_LABELS: {
        users: 'Användare',
        routes: 'Rutter',
        vessels: 'Båtar',
        ice_contacts: 'ICE-kontakter'
    },

    TAB_CONFIG: {
        users: { endpoint: '/admin/users', title: 'Användare', emptyText: 'Inga användare' },
        routes: { endpoint: '/admin/routes', title: 'Rutter', emptyText: 'Inga rutter' },
        vessels: { endpoint: '/admin/vessels', title: 'Båtar', emptyText: 'Inga båtar' },
        ice_contacts: { endpoint: '/admin/ice-contacts', title: 'ICE-kontakter', emptyText: 'Inga ICE-kontakter' }
    },

    state: {
        activeTab: 'users',
        stats: null,
        users: []
    },

    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>Admin</h1>
                        <div class="page-header__meta">Systemstatistik och användarhantering - klicka på ett kort för att se detaljer</div>
                    </div>
                </div>
                <div id="admin-stats-container"><div class="loading-state"><span class="spinner"></span> Laddar statistik...</div></div>
                <div class="card">
                    <div class="card-header">
                        <h2 id="admin-section-title">Användare</h2>
                    </div>
                    <div id="admin-alert"></div>
                    <div id="admin-section-container"><div class="loading-state"><span class="spinner"></span> Laddar...</div></div>
                </div>
            </div>`;

        await Promise.all([this.loadStats(), this.loadTab(this.state.activeTab)]);
    },

    async loadStats() {
        const container = document.getElementById('admin-stats-container');
        const response = await apiRequest('/admin/stats');

        if (!response.success) {
            container.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta statistik.')}</div>`;
            return;
        }

        this.state.stats = response.data;
        this.renderStatGrid();
    },

    renderStatGrid() {
        const container = document.getElementById('admin-stats-container');
        const stats = this.state.stats || {};

        container.innerHTML = `
            <div class="stat-grid">
                ${Object.entries(this.STAT_LABELS).map(([key, label]) => `
                    <div class="stat-tile stat-tile--clickable${key === this.state.activeTab ? ' stat-tile--active' : ''}"
                        data-tab="${key}" role="button" tabindex="0" aria-pressed="${key === this.state.activeTab}">
                        <div class="stat-tile__value">${escapeHtml(String(stats[key] ?? 0))}</div>
                        <div class="stat-tile__label">${escapeHtml(label)}</div>
                    </div>
                `).join('')}
            </div>`;

        container.querySelectorAll('[data-tab]').forEach((tile) => {
            tile.addEventListener('click', () => this.loadTab(tile.dataset.tab));
            tile.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.loadTab(tile.dataset.tab);
                }
            });
        });
    },

    async loadTab(tab) {
        this.state.activeTab = tab;
        this.renderStatGrid();

        const config = this.TAB_CONFIG[tab];
        document.getElementById('admin-section-title').textContent = config.title;
        document.getElementById('admin-alert').innerHTML = '';

        const container = document.getElementById('admin-section-container');
        container.innerHTML = `<div class="loading-state"><span class="spinner"></span> Laddar...</div>`;

        const response = await apiRequest(config.endpoint);

        if (!response.success) {
            container.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || `Kunde inte hämta ${config.title.toLowerCase()}.`)}</div>`;
            return;
        }

        this.state[tab] = response.data || [];

        if (this.state[tab].length === 0) {
            container.innerHTML = `<div class="empty-state"><h3>${escapeHtml(config.emptyText)}</h3></div>`;
            return;
        }

        const renderers = {
            users: () => this.renderUsersTable(container),
            routes: () => this.renderRoutesTable(container),
            vessels: () => this.renderVesselsTable(container),
            ice_contacts: () => this.renderIceContactsTable(container)
        };

        renderers[tab]();
    },

    renderUsersTable(container) {
        container.innerHTML = `
            <div class="table-scroll">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Namn</th>
                            <th>E-post</th>
                            <th>Telefon</th>
                            <th>Admin</th>
                            <th>Skapad</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.users.map((u) => this.renderUserRow(u)).join('')}
                    </tbody>
                </table>
            </div>`;

        container.querySelectorAll('[data-delete-user]').forEach((btn) => {
            btn.addEventListener('click', () => this.handleDelete(Number(btn.dataset.deleteUser)));
        });
    },

    renderUserRow(user) {
        const isSelf = String(user.id) === String(Auth.getUser().id);
        return `
            <tr>
                <td>${escapeHtml(user.name || '')}</td>
                <td>${escapeHtml(user.email || '')}</td>
                <td>${escapeHtml(user.phone || '')}</td>
                <td>${user.is_admin ? '<span class="badge badge-active">Ja</span>' : ''}</td>
                <td>${escapeHtml(formatDateTime(user.created_at))}</td>
                <td>
                    <button class="btn btn-danger btn-sm" type="button" data-delete-user="${user.id}"
                        ${isSelf ? 'disabled title="Du kan inte radera ditt eget konto härifrån"' : ''}>Radera</button>
                </td>
            </tr>`;
    },

    async handleDelete(userId) {
        const user = this.state.users.find((u) => u.id === userId);
        if (!user) return;

        if (!confirm(`Radera användaren ${user.name} (${user.email}) och all tillhörande data? Detta går inte att ångra.`)) return;

        const alertBox = document.getElementById('admin-alert');
        const response = await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte radera användaren.')}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast('Användaren har raderats.', 'success');
        await this.loadTab('users');
        await this.loadStats();
    },

    renderRoutesTable(container) {
        container.innerHTML = `
            <div class="table-scroll">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Skeppare</th>
                            <th>Avgång</th>
                            <th>Ankomst</th>
                            <th>Resestatus</th>
                            <th>Ordning</th>
                            <th>Skapad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.routes.map((r) => this.renderRouteRow(r)).join('')}
                    </tbody>
                </table>
            </div>`;
    },

    renderRouteRow(route) {
        return `
            <tr>
                <td>${escapeHtml(route.skipper_name || '')}<br><span class="page-header__meta">${escapeHtml(route.skipper_email || '')}</span></td>
                <td>${escapeHtml(formatDateTime(route.departure_scheduled))}</td>
                <td>${escapeHtml(formatDateTime(route.arrival_scheduled))}</td>
                <td>${route.trip_status ? `<span class="badge badge-${escapeHtml(route.trip_status)}">${escapeHtml(route.trip_status)}</span>` : ''}</td>
                <td>${escapeHtml(String(route.route_order ?? ''))}</td>
                <td>${escapeHtml(formatDateTime(route.created_at))}</td>
            </tr>`;
    },

    renderVesselsTable(container) {
        container.innerHTML = `
            <div class="table-scroll">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Namn</th>
                            <th>Ägare</th>
                            <th>MMSI</th>
                            <th>Anropssignal</th>
                            <th>Modell</th>
                            <th>Skapad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.vessels.map((v) => this.renderVesselRow(v)).join('')}
                    </tbody>
                </table>
            </div>`;
    },

    renderVesselRow(vessel) {
        return `
            <tr>
                <td>${escapeHtml(vessel.vessel_name || '')}</td>
                <td>${escapeHtml(vessel.owner_name || '')}<br><span class="page-header__meta">${escapeHtml(vessel.owner_email || '')}</span></td>
                <td>${escapeHtml(vessel.mmsi || '')}</td>
                <td>${escapeHtml(vessel.call_sign || '')}</td>
                <td>${escapeHtml(vessel.model || '')}</td>
                <td>${escapeHtml(formatDateTime(vessel.created_at))}</td>
            </tr>`;
    },

    renderIceContactsTable(container) {
        container.innerHTML = `
            <div class="table-scroll">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Namn</th>
                            <th>Relation</th>
                            <th>E-post</th>
                            <th>Telefon</th>
                            <th>Kanal</th>
                            <th>Bekräftad</th>
                            <th>Skeppare</th>
                            <th>Skapad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.ice_contacts.map((c) => this.renderIceContactRow(c)).join('')}
                    </tbody>
                </table>
            </div>`;
    },

    renderIceContactRow(contact) {
        return `
            <tr>
                <td>${escapeHtml(contact.name || '')}</td>
                <td>${escapeHtml(contact.relationship || '')}</td>
                <td>${escapeHtml(contact.email || '')}</td>
                <td>${escapeHtml(contact.phone || '')}</td>
                <td>${escapeHtml(contact.preferred_channel || '')}</td>
                <td>${contact.confirmed_at ? '<span class="badge badge-active">Ja</span>' : '<span class="badge badge-draft">Nej</span>'}</td>
                <td>${escapeHtml(contact.skipper_name || '')}<br><span class="page-header__meta">${escapeHtml(contact.skipper_email || '')}</span></td>
                <td>${escapeHtml(formatDateTime(contact.created_at))}</td>
            </tr>`;
    }
};
