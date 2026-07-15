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
        API_BASE_URL: isLocal ? 'http://localhost:8080' : 'https://ice-api.manjo.se',
        // Matches the latest git tag (see "Versioning & releases" in CLAUDE.md).
        // Bump by hand alongside a new changelog.js entry when main is tagged.
        APP_VERSION: 'v1.1.0',
        // Labels are looked up via t('common.gracePeriod.hNN') at render time
        // (formatGracePeriod() in i18n.js) rather than stored here, since
        // config.js loads before the active language dictionary.
        GRACE_PERIOD_OPTIONS: [
            { seconds: 3600, hours: 1 },
            { seconds: 14400, hours: 4 },
            { seconds: 43200, hours: 12 },
            { seconds: 86400, hours: 24 },
            { seconds: 172800, hours: 48 }
        ],
        MAX_SNOOZE_MINUTES: 72,
        SNOOZE_PRESETS: [15, 30, 60, 72],
        // Mirrors backend/config/constants.php CONTACT_MAX_FILES/CONTACT_MAX_FILE_SIZE/CONTACT_ALLOWED_TYPES.
        CONTACT_MAX_FILES: 5,
        CONTACT_MAX_FILE_SIZE: 1 * 1024 * 1024,
        CONTACT_ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    };
})();
