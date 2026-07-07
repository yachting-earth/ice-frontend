/**
 * Runtime configuration.
 *
 * No build step, so the API base is picked at load time based on where the
 * page itself is being served from - localhost/127.0.0.1 talks to the local
 * Docker backend (port 8080), anything else talks to the production API.
 */
const CONFIG = (() => {
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    return {
        API_BASE_URL: isLocal ? 'http://localhost:8080/api' : 'https://manjo.se/api',
        GRACE_PERIOD_OPTIONS: [
            { seconds: 3600, label: '1 timme' },
            { seconds: 14400, label: '4 timmar' },
            { seconds: 43200, label: '12 timmar' },
            { seconds: 86400, label: '24 timmar' },
            { seconds: 172800, label: '48 timmar' }
        ],
        MAX_SNOOZE_MINUTES: 72,
        SNOOZE_PRESETS: [15, 30, 60, 72]
    };
})();
