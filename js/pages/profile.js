const ProfilePage = {
    state: {
        user: null,
        gdprExport: null
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
                        <h2>${escapeHtml(t('profile.detailsHeading'))}</h2>
                    </div>
                    <h3>${escapeHtml(t('profile.photoHeading'))}</h3>
                    <div id="photo-alert"></div>
                    <div style="display:flex; align-items:center; gap: var(--space-3);">
                        <img id="profile-photo-preview" class="lightbox-trigger" alt=""
                             style="width:96px;height:96px;border-radius:50%;object-fit:cover;background:var(--color-bg);" hidden>
                        <div class="field" style="flex:1;">
                            <label for="profile-photo">${escapeHtml(t('profile.photoChangeLabel'))}</label>
                            <input type="file" id="profile-photo" accept="image/jpeg,image/png">
                            <small>${escapeHtml(t('profile.photoHint'))}</small>
                        </div>
                    </div>

                    <div id="profile-alert"></div>
                    <div id="profile-form-container">
                        <div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('profile.loadingDetails'))}</div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h2>${escapeHtml(t('profile.channelHeading'))}</h2>
                    </div>
                    <p>${escapeHtml(t('profile.channelHint'))}</p>
                    <div id="channel-alert"></div>
                    <div class="field">
                        <label for="profile-channel">${escapeHtml(t('profile.channelLabel'))}</label>
                        <select id="profile-channel">
                            <option value="email">${escapeHtml(t('profile.channelLabels.email'))}</option>
                            <option value="telegram">${escapeHtml(t('profile.channelLabels.telegram'))}</option>
                        </select>
                    </div>
                    <div id="telegram-link-widget" hidden></div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2>${escapeHtml(t('profile.passwordHeading'))}</h2>
                    </div>
                    <p>${escapeHtml(t('profile.passwordHint'))}</p>
                    <div id="password-alert"></div>
                    <form id="password-form" novalidate>
                        <div class="field">
                            <label for="current-password">${escapeHtml(t('profile.currentPasswordLabel'))}</label>
                            <input type="password" id="current-password" autocomplete="current-password">
                        </div>
                        <div class="field">
                            <label for="new-password">${escapeHtml(t('profile.newPasswordLabel'))}</label>
                            <input type="password" id="new-password" autocomplete="new-password">
                            <small>${escapeHtml(t('register.passwordHint'))}</small>
                        </div>
                        <div class="field">
                            <label for="confirm-new-password">${escapeHtml(t('profile.confirmNewPasswordLabel'))}</label>
                            <input type="password" id="confirm-new-password" autocomplete="new-password">
                        </div>
                        <button class="btn btn-primary" type="submit" id="password-submit">${escapeHtml(t('profile.passwordSubmit'))}</button>
                    </form>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h2>${escapeHtml(t('profile.gdprHeading'))}</h2>
                    </div>
                    <p>${escapeHtml(t('profile.gdprHint'))}</p>
                    <div id="gdpr-alert"></div>
                    <div id="gdpr-export-container">
                        <div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('profile.gdprChecking'))}</div>
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
                bindLightboxImages(document);
            }
        });
        document.getElementById('profile-channel').addEventListener('change', (e) => this.handleChannelChange(e.target.value));

        document.getElementById('password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleChangePassword();
        });

        await this.loadProfile();
        await this.loadOwnPhoto();
        await this.loadGdprExportStatus();
        await TelegramLink.render(document.getElementById('telegram-link-widget'), {
            onLinked: () => this.saveChannel('telegram'),
            onUnlinked: () => {
                // The backend already reset preferred_channel back to
                // 'email' server-side (User::unlinkTelegram()) - just
                // reflect that locally.
                document.getElementById('profile-channel').value = 'email';
                this.state.user = { ...this.state.user, preferred_channel: 'email' };
                this.updateTelegramWidgetVisibility('email');
            }
        });
    },

    updateTelegramWidgetVisibility(channel) {
        document.getElementById('telegram-link-widget').hidden = channel !== 'telegram';
    },

    async handleChannelChange(channel) {
        this.updateTelegramWidgetVisibility(channel);
        const status = await apiRequest('/user/telegram/status');

        if (channel === 'telegram' && !(status.success && status.data.linked)) {
            // Not linked yet - don't save, just surface the onboarding
            // widget so the user can complete it. saveChannel() runs
            // automatically via the widget's onLinked callback once they do.
            document.getElementById('telegram-link-widget').scrollIntoView({ behavior: 'smooth', block: 'center' });
            const startBtn = document.querySelector('#telegram-link-widget [data-telegram-start]');
            if (startBtn) startBtn.click();
            return;
        }

        await this.saveChannel(channel);
    },

    async saveChannel(channel) {
        const alertBox = document.getElementById('channel-alert');
        const response = await apiRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify({ preferred_channel: channel })
        });

        const resolvedChannel = response.success ? channel : (this.state.user.preferred_channel || 'email');
        document.getElementById('profile-channel').value = resolvedChannel;
        this.updateTelegramWidgetVisibility(resolvedChannel);

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('profile.channelSaveFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        this.state.user = { ...this.state.user, preferred_channel: channel };
        showToast(t('profile.channelSaved'), 'success');
    },

    async loadGdprExportStatus() {
        const response = await apiRequest('/user/gdpr-export');
        this.state.gdprExport = response.success ? response.data : { available: false, expires_at: null };
        this.renderGdprExport();
    },

    renderGdprExport() {
        const container = document.getElementById('gdpr-export-container');
        const { available, expires_at } = this.state.gdprExport;

        if (available) {
            container.innerHTML = `
                <p class="text-muted">${t('profile.gdprAvailableUntil', { date: escapeHtml(formatDateTime(expires_at)) })}</p>
                <div class="btn-group">
                    <button class="btn btn-primary" type="button" id="gdpr-download-btn">${escapeHtml(t('profile.gdprDownloadButton'))}</button>
                    <button class="btn btn-ghost" type="button" id="gdpr-request-btn">${escapeHtml(t('profile.gdprRequestAgainButton'))}</button>
                </div>`;
            document.getElementById('gdpr-download-btn').addEventListener('click', () => this.handleDownloadGdprExport());
            document.getElementById('gdpr-request-btn').addEventListener('click', () => this.handleRequestGdprExport());
            return;
        }

        container.innerHTML = `<button class="btn btn-primary" type="button" id="gdpr-request-btn">${escapeHtml(t('profile.gdprRequestButton'))}</button>`;
        document.getElementById('gdpr-request-btn').addEventListener('click', () => this.handleRequestGdprExport());
    },

    async handleRequestGdprExport() {
        const requestBtn = document.getElementById('gdpr-request-btn');
        const alertBox = document.getElementById('gdpr-alert');
        requestBtn.disabled = true;

        const response = await apiRequest('/user/gdpr-export', { method: 'POST' });

        requestBtn.disabled = false;

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('profile.gdprRequestFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        this.state.gdprExport = response.data;
        this.renderGdprExport();
        showToast(t('profile.gdprRequestReady'), 'success');
    },

    // Auth-protected endpoint, so a plain <a href> won't do (no way to
    // attach the Authorization header) - fetch as blob and trigger the
    // browser's save dialog via a temporary object URL.
    async handleDownloadGdprExport() {
        const downloadBtn = document.getElementById('gdpr-download-btn');
        const alertBox = document.getElementById('gdpr-alert');
        downloadBtn.disabled = true;

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/user/gdpr-export/download`, {
                headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
            });

            if (!response.ok) {
                throw new Error('download failed');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `yachting-earth-data-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            downloadBtn.disabled = false;
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('profile.gdprDownloadFailed'))}</div>`;
            return;
        }

        // The server deletes the file once it's been streamed
        this.state.gdprExport = { available: false, expires_at: null };
        this.renderGdprExport();
        showToast(t('profile.gdprDownloaded'), 'success');
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
            bindLightboxImages(document);
        } catch (err) { /* leave the preview hidden */ }
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
        const channel = response.data.preferred_channel || 'email';
        document.getElementById('profile-channel').value = channel;
        this.updateTelegramWidgetVisibility(channel);
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
                <div class="field">
                    <label for="profile-timezone">${escapeHtml(t('profile.timezoneLabel'))}</label>
                    <select id="profile-timezone">
                        <option value="">${escapeHtml(t('profile.timezoneAuto'))}</option>
                        ${TZ.list().map((tz) => `<option value="${escapeHtml(tz)}">${escapeHtml(tz)}</option>`).join('')}
                    </select>
                    <small>${escapeHtml(t('profile.timezoneHint'))}</small>
                </div>
                <button class="btn btn-primary" type="submit" id="profile-submit">${escapeHtml(t('profile.submit'))}</button>
            </form>`;

        // Set values via the DOM property rather than an HTML attribute so
        // user-supplied names/emails can never break out of the markup.
        document.getElementById('profile-name').value = this.state.user.name || '';
        document.getElementById('profile-phone').value = this.state.user.phone || '';
        document.getElementById('profile-email').value = this.state.user.email || '';
        document.getElementById('profile-lang').value = this.state.user.locale || I18n._lang || I18n.DEFAULT;
        document.getElementById('profile-timezone').value = this.state.user.timezone || '';

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
            locale: document.getElementById('profile-lang').value,
            timezone: document.getElementById('profile-timezone').value
        };

        if (!this.validate(values)) return;

        const submitBtn = document.getElementById('profile-submit');
        submitBtn.disabled = true;

        const response = await apiRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify({
                name: values.name, email: values.email, phone: values.phone || null,
                locale: values.locale, timezone: values.timezone || null
            })
        });

        const alertBox = document.getElementById('profile-alert');
        if (!response.success) {
            submitBtn.disabled = false;
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('profile.saveFailed')))}</div>`;
            return;
        }

        this.state.user = response.data;
        // response.data.email is still the CURRENT address - a changed email
        // only lands after the link mailed to the new address is clicked.
        Auth.updateUser({ name: response.data.name, email: response.data.email });
        renderTopbar();
        TZ.set(values.timezone || null);
        I18n.setLang(values.locale);

        const photoFile = document.getElementById('profile-photo').files[0];
        const photoAlertBox = document.getElementById('photo-alert');
        if (photoFile) {
            const formData = new FormData();
            formData.append('photo', photoFile);
            const photoResponse = await apiUpload('/user/photo', formData, 'PUT');

            if (!photoResponse.success) {
                submitBtn.disabled = false;
                photoAlertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(photoResponse.code ? t.error(photoResponse.code) : (photoResponse.error || t('profile.photoSaveFailed')))}</div>`;
                return;
            }

            photoAlertBox.innerHTML = '';
            Auth.updateUser({ picture: String(Date.now()) });
            renderTopbar();
        }

        submitBtn.disabled = false;

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

    async handleChangePassword() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;
        const alertBox = document.getElementById('password-alert');

        const error = (!currentPassword ? t('profile.currentPasswordRequired') : null)
            || Validate.password(newPassword)
            || (newPassword !== confirmNewPassword ? t('profile.passwordMismatch') : null);

        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        const submitBtn = document.getElementById('password-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('profile.passwordSaving'))}`;

        const response = await apiRequest('/user/password', {
            method: 'PUT',
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });

        submitBtn.disabled = false;
        submitBtn.textContent = t('profile.passwordSubmit');

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('profile.passwordChangeFailed')))}</div>`;
            return;
        }

        document.getElementById('password-form').reset();
        alertBox.innerHTML = '';
        showToast(t('profile.passwordChanged'), 'success');
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
