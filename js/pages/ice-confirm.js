const IceConfirmPage = {
    state: { token: null },

    async render(container, params, query) {
        this.state.token = query.get('token');

        if (!this.state.token) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">${t('iceConfirm.noToken')}</div>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="page page--narrow"><div class="loading-state"><span class="spinner"></span> ${t('iceConfirm.loading')}</div></div>`;

        const preview = await apiRequest(`/ice-contacts/confirm/${this.state.token}`);

        if (!preview.success) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">${escapeHtml(preview.code ? t.error(preview.code) : (preview.error || t('iceConfirm.invalidLink')))}</div>
                    <a class="btn btn-secondary" href="#/login">${t('iceConfirm.backToStart')}</a>
                </div>`;
            return;
        }

        const p = preview.data;
        const authed = Auth.isAuthenticated();
        const user = authed ? Auth.getUser() : null;

        // Logged in: the contact record is linked to the account automatically.
        // Not logged in: an account is mandatory (otherwise there's no way to
        // log back in later, since this link is single-use) - password
        // fields are always shown, with an opt-in for automatic deletion.
        const accountSection = authed
            ? `<div class="alert alert-info">
                   ${t('iceConfirm.accountSection.loggedIn', { name: escapeHtml(user.name || user.email || '') })}
               </div>`
            : `<div class="field">
                   <label for="account-password">${t('common.password')}</label>
                   <input type="password" id="account-password" autocomplete="new-password">
                   <small>${t('iceConfirm.accountSection.passwordHint')}</small>
               </div>
               <div class="field">
                   <label for="account-password-confirm">${t('iceConfirm.accountSection.confirmPasswordLabel')}</label>
                   <input type="password" id="account-password-confirm" autocomplete="new-password">
               </div>
               <div class="checkbox-field">
                   <input type="checkbox" id="delete-after-trip">
                   <label for="delete-after-trip">${t('iceConfirm.accountSection.deleteAfterTripLabel')}</label>
               </div>
               <p class="text-muted" style="font-size: var(--font-size-sm);">
                   ${t('iceConfirm.accountSection.retentionNote')}
               </p>
               <p class="text-muted" style="font-size: var(--font-size-sm);">
                   ${t('iceConfirm.accountSection.haveAccount', { loginLink: `<a href="#/login">${t('iceConfirm.loginLink')}</a>` })}
               </p>`;

        container.innerHTML = `
            <div class="page page--narrow">
                <h1>${t('iceConfirm.title')}</h1>
                <div class="invite-summary">
                    <p>
                        ${t('iceConfirm.intro', {
                            skipper: `<strong>${escapeHtml(p.skipper || '–')}</strong>`,
                            relationshipSuffix: p.relationship ? ` (${escapeHtml(p.relationship)})` : ''
                        })}
                    </p>
                </div>

                <div id="confirm-alert"></div>

                <form id="confirm-form" novalidate>
                    ${accountSection}
                    <div class="btn-group">
                        <button class="btn btn-primary" type="submit" id="confirm-submit">${t('common.confirm')}</button>
                    </div>
                </form>
            </div>`;

        document.getElementById('confirm-form').addEventListener('submit', (e) => this.handleConfirm(e));
    },

    async handleConfirm(e) {
        e.preventDefault();

        const alertBox = document.getElementById('confirm-alert');
        const submitBtn = document.getElementById('confirm-submit');

        // Not logged in -> account creation is mandatory (there's no other
        // path through this form when Auth.isAuthenticated() is false, see
        // render()); logged in -> the account fields don't exist at all.
        const createAccount = !Auth.isAuthenticated();

        let password = null;
        let deleteAfterTrip = false;
        let error = null;
        if (createAccount) {
            password = document.getElementById('account-password').value;
            const confirm = document.getElementById('account-password-confirm').value;
            deleteAfterTrip = document.getElementById('delete-after-trip').checked;
            error = Validate.password(password)
                || (password !== confirm ? t('iceConfirm.passwordMismatch') : null);
        }

        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${t('iceConfirm.confirming')}`;

        const response = await apiRequest(`/ice-contacts/confirm/${this.state.token}`, {
            method: 'POST',
            body: JSON.stringify({
                create_account: createAccount || undefined,
                password: createAccount ? password : undefined,
                delete_after_trip: createAccount ? deleteAfterTrip : undefined
            })
        });

        if (!response.success) {
            const message = response.code === 'RESOURCE_CONFLICT'
                ? t('iceConfirm.accountConflict')
                : (response.code ? t.error(response.code) : (response.error || t('iceConfirm.confirmFailed')));
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(message)}</div>`;
            if (response.code === 'RESOURCE_CONFLICT') {
                alertBox.innerHTML += `<a class="btn btn-secondary" href="#/login" style="margin-top: var(--space-2);">${t('iceConfirm.loginLink')}</a>`;
            }
            submitBtn.disabled = false;
            submitBtn.textContent = t('common.confirm');
            return;
        }

        if (response.data.auth_token) {
            Auth.setSession(response.data);
            renderTopbar();
        }

        const policyNote = createAccount
            ? (deleteAfterTrip
                ? t('iceConfirm.policyNoteDelete')
                : t('iceConfirm.policyNoteKeep'))
            : '';

        document.getElementById('confirm-form').outerHTML = `
            <div class="alert alert-success">
                ${t('iceConfirm.confirmSuccess')}
                ${policyNote ? `<br>${escapeHtml(policyNote)}` : ''}
                ${response.data.auth_token ? `<br><a href="#/dashboard">${t('iceConfirm.toOverview')}</a>` : ''}
            </div>`;
    }
};
