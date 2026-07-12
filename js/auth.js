/**
 * Auth token storage and session helpers.
 */
const Auth = {
    KEYS: {
        token: 'auth_token',
        refreshToken: 'refresh_token',
        userId: 'user_id',
        userName: 'user_name',
        userEmail: 'user_email',
        userPicture: 'user_picture',
        userIsAdmin: 'user_is_admin',
        userEmailVerified: 'user_email_verified'
    },

    setSession({ auth_token, refresh_token, user_id, name, email, picture, is_admin, email_verified }) {
        localStorage.setItem(this.KEYS.token, auth_token);
        if (refresh_token) localStorage.setItem(this.KEYS.refreshToken, refresh_token);
        localStorage.setItem(this.KEYS.userId, user_id);
        if (name) localStorage.setItem(this.KEYS.userName, name);
        if (email) localStorage.setItem(this.KEYS.userEmail, email);
        if (picture) localStorage.setItem(this.KEYS.userPicture, picture);
        localStorage.setItem(this.KEYS.userIsAdmin, is_admin ? '1' : '0');
        // Defaults to verified when the field is absent (login response, or
        // an older session) so we never nag an established account by mistake.
        localStorage.setItem(this.KEYS.userEmailVerified, email_verified === false ? '0' : '1');
    },

    // Updates just the access/refresh token pair after a silent
    // POST /auth/refresh, leaving the rest of the session untouched.
    setTokens(auth_token, refresh_token) {
        localStorage.setItem(this.KEYS.token, auth_token);
        if (refresh_token) localStorage.setItem(this.KEYS.refreshToken, refresh_token);
    },

    getToken() {
        return localStorage.getItem(this.KEYS.token);
    },

    getRefreshToken() {
        return localStorage.getItem(this.KEYS.refreshToken);
    },

    updateUser({ name, email, picture, email_verified } = {}) {
        if (name !== undefined) localStorage.setItem(this.KEYS.userName, name);
        if (email !== undefined) localStorage.setItem(this.KEYS.userEmail, email);
        if (picture !== undefined) localStorage.setItem(this.KEYS.userPicture, picture);
        if (email_verified !== undefined) {
            localStorage.setItem(this.KEYS.userEmailVerified, email_verified ? '1' : '0');
        }
    },

    getUser() {
        return {
            id: localStorage.getItem(this.KEYS.userId),
            name: localStorage.getItem(this.KEYS.userName),
            email: localStorage.getItem(this.KEYS.userEmail),
            picture: localStorage.getItem(this.KEYS.userPicture),
            isAdmin: localStorage.getItem(this.KEYS.userIsAdmin) === '1',
            emailVerified: localStorage.getItem(this.KEYS.userEmailVerified) !== '0'
        };
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    clear() {
        Object.values(this.KEYS).forEach((key) => localStorage.removeItem(key));
    }
};
