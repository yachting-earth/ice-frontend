const AdminPage = {
    STAT_LABELS: {
        users: 'Användare',
        routes: 'Rutter',
        vessels: 'Båtar',
        ice_contacts: 'ICE-kontakter'
    },

    state: {
        users: []
    },

    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>Admin</h1>
                        <div class="page-header__meta">Systemstatistik och användarhantering</div>
                    </div>
                </div>
                <div id="admin-stats-container"><div class="loading-state"><span class="spinner"></span> Laddar statistik...</div></div>
                <div class="card">
                    <div class="card-header">
                        <h2>Användare</h2>
                    </div>
                    <div id="admin-alert"></div>
                    <div id="admin-users-container"><div class="loading-state"><span class="spinner"></span> Laddar användare...</div></div>
                </div>
            </div>`;

        await Promise.all([this.loadStats(), this.loadUsers()]);
    },

    async loadStats() {
        const container = document.getElementById('admin-stats-container');
        const response = await apiRequest('/admin/stats');

        if (!response.success) {
            container.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta statistik.')}</div>`;
            return;
        }

        container.innerHTML = `
            <div class="stat-grid">
                ${Object.entries(this.STAT_LABELS).map(([key, label]) => `
                    <div class="stat-tile">
                        <div class="stat-tile__value">${escapeHtml(String(response.data[key] ?? 0))}</div>
                        <div class="stat-tile__label">${escapeHtml(label)}</div>
                    </div>
                `).join('')}
            </div>`;
    },

    async loadUsers() {
        const container = document.getElementById('admin-users-container');
        const response = await apiRequest('/admin/users');

        if (!response.success) {
            container.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte hämta användare.')}</div>`;
            return;
        }

        this.state.users = response.data || [];

        if (this.state.users.length === 0) {
            container.innerHTML = `<div class="empty-state"><h3>Inga användare</h3></div>`;
            return;
        }

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
        await this.loadUsers();
        await this.loadStats();
    }
};
