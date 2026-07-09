const CrewInvitePage = {
    state: { token: null, invitedEmail: null },

    async render(container, params, query) {
        this.state.token = query.get('token');

        if (!this.state.token) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">Ingen inbjudningslänk hittades. Kontrollera att du klickade på hela länken.</div>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="page page--narrow"><div class="loading-state"><span class="spinner"></span> Laddar inbjudan...</div></div>`;

        const preview = await apiRequest(`/crew/invite/${this.state.token}`);

        if (!preview.success) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">${escapeHtml(preview.error || 'Inbjudan är ogiltig eller har gått ut.')}</div>
                    <a class="btn btn-secondary" href="#/login">Till startsidan</a>
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
                   Du är inloggad som <strong>${escapeHtml(user.name || user.email || '')}</strong>
                   - inbjudan kopplas till ditt konto.
               </div>`
            : `<div class="checkbox-field">
                   <input type="checkbox" id="create-account">
                   <label for="create-account">Spara mitt konto så jag kan logga in senare${this.state.invitedEmail ? ` (${escapeHtml(this.state.invitedEmail)})` : ''}</label>
               </div>
               <div id="password-fields" hidden>
                   <div class="field">
                       <label for="account-password">Lösenord</label>
                       <input type="password" id="account-password" autocomplete="new-password">
                       <small>Minst 8 tecken, en stor bokstav och en siffra.</small>
                   </div>
                   <div class="field">
                       <label for="account-password-confirm">Bekräfta lösenord</label>
                       <input type="password" id="account-password-confirm" autocomplete="new-password">
                   </div>
               </div>
               <p class="text-muted" style="font-size: var(--font-size-sm);">
                   Har du redan ett konto? <a href="#/login">Logga in</a> och öppna länken igen så kopplas inbjudan till kontot.
               </p>`;

        container.innerHTML = `
            <div class="page page--narrow">
                <h1>Du är inbjuden på en resa!</h1>
                <div class="invite-summary">
                    <dl>
                        <dt>Skeppare</dt><dd>${escapeHtml(p.skipper || '–')}</dd>
                        <dt>Fartyg</dt><dd>${escapeHtml(p.vessel || '–')}</dd>
                        <dt>Avgång</dt><dd>${formatDateTime(p.planned_departure)}</dd>
                        <dt>Ankomst</dt><dd>${formatDateTime(p.planned_arrival)}</dd>
                        <dt>Besättning hittills</dt><dd>${p.current_crew_count} personer</dd>
                    </dl>
                </div>

                <div id="accept-alert"></div>

                <form id="accept-form" novalidate>
                    <div class="field">
                        <label for="name">Ditt namn</label>
                        <input type="text" id="name" value="${escapeHtml(p.invited_name || (authed ? (user.name || '') : ''))}" required>
                    </div>
                    <div class="field">
                        <label for="phone">Telefonnummer (valfritt)</label>
                        <input type="tel" id="phone" placeholder="+46701234567">
                    </div>
                    <div class="field">
                        <label for="ice-contact">Din ICE-kontakt (vid nödsituation)</label>
                        <input type="text" id="ice-contact" placeholder="t.ex. Erik (make) +46701234568">
                        <small>Namn och telefonnummer till någon som ska kontaktas om något händer.</small>
                    </div>
                    <div class="field">
                        <label for="photo">Foto på dig (valfritt men rekommenderat)</label>
                        <input type="file" id="photo" accept="image/jpeg,image/png">
                        <small>Används av sjöräddningen för att identifiera besättningen. JPEG/PNG, max 10 MB.</small>
                        <img id="photo-preview" alt="" hidden
                             style="margin-top: var(--space-2); width: 96px; height: 96px; border-radius: 50%; object-fit: cover;">
                    </div>
                    ${accountSection}
                    <div class="btn-group">
                        <button class="btn btn-primary" type="submit" id="accept-submit">Acceptera & gå med</button>
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
                || (password !== confirm ? 'Lösenorden stämmer inte överens' : null);
        }

        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Går med...';

        // Photo first: the upload is authorized by the invitation token,
        // which is consumed by the accept call below
        let photoWarning = '';
        if (photoFile) {
            const formData = new FormData();
            formData.append('photo', photoFile);
            const photoResponse = await apiUpload(`/crew/invite/${this.state.token}/photo`, formData);
            if (!photoResponse.success) {
                photoWarning = ` Fotot kunde dock inte laddas upp (${photoResponse.error || 'okänt fel'}).`;
            }
        }

        const response = await apiRequest(`/crew/invite/${this.state.token}`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                phone: phone || undefined,
                ice_contact: iceContact || undefined,
                create_account: createAccount || undefined,
                password: createAccount ? password : undefined
            })
        });

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Kunde inte gå med i resan.')}</div>`;
            submitBtn.disabled = false;
            submitBtn.textContent = 'Acceptera & gå med';
            return;
        }

        if (response.data.auth_token) {
            Auth.setSession(response.data);
        }

        document.getElementById('accept-form').outerHTML = `
            <div class="alert alert-success">
                Du är nu med i besättningen. Ha en trevlig och säker resa!${escapeHtml(photoWarning)}
                ${response.data.auth_token ? '<br><a href="#/dashboard">Till din översikt</a>' : ''}
            </div>`;
    }
};
