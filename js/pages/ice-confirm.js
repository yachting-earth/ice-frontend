const IceConfirmPage = {
    state: { token: null },

    async render(container, params, query) {
        this.state.token = query.get('token');

        if (!this.state.token) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">Ingen bekräftelselänk hittades. Kontrollera att du klickade på hela länken.</div>
                </div>`;
            return;
        }

        container.innerHTML = `<div class="page page--narrow"><div class="loading-state"><span class="spinner"></span> Laddar...</div></div>`;

        const preview = await apiRequest(`/ice-contacts/confirm/${this.state.token}`);

        if (!preview.success) {
            container.innerHTML = `
                <div class="page page--narrow">
                    <div class="alert alert-error">${escapeHtml(preview.error || 'Länken är ogiltig eller har redan använts.')}</div>
                    <a class="btn btn-secondary" href="#/login">Till startsidan</a>
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
                   Du är inloggad som <strong>${escapeHtml(user.name || user.email || '')}</strong>
                   - bekräftelsen kopplas till ditt konto.
               </div>`
            : `<div class="field">
                   <label for="account-password">Lösenord</label>
                   <input type="password" id="account-password" autocomplete="new-password">
                   <small>Minst 8 tecken, en stor bokstav och en siffra.</small>
               </div>
               <div class="field">
                   <label for="account-password-confirm">Bekräfta lösenord</label>
                   <input type="password" id="account-password-confirm" autocomplete="new-password">
               </div>
               <div class="checkbox-field">
                   <input type="checkbox" id="delete-after-trip">
                   <label for="delete-after-trip">Radera mitt konto och mina uppgifter automatiskt när resan/resorna jag är nödkontakt för är avslutade</label>
               </div>
               <p class="text-muted" style="font-size: var(--font-size-sm);">
                   Som standard behåller vi ditt konto permanent så att du kan logga in igen vid framtida resor
                   och uppdatera dina uppgifter. Kryssa i rutan ovan om du istället vill att kontot och dina
                   uppgifter raderas automatiskt en tid efter att resan är över.
               </p>
               <p class="text-muted" style="font-size: var(--font-size-sm);">
                   Har du redan ett konto? <a href="#/login">Logga in</a> och öppna länken igen så kopplas bekräftelsen till kontot.
               </p>`;

        container.innerHTML = `
            <div class="page page--narrow">
                <h1>Bekräfta som nödkontakt</h1>
                <div class="invite-summary">
                    <p>
                        <strong>${escapeHtml(p.skipper || '–')}</strong> har lagt till dig som sin ICE-kontakt
                        (In Case of Emergency)${p.relationship ? ` (${escapeHtml(p.relationship)})` : ''}.
                        Det innebär att du kan bli kontaktad om personen inte checkar in från en segling i tid.
                    </p>
                </div>

                <div id="confirm-alert"></div>

                <form id="confirm-form" novalidate>
                    ${accountSection}
                    <div class="btn-group">
                        <button class="btn btn-primary" type="submit" id="confirm-submit">Bekräfta</button>
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
                || (password !== confirm ? 'Lösenorden stämmer inte överens' : null);
        }

        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Bekräftar...';

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
                ? 'Du har redan ett konto med den här e-postadressen. Logga in och öppna länken igen för att bekräfta.'
                : (response.error || 'Kunde inte bekräfta.');
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(message)}</div>`;
            if (response.code === 'RESOURCE_CONFLICT') {
                alertBox.innerHTML += `<a class="btn btn-secondary" href="#/login" style="margin-top: var(--space-2);">Logga in</a>`;
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Bekräfta';
            return;
        }

        if (response.data.auth_token) {
            Auth.setSession(response.data);
            renderTopbar();
        }

        const policyNote = createAccount
            ? (deleteAfterTrip
                ? 'Ditt konto och dina uppgifter raderas automatiskt när resan/resorna du är nödkontakt för är avslutade.'
                : 'Ditt konto behålls permanent så att du kan logga in igen vid framtida resor och uppdatera dina uppgifter.')
            : '';

        document.getElementById('confirm-form').outerHTML = `
            <div class="alert alert-success">
                Tack! Du är nu bekräftad som nödkontakt.
                ${policyNote ? `<br>${escapeHtml(policyNote)}` : ''}
                ${response.data.auth_token ? '<br><a href="#/dashboard">Till din översikt</a>' : ''}
            </div>`;
    }
};
