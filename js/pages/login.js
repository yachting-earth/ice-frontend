const LoginPage = {
    async render(container) {
        container.innerHTML = `
            <div class="centered-page">
                <div class="auth-card">
                    <div class="auth-card__logo">⚓ Yachting Earth</div>
                    <div class="auth-card__tagline">Trygg utflykt, tryggt hemkomst</div>
                    <div id="login-alert"></div>
                    <form id="login-form" novalidate>
                        <div class="field">
                            <label for="email">E-post</label>
                            <input type="email" id="email" autocomplete="email" required>
                        </div>
                        <div class="field">
                            <label for="password">Lösenord</label>
                            <input type="password" id="password" autocomplete="current-password" required>
                        </div>
                        <button class="btn btn-primary btn-block" type="submit" id="login-submit">Logga in</button>
                    </form>
                    <div class="auth-card__footer">
                        Inget konto? <a href="#/register">Registrera dig</a>
                    </div>
                </div>
            </div>`;

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleSubmit(e));
    },

    async handleSubmit(e) {
        e.preventDefault();

        const alertBox = document.getElementById('login-alert');
        const submitBtn = document.getElementById('login-submit');
        alertBox.innerHTML = '';

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        const emailError = Validate.email(email);
        if (emailError) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(emailError)}</div>`;
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Loggar in...';

        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (response.success) {
            Auth.setSession({
                auth_token: response.data.auth_token,
                user_id: response.data.user_id,
                name: response.data.name,
                email: response.data.email,
                picture: response.data.picture,
                is_admin: response.data.is_admin,
                email_verified: response.data.email_verified
            });
            location.hash = '#/dashboard';
            return;
        }

        alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.error || 'Inloggningen misslyckades.')}</div>`;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Logga in';
    }
};
