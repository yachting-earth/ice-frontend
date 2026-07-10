/**
 * Auth token storage and session helpers.
 */
const Auth = {
    KEYS: {
        token: 'auth_token',
        userId: 'user_id',
        userName: 'user_name',
        userEmail: 'user_email',
        userPicture: 'user_picture',
        userIsAdmin: 'user_is_admin'
    },

    setSession({ auth_token, user_id, name, email, picture, is_admin }) {
        localStorage.setItem(this.KEYS.token, auth_token);
        localStorage.setItem(this.KEYS.userId, user_id);
        if (name) localStorage.setItem(this.KEYS.userName, name);
        if (email) localStorage.setItem(this.KEYS.userEmail, email);
        if (picture) localStorage.setItem(this.KEYS.userPicture, picture);
        localStorage.setItem(this.KEYS.userIsAdmin, is_admin ? '1' : '0');
    },

    getToken() {
        return localStorage.getItem(this.KEYS.token);
    },

    updateUser({ name, email, picture } = {}) {
        if (name !== undefined) localStorage.setItem(this.KEYS.userName, name);
        if (email !== undefined) localStorage.setItem(this.KEYS.userEmail, email);
        if (picture !== undefined) localStorage.setItem(this.KEYS.userPicture, picture);
    },

    getUser() {
        return {
            id: localStorage.getItem(this.KEYS.userId),
            name: localStorage.getItem(this.KEYS.userName),
            email: localStorage.getItem(this.KEYS.userEmail),
            picture: localStorage.getItem(this.KEYS.userPicture),
            isAdmin: localStorage.getItem(this.KEYS.userIsAdmin) === '1'
        };
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    clear() {
        Object.values(this.KEYS).forEach((key) => localStorage.removeItem(key));
    }
};
