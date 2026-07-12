const CrewInvitePage = {
    state: { token: null, invitedEmail: null },

    async render(container, params, query) {
        this.state.token = query.get('token');

        if (!this.state.token) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">${t('crewInvite.noToken')}</div>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="page page--narrow"><div class="loading-state"><span class="spinner"></span> ${t('crewInvite.loading')}</div></div>`;

        const preview = await apiRequest(`/crew/invite/${this.state.token}`);

        if (!preview.success) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">${escapeHtml(preview.code ? t.error(preview.code) : (preview.error || t('crewInvite.invalidInvite')))}</div>
                    <a class="btn btn-secondary" href="#/login">${t('crewInvite.backToStart')}</a>
                </div>`;
            return;
        }

        const p = preview.data;
        this.state.invitedEmail = p.invited_email || null;

        const authed = Auth.isAuthenticated();
        const user = authed ? Auth.getUser() : null;

        // Logged in: the crew record is linked to the account automatically.
        // Not logged in: offer to create an account (password) on the
        // invited email, or continue as a one-off temp crew member.
        const accountSection = authed
            ? `<div class="alert alert-info">
                   ${t('crewInvite.accountSection.loggedIn', { name: escapeHtml(user.name || user.email || '') })}
               </div>`
            : `<div class="checkbox-field">
                   <input type="checkbox" id="create-account">
                   <label for="create-account">${t('crewInvite.accountSection.saveAccountLabel', { emailSuffix: this.state.invitedEmail ? ` (${escapeHtml(this.state.invitedEmail)})` : '' })}</label>
               </div>
               <div id="password-fields" hidden>
                   <div class="field">
                       <label for="account-password">${t('common.password')}</label>
                       <input type="password" id="account-password" autocomplete="new-password">
                       <small>${t('crewInvite.accountSection.passwordHint')}</small>
                   </div>
                   <div class="field">
                       <label for="account-password-confirm">${t('crewInvite.accountSection.confirmPasswordLabel')}</label>
                       <input type="password" id="account-password-confirm" autocomplete="new-password">
                   </div>
               </div>
               <p class="text-muted" style="font-size: var(--font-size-sm);">
                   ${t('crewInvite.accountSection.haveAccount', { loginLink: `<a href="#/login">${t('crewInvite.loginLink')}</a>` })}
               </p>`;

        container.innerHTML = `
            <div class="page page--narrow">
                <h1>${t('crewInvite.title')}</h1>
                <div class="invite-summary">
                    <dl>
                        <dt>${t('crewInvite.summary.skipper')}</dt><dd>${escapeHtml(p.skipper || '–')}</dd>
                        <dt>${t('crewInvite.summary.vessel')}</dt><dd>${escapeHtml(p.vessel || '–')}</dd>
                        <dt>${t('crewInvite.summary.departure')}</dt><dd>${formatDateTime(p.planned_departure)}</dd>
                        <dt>${t('crewInvite.summary.arrival')}</dt><dd>${formatDateTime(p.planned_arrival)}</dd>
                        <dt>${t('crewInvite.summary.crewCount')}</dt><dd>${t('crewInvite.summary.crewCountValue', { count: p.current_crew_count })}</dd>
                    </dl>
                </div>

                <div id="accept-alert"></div>

                <form id="accept-form" novalidate>
                    <div class="field">
                        <label for="name">${t('crewInvite.nameLabel')}</label>
                        <input type="text" id="name" value="${escapeHtml(p.invited_name || (authed ? (user.name || '') : ''))}" required>
                    </div>
                    <div class="field">
                        <label for="phone">${t('crewInvite.phoneLabel')}</label>
                        <input type="tel" id="phone" placeholder="${t('crewInvite.phonePlaceholder')}">
                    </div>
                    <div class="field">
                        <label for="ice-contact">${t('crewInvite.iceContactLabel')}</label>
                        <input type="text" id="ice-contact" placeholder="${t('crewInvite.iceContactPlaceholder')}">
                        <small>${t('crewInvite.iceContactHint')}</small>
                    </div>
                    <div class="field">
                        <label>${t('crewInvite.sharing.heading')}</label>
                        <small>${t('crewInvite.sharing.contactHint')}</small>
                        <div class="checkbox-field">
                            <input type="checkbox" id="share-contact-ice">
                            <label for="share-contact-ice">${t('crewInvite.sharing.shareContactWithIce')}</label>
                        </div>
                        <small>${t('crewInvite.sharing.emergencyHint')}</small>
                        <div class="checkbox-field">
                            <input type="checkbox" id="share-emergency-ice">
                            <label for="share-emergency-ice">${t('crewInvite.sharing.shareEmergencyWithIce')}</label>
                        </div>
                    </div>
                    <div class="field">
                        <label for="photo">${t('crewInvite.photoLabel')}</label>
                        <input type="file" id="photo" accept="image/jpeg,image/png">
                        <small>${t('crewInvite.photoHint')}</small>
                        <img id="photo-preview" alt="" hidden
                             style="margin-top: var(--space-2); width: 96px; height: 96px; border-radius: 50%; object-fit: cover;">
                    </div>
                    ${accountSection}
                    <div class="btn-group">
                        <button class="btn btn-primary" type="submit" id="accept-submit">${t('crewInvite.submit')}</button>
                    </div>
                </form>
            </div>`;

        document.getElementById('accept-form').addEventListener('submit', (e) => this.handleAccept(e));

        const photoInput = document.getElementById('photo');
        photoInput.addEventListener('change', () => {
            const preview = document.getElementById('photo-preview');
            const file = photoInput.files[0];
            if (file) {
                preview.src = URL.createObjectURL(file);
                preview.hidden = false;
            } else {
                preview.hidden = true;
            }
        });

        const createAccountBox = document.getElementById('create-account');
        if (createAccountBox) {
            createAccountBox.addEventListener('change', () => {
                document.getElementById('password-fields').hidden = !createAccountBox.checked;
            });
        }
    },

    async handleAccept(e) {
        e.preventDefault();

        const alertBox = document.getElementById('accept-alert');
        const submitBtn = document.getElementById('accept-submit');

        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const iceContact = document.getElementById('ice-contact').value.trim();
        const photoFile = document.getElementById('photo').files[0] || null;

        const createAccountBox = document.getElementById('create-account');
        const createAccount = !!(createAccountBox && createAccountBox.checked);

        let error = Validate.name(name) || Validate.phone(phone, true);

        let password = null;
        if (!error && createAccount) {
            password = document.getElementById('account-password').value;
            const confirm = document.getElementById('account-password-confirm').value;
            error = Validate.password(password)
                || (password !== confirm ? t('crewInvite.passwordMismatch') : null);
        }

        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${t('crewInvite.submitting')}`;

        // Photo first: the upload is authorized by the invitation token,
        // which is consumed by the accept call below
        let photoWarning = '';
        if (photoFile) {
            const formData = new FormData();
            formData.append('photo', photoFile);
            const photoResponse = await apiUpload(`/crew/invite/${this.state.token}/photo`, formData);
            if (!photoResponse.success) {
                const reason = photoResponse.code ? t.error(photoResponse.code) : (photoResponse.error || t('crewInvite.unknownError'));
                photoWarning = ' ' + t('crewInvite.photoUploadFailed', { reason });
            }
        }

        const shareContact = [];
        if (document.getElementById('share-contact-ice').checked) shareContact.push('ice');
        const shareEmergencyContact = [];
        if (document.getElementById('share-emergency-ice').checked) shareEmergencyContact.push('ice');

        const response = await apiRequest(`/crew/invite/${this.state.token}`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                phone: phone || undefined,
                ice_contact: iceContact || undefined,
                share_contact: shareContact,
                share_emergency_contact: shareEmergencyContact,
                create_account: createAccount || undefined,
                password: createAccount ? password : undefined
            })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('crewInvite.acceptFailed')))}</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = t('crewInvite.submit');
            return;
        }

        if (response.data.auth_token) {
            Auth.setSession(response.data);
            renderTopbar();
        }

        document.getElementById('accept-form').outerHTML = `
            <div class="alert alert-success">
                ${t('crewInvite.acceptSuccess')}${escapeHtml(photoWarning)}
                ${response.data.auth_token ? `<br><a href="#/dashboard">${t('crewInvite.toOverview')}</a>` : ''}
            </div>
            ${response.data.crew_view_link ? `
            <div class="invite-summary">
                <p>${t('crewInvite.crewViewLinkHint')}</p>
                <div class="btn-group">
                    <a class="btn btn-secondary" href="${escapeHtml(response.data.crew_view_link)}">${t('crewInvite.crewViewLinkOpen')}</a>
                    <button class="btn btn-ghost" type="button" id="copy-crew-view-link">${t('crewInvite.crewViewLinkCopy')}</button>
                </div>
            </div>` : ''}`;

        const copyBtn = document.getElementById('copy-crew-view-link');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(response.data.crew_view_link);
                    showToast(t('crewInvite.crewViewLinkCopied'), 'success');
                } catch (err) {
                    showToast(response.data.crew_view_link, 'info');
                }
            });
        }
    }
};
