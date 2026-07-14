const AdminPage = {
    // Built from the active i18n dictionary at call time (not module-load
    // time) - these were plain data objects before i18n, but t() needs the
    // language dictionary loaded first, which only happens after this script
    // has already been parsed. See formatGracePeriod() in utils/datetime.js
    // for the same constraint.
    statLabels() {
        return {
            users: t('admin.stats.users'),
            routes: t('admin.stats.routes'),
            vessels: t('admin.stats.vessels'),
            ice_contacts: t('admin.stats.iceContacts'),
            logs: t('admin.stats.logs')
        };
    },

    tabConfig() {
        return {
            users: { endpoint: '/admin/users', title: t('admin.stats.users'), emptyText: t('admin.empty.users') },
            routes: { endpoint: '/admin/routes', title: t('admin.stats.routes'), emptyText: t('admin.empty.routes') },
            vessels: { endpoint: '/admin/vessels', title: t('admin.stats.vessels'), emptyText: t('admin.empty.vessels') },
            ice_contacts: { endpoint: '/admin/ice-contacts', title: t('admin.stats.iceContacts'), emptyText: t('admin.empty.iceContacts') },
            logs: { title: t('admin.stats.logs'), emptyText: t('admin.empty.logs') }
        };
    },

    logLevelLabels() {
        return {
            info: t('admin.logLevel.info'),
            warning: t('admin.logLevel.warning'),
            error: t('admin.logLevel.error')
        };
    },

    logCategoryLabels() {
        return {
            cron: t('admin.logCategory.cron'),
            email: t('admin.logCategory.email'),
            notification: t('admin.logCategory.notification'),
            database: t('admin.logCategory.database'),
            api: t('admin.logCategory.api'),
            auth: t('admin.logCategory.auth'),
            trip: t('admin.logCategory.trip'),
            route: t('admin.logCategory.route'),
            vessel: t('admin.logCategory.vessel'),
            crew: t('admin.logCategory.crew'),
            ice: t('admin.logCategory.ice'),
            sar: t('admin.logCategory.sar'),
            user: t('admin.logCategory.user'),
            admin: t('admin.logCategory.admin'),
            photo: t('admin.logCategory.photo')
        };
    },

    state: {
        activeTab: 'users',
        stats: null,
        users: [],
        logs: {
            items: [],
            filters: { level: '', category: '', q: '' },
            page: 1,
            pagination: { page: 1, per_page: 50, total: 0, total_pages: 1 },
            searchDebounce: null
        }
    },

    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('admin.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('admin.subtitle'))}</div>
                    </div>
                </div>
                <div id="admin-stats-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('admin.loadingStats'))}</div></div>
                <div class="card">
                    <div class="card-header">
                        <h2 id="admin-section-title">${escapeHtml(t('admin.stats.users'))}</h2>
                    </div>
                    <div id="admin-alert"></div>
                    <div id="admin-section-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('common.loading'))}</div></div>
                </div>
            </div>`;

        await Promise.all([this.loadStats(), this.loadTab(this.state.activeTab)]);
    },

    async loadStats() {
        const container = document.getElementById('admin-stats-container');
        const response = await apiRequest('/admin/stats');

        if (!response.success) {
            container.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('admin.statsLoadFailed')))}</div>`;
            return;
        }

        this.state.stats = response.data;
        this.renderStatGrid();
    },

    renderStatGrid() {
        const container = document.getElementById('admin-stats-container');
        const stats = this.state.stats || {};
        const statLabels = this.statLabels();

        container.innerHTML = `
            <div class="stat-grid">
                ${Object.entries(statLabels).map(([key, label]) => `
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

        const config = this.tabConfig()[tab];
        document.getElementById('admin-section-title').textContent = config.title;
        document.getElementById('admin-alert').innerHTML = '';

        if (tab === 'logs') {
            await this.loadLogs(1);
            return;
        }

        const container = document.getElementById('admin-section-container');
        container.innerHTML = `<div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('common.loading'))}</div>`;

        const response = await apiRequest(config.endpoint);

        if (!response.success) {
            container.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('admin.loadTabFailed', { title: config.title.toLowerCase() })))}</div>`;
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
                            <th>${escapeHtml(t('common.name'))}</th>
                            <th>${escapeHtml(t('common.email'))}</th>
                            <th>${escapeHtml(t('common.phone'))}</th>
                            <th>${escapeHtml(t('admin.table.adminHeader'))}</th>
                            <th>${escapeHtml(t('admin.table.created'))}</th>
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
                <td>${user.is_admin ? `<span class="badge badge-active">${escapeHtml(t('admin.yes'))}</span>` : ''}</td>
                <td>${escapeHtml(formatDateTime(user.created_at))}</td>
                <td>
                    <button class="btn btn-danger btn-sm" type="button" data-delete-user="${user.id}"
                        ${isSelf ? `disabled title="${escapeHtml(t('admin.cannotDeleteSelf'))}"` : ''}>${escapeHtml(t('common.delete'))}</button>
                </td>
            </tr>`;
    },

    async handleDelete(userId) {
        const user = this.state.users.find((u) => u.id === userId);
        if (!user) return;

        if (!confirm(t('admin.confirmDeleteUser', { name: user.name, email: user.email }))) return;

        const alertBox = document.getElementById('admin-alert');
        const response = await apiRequest(`/admin/users/${userId}`, { method: 'DELETE' });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('admin.deleteUserFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast(t('admin.userDeleted'), 'success');
        await this.loadTab('users');
        await this.loadStats();
    },

    renderRoutesTable(container) {
        container.innerHTML = `
            <div class="table-scroll">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>${escapeHtml(t('admin.table.skipper'))}</th>
                            <th>${escapeHtml(t('admin.table.departure'))}</th>
                            <th>${escapeHtml(t('admin.table.arrival'))}</th>
                            <th>${escapeHtml(t('admin.table.tripStatus'))}</th>
                            <th>${escapeHtml(t('admin.table.order'))}</th>
                            <th>${escapeHtml(t('admin.table.created'))}</th>
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
                            <th>${escapeHtml(t('common.name'))}</th>
                            <th>${escapeHtml(t('admin.table.owner'))}</th>
                            <th>${escapeHtml(t('admin.table.mmsi'))}</th>
                            <th>${escapeHtml(t('admin.table.callSign'))}</th>
                            <th>${escapeHtml(t('admin.table.model'))}</th>
                            <th>${escapeHtml(t('admin.table.created'))}</th>
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
                            <th>${escapeHtml(t('common.name'))}</th>
                            <th>${escapeHtml(t('admin.table.relationship'))}</th>
                            <th>${escapeHtml(t('common.email'))}</th>
                            <th>${escapeHtml(t('common.phone'))}</th>
                            <th>${escapeHtml(t('admin.table.channel'))}</th>
                            <th>${escapeHtml(t('admin.table.confirmed'))}</th>
                            <th>${escapeHtml(t('admin.table.skipper'))}</th>
                            <th>${escapeHtml(t('admin.table.created'))}</th>
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
                <td>${contact.confirmed_at ? `<span class="badge badge-active">${escapeHtml(t('admin.yes'))}</span>` : `<span class="badge badge-draft">${escapeHtml(t('admin.no'))}</span>`}</td>
                <td>${escapeHtml(contact.skipper_name || '')}<br><span class="page-header__meta">${escapeHtml(contact.skipper_email || '')}</span></td>
                <td>${escapeHtml(formatDateTime(contact.created_at))}</td>
            </tr>`;
    },

    // ==================== Systemloggar ====================

    async loadLogs(page) {
        const container = document.getElementById('admin-section-container');
        const isFirstRender = !container.querySelector('#log-filters-bar');

        if (isFirstRender) {
            const logLevelLabels = this.logLevelLabels();
            const logCategoryLabels = this.logCategoryLabels();

            container.innerHTML = `
                <div id="log-filters-bar" class="log-filters">
                    <div class="field field--search">
                        <label for="log-search">${escapeHtml(t('admin.logs.searchLabel'))}</label>
                        <input type="text" id="log-search" placeholder="${escapeHtml(t('admin.logs.searchPlaceholder'))}" value="${escapeHtml(this.state.logs.filters.q)}">
                    </div>
                    <div class="field">
                        <label for="log-level">${escapeHtml(t('admin.logs.levelLabel'))}</label>
                        <select id="log-level">
                            <option value="">${escapeHtml(t('admin.logs.allLevels'))}</option>
                            ${Object.entries(logLevelLabels).map(([value, label]) => `
                                <option value="${value}" ${this.state.logs.filters.level === value ? 'selected' : ''}>${escapeHtml(label)}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="field">
                        <label for="log-category">${escapeHtml(t('admin.logs.categoryLabel'))}</label>
                        <select id="log-category">
                            <option value="">${escapeHtml(t('admin.logs.allCategories'))}</option>
                            ${Object.entries(logCategoryLabels).map(([value, label]) => `
                                <option value="${value}" ${this.state.logs.filters.category === value ? 'selected' : ''}>${escapeHtml(label)}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div id="log-results"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('common.loading'))}</div></div>
                <div id="log-pagination"></div>`;

            document.getElementById('log-search').addEventListener('input', (event) => {
                this.state.logs.filters.q = event.target.value;
                clearTimeout(this.state.logs.searchDebounce);
                this.state.logs.searchDebounce = setTimeout(() => this.loadLogs(1), 300);
            });

            document.getElementById('log-level').addEventListener('change', (event) => {
                this.state.logs.filters.level = event.target.value;
                this.loadLogs(1);
            });

            document.getElementById('log-category').addEventListener('change', (event) => {
                this.state.logs.filters.category = event.target.value;
                this.loadLogs(1);
            });
        }

        const resultsContainer = document.getElementById('log-results');
        resultsContainer.innerHTML = `<div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('common.loading'))}</div>`;

        const params = new URLSearchParams();
        params.set('page', String(page));
        if (this.state.logs.filters.level) params.set('level', this.state.logs.filters.level);
        if (this.state.logs.filters.category) params.set('category', this.state.logs.filters.category);
        if (this.state.logs.filters.q) params.set('q', this.state.logs.filters.q);

        const response = await apiRequest(`/admin/logs?${params.toString()}`);

        if (!response.success) {
            resultsContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('admin.logs.loadFailed')))}</div>`;
            document.getElementById('log-pagination').innerHTML = '';
            return;
        }

        this.state.logs.items = response.data.logs || [];
        this.state.logs.pagination = response.data.pagination || { page: 1, per_page: 50, total: 0, total_pages: 1 };
        this.state.logs.page = this.state.logs.pagination.page;

        this.renderLogsTable(resultsContainer);
        this.renderLogsPagination();
    },

    renderLogsTable(container) {
        if (this.state.logs.items.length === 0) {
            container.innerHTML = `<div class="empty-state"><h3>${escapeHtml(this.tabConfig().logs.emptyText)}</h3></div>`;
            return;
        }

        container.innerHTML = `
            <div class="table-scroll">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>${escapeHtml(t('admin.logs.table.time'))}</th>
                            <th>${escapeHtml(t('admin.logs.table.level'))}</th>
                            <th>${escapeHtml(t('admin.logs.table.category'))}</th>
                            <th>${escapeHtml(t('admin.logs.table.message'))}</th>
                            <th>${escapeHtml(t('admin.logs.table.user'))}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.logs.items.map((log) => this.renderLogRow(log)).join('')}
                    </tbody>
                </table>
            </div>`;
    },

    renderLogRow(log) {
        const levelLabel = this.logLevelLabels()[log.level] || log.level;
        const categoryLabel = this.logCategoryLabels()[log.category] || log.category;

        const stackTrace = log.stack_trace
            ? `<details class="log-stack-trace"><summary>${escapeHtml(t('admin.logs.stackTrace'))}</summary><pre>${escapeHtml(log.stack_trace)}</pre></details>`
            : '';

        // log.pii is only present at all for admins granted can_view_log_pii
        // (AdminHandler::listLogs()) - absent, not redacted, for everyone else.
        const piiData = log.pii
            ? `<details class="log-stack-trace"><summary>${escapeHtml(t('admin.logs.piiData'))}</summary><pre>${escapeHtml(JSON.stringify(log.pii, null, 2))}</pre></details>`
            : '';

        return `
            <tr>
                <td>${escapeHtml(formatDateTime(log.created_at))}</td>
                <td><span class="badge badge-log-${escapeHtml(log.level)}">${escapeHtml(levelLabel)}</span></td>
                <td>${escapeHtml(categoryLabel)}</td>
                <td class="log-message-cell">${escapeHtml(log.message)}${stackTrace}${piiData}</td>
                <td>${log.user_id ? escapeHtml(log.user_email || String(log.user_id)) : ''}</td>
            </tr>`;
    },

    renderLogsPagination() {
        const container = document.getElementById('log-pagination');
        const { page, total, total_pages: totalPages } = this.state.logs.pagination;

        if (total === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="pagination">
                <button class="btn btn-secondary btn-sm" type="button" id="log-prev-page" ${page <= 1 ? 'disabled' : ''}>${escapeHtml(t('admin.logs.prevPage'))}</button>
                <span class="pagination__info">${escapeHtml(t('admin.logs.pageInfo', { page, totalPages, total }))}</span>
                <button class="btn btn-secondary btn-sm" type="button" id="log-next-page" ${page >= totalPages ? 'disabled' : ''}>${escapeHtml(t('admin.logs.nextPage'))}</button>
            </div>`;

        const prevBtn = document.getElementById('log-prev-page');
        const nextBtn = document.getElementById('log-next-page');
        if (prevBtn) prevBtn.addEventListener('click', () => this.loadLogs(page - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.loadLogs(page + 1));
    }
};
