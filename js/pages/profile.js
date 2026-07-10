const ProfilePage = {
    state: {
        user: null
    },

    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('profile.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('profile.subtitle'))}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h2>${escapeHtml(t('profile.photoHeading'))}</h2>
                    </div>
                    <div id="photo-alert"></div>
                    <div style="display:flex; align-items:center; gap: var(--space-3);">
                        <img id="profile-photo-preview" alt=""
                             style="width:96px;height:96px;border-radius:50%;object-fit:cover;background:var(--color-bg);" hidden>
                        <div class="field" style="flex:1;">
                            <label for="profile-photo">${escapeHtml(t('profile.photoChangeLabel'))}</label>
                            <input type="file" id="profile-photo" accept="image/jpeg,image/png">
                            <small>${escapeHtml(t('profile.photoHint'))}</small>
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-sm" type="button" id="photo-submit" style="margin-top: var(--space-3);">${escapeHtml(t('profile.photoSubmit'))}</button>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2>${escapeHtml(t('profile.detailsHeading'))}</h2>
                    </div>
                    <div id="profile-alert"></div>
                    <div id="profile-form-container">
                        <div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('profile.loadingDetails'))}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h2>${escapeHtml(t('profile.deleteHeading'))}</h2>
                    </div>
                    <p>${escapeHtml(t('profile.deleteWarning'))}</p>
                    <div id="delete-alert"></div>
                    <button class="btn btn-danger" type="button" id="delete-account-btn">${escapeHtml(t('profile.deleteButton'))}</button>
                    <form id="delete-form" hidden>
                        <div class="field">
                            <label for="delete-password">${escapeHtml(t('profile.deletePasswordLabel'))}</label>
                            <input type="password" id="delete-password" autocomplete="current-password">
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-danger" type="submit" id="delete-confirm-btn">${escapeHtml(t('profile.deleteConfirmButton'))}</button>
                            <button class="btn btn-ghost" type="button" id="delete-cancel-btn">${escapeHtml(t('profile.deleteCancelButton'))}</button>
                        </div>
                    </form>
                </div>
            </div>`;

        document.getElementById('delete-account-btn').addEventListener('click', () => this.showDeleteForm());
        document.getElementById('delete-cancel-btn').addEventListener('click', () => this.hideDeleteForm());
        document.getElementById('delete-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleDeleteAccount();
        });

        document.getElementById('profile-photo').addEventListener('change', () => {
            const preview = document.getElementById('profile-photo-preview');
            const file = document.getElementById('profile-photo').files[0];
            if (file) {
                preview.src = URL.createObjectURL(file);
                preview.hidden = false;
            }
        });
        document.getElementById('photo-submit').addEventListener('click', () => this.handlePhotoSubmit());

        await this.loadProfile();
        await this.loadOwnPhoto();
    },

    async loadOwnPhoto() {
        const preview = document.getElementById('profile-photo-preview');
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/users/${Auth.getUser().id}/photo`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });
            if (!response.ok) return;
            preview.src = URL.createObjectURL(await response.blob());
            preview.hidden = false;
        } catch (err) { /* leave the preview hidden */ }
    },

    async handlePhotoSubmit() {
        const alertBox = document.getElementById('photo-alert');
        const photoFile = document.getElementById('profile-photo').files[0];

        if (!photoFile) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('profile.photoChooseFirst'))}</div>`;
            return;
        }

        const submitBtn = document.getElementById('photo-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('profile.photoSaving'))}`;

        const formData = new FormData();
        formData.append('photo', photoFile);
        const response = await apiUpload('/user/photo', formData, 'PUT');

        submitBtn.disabled = false;
        submitBtn.textContent = t('profile.photoSubmit');

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('profile.photoSaveFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        Auth.updateUser({ picture: String(Date.now()) });
        renderTopbar();
        showToast(t('profile.photoSaved'), 'success');
    },

    async loadProfile() {
        const formContainer = document.getElementById('profile-form-container');
        const response = await apiRequest('/user/profile');

        if (!response.success) {
            formContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('profile.loadFailed')))}</div>`;
            return;
        }

        this.state.user = response.data;
        this.renderForm();
    },

    renderForm() {
        const formContainer = document.getElementById('profile-form-container');
        formContainer.innerHTML = `
            <form id="profile-form" novalidate>
                <div class="field-row">
                    <div class="field">
                        <label for="profile-name">${escapeHtml(t('profile.nameLabel'))}</label>
                        <input type="text" id="profile-name" autocomplete="name">
                    </div>
                    <div class="field">
                        <label for="profile-phone">${escapeHtml(t('profile.phoneLabel'))}</label>
                        <input type="tel" id="profile-phone" autocomplete="tel" placeholder="${escapeHtml(t('register.phonePlaceholder'))}">
                    </div>
                </div>
                <div class="field">
                    <label for="profile-email">${escapeHtml(t('profile.emailLabel'))}</label>
                    <input type="email" id="profile-email" autocomplete="email">
                </div>
                <div class="field">
                    <label for="profile-lang">${escapeHtml(t('profile.languageLabel'))}</label>
                    <select id="profile-lang">
                        ${I18n.SUPPORTED.map((lang) => `<option value="${lang}">${lang.toUpperCase()}</option>`).join('')}
                    </select>
                </div>
                <button class="btn btn-primary" type="submit" id="profile-submit">${escapeHtml(t('profile.submit'))}</button>
            </form>`;

        // Set values via the DOM property rather than an HTML attribute so
        // user-supplied names/emails can never break out of the markup.
        document.getElementById('profile-name').value = this.state.user.name || '';
        document.getElementById('profile-phone').value = this.state.user.phone || '';
        document.getElementById('profile-email').value = this.state.user.email || '';
        document.getElementById('profile-lang').value = this.state.user.locale || I18n._lang || I18n.DEFAULT;

        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    },

    validate(values) {
        const error = Validate.name(values.name) || Validate.email(values.email) || Validate.phone(values.phone, true);
        const alertBox = document.getElementById('profile-alert');
        alertBox.innerHTML = error ? `<div class="alert alert-error">${escapeHtml(error)}</div>` : '';
        return !error;
    },

    async handleSubmit() {
        const values = {
            name: document.getElementById('profile-name').value.trim(),
            phone: document.getElementById('profile-phone').value.trim(),
            email: document.getElementById('profile-email').value.trim(),
            locale: document.getElementById('profile-lang').value
        };

        if (!this.validate(values)) return;

        const submitBtn = document.getElementById('profile-submit');
        submitBtn.disabled = true;

        const response = await apiRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify({ name: values.name, email: values.email, phone: values.phone || null, locale: values.locale })
        });

        submitBtn.disabled = false;

        const alertBox = document.getElementById('profile-alert');
        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('profile.saveFailed')))}</div>`;
            return;
        }

        this.state.user = response.data;
        // response.data.email is still the CURRENT address - a changed email
        // only lands after the link mailed to the new address is clicked.
        Auth.updateUser({ name: response.data.name, email: response.data.email });
        renderTopbar();
        I18n.setLang(values.locale);

        if (response.data.email_change_pending) {
            // Reset the field back to the current address so it doesn't look
            // like the change already took effect.
            const emailInput = document.getElementById('profile-email');
            if (emailInput) emailInput.value = response.data.email || '';
            alertBox.innerHTML = `
                <div class="alert alert-info">
                    ${t('profile.emailChangePending', { email: escapeHtml(response.data.pending_email || '') })}
                </div>`;
            return;
        }

        alertBox.innerHTML = '';
        showToast(t('profile.saved'), 'success');
    },

    showDeleteForm() {
        document.getElementById('delete-account-btn').hidden = true;
        document.getElementById('delete-form').hidden = false;
        document.getElementById('delete-password').focus();
    },

    hideDeleteForm() {
        document.getElementById('delete-form').hidden = true;
        document.getElementById('delete-account-btn').hidden = false;
        document.getElementById('delete-password').value = '';
        document.getElementById('delete-alert').innerHTML = '';
    },

    async handleDeleteAccount() {
        const password = document.getElementById('delete-password').value;
        const alertBox = document.getElementById('delete-alert');

        if (!password) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('profile.passwordRequired'))}</div>`;
            return;
        }

        const confirmBtn = document.getElementById('delete-confirm-btn');
        confirmBtn.disabled = true;

        const response = await apiRequest('/user/delete-account', {
            method: 'POST',
            body: JSON.stringify({ password, confirm: true })
        });

        // A wrong password is the only outcome that should keep the user on
        // this page - anything else (success, or the account already being
        // gone e.g. from a retried/duplicate request) means there's no
        // account left to stay signed into, so log out immediately rather
        // than leaving a stale session showing a scary error.
        if (!response.success && response.code !== 'NOT_FOUND') {
            confirmBtn.disabled = false;
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('profile.deleteFailed')))}</div>`;
            return;
        }

        Auth.clear();
        location.hash = '#/login';
        showToast(t('profile.deleted'), 'success');
    }
};
