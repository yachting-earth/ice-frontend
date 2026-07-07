/**
 * Auth token storage and session helpers.
 */
const Auth = {
    KEYS: {
        token: 'auth_token',
        userId: 'user_id',
        userName: 'user_name',
        userEmail: 'user_email'
    },

    setSession({ auth_token, user_id, name, email }) {
        localStorage.setItem(this.KEYS.token, auth_token);
        localStorage.setItem(this.KEYS.userId, user_id);
        if (name) localStorage.setItem(this.KEYS.userName, name);
        if (email) localStorage.setItem(this.KEYS.userEmail, email);
    },

    getToken() {
        return localStorage.getItem(this.KEYS.token);
    },

    getUser() {
        return {
            id: localStorage.getItem(this.KEYS.userId),
            name: localStorage.getItem(this.KEYS.userName),
            email: localStorage.getItem(this.KEYS.userEmail)
        };
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    clear() {
        Object.values(this.KEYS).forEach((key) => localStorage.removeItem(key));
    }
};
