/**
 * Carries the address book selection from the "Invite to trip" bulk action
 * (crew-address-book.js) across the hash-route navigation to #/trips/new, so
 * CreateTripPage can invite everyone once the new trip exists. Backed by
 * sessionStorage (not just an in-memory variable) so a reload mid-flow
 * doesn't silently drop the selection.
 */
const PendingCrewInvites = {
    KEY: 'ye_pending_crew_invites',

    set(entries) {
        sessionStorage.setItem(this.KEY, JSON.stringify(entries));
    },

    get() {
        try {
            return JSON.parse(sessionStorage.getItem(this.KEY) || '[]');
        } catch (err) {
            return [];
        }
    },

    remove(email) {
        this.set(this.get().filter((entry) => entry.email !== email));
    },

    clear() {
        sessionStorage.removeItem(this.KEY);
    }
};
