/**
 * Datetime helpers.
 *
 * The backend stores and expects everything in UTC (APP_TIMEZONE=UTC) and
 * validates datetimes as strict ISO 8601 (YYYY-MM-DDTHH:MM:SSZ). Editable
 * datetime-local inputs (create-trip.js/trip-detail.js) are still treated as
 * UTC values directly (labeled "(UTC)" next to the field) to avoid silent
 * timezone bugs when a skipper schedules a trip - see toApiDatetime()/
 * toInputDatetime() below. Read-only display (formatDateTime()) instead
 * converts to the timezone the user picked on their profile page
 * (frontend/js/pages/profile.js), so the same underlying UTC value can be
 * shown in the browser's/skipper's local time without changing what's typed
 * or stored.
 */

/** Resolves the timezone display should use: the user's saved preference
 *  (mirrors the 'ye_lang' pattern - see login.js/profile.js), falling back
 *  to the browser's own timezone, then UTC. */
const TZ = {
    STORAGE_KEY: 'ye_tz',

    get() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) return stored;
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        } catch (err) {
            return 'UTC';
        }
    },

    set(timezone) {
        if (timezone) {
            localStorage.setItem(this.STORAGE_KEY, timezone);
        } else {
            localStorage.removeItem(this.STORAGE_KEY);
        }
    },

    /** All IANA timezone identifiers the browser knows about, for the
     *  profile page's <select>. Falls back to just the resolved local zone
     *  on browsers without Intl.supportedValuesOf(). */
    list() {
        try {
            return Intl.supportedValuesOf('timeZone');
        } catch (err) {
            return [this.get()];
        }
    }
};

function formatDateTime(isoString, { withSeconds = false } = {}) {
    if (!isoString) return '–';
    const normalized = isoString.includes('T') ? isoString : isoString.replace(' ', 'T');
    const withZone = /Z|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
    const date = new Date(withZone);
    if (isNaN(date.getTime())) return isoString;

    const timeZone = TZ.get();
    const pad = (n) => String(n).padStart(2, '0');

    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: withSeconds ? '2-digit' : undefined,
            hourCycle: 'h23'
        }).formatToParts(date).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});

        // Force the literal string "UTC" for the UTC zone rather than trusting
        // Intl's short timeZoneName: engines disagree on it (V8 renders "UTC",
        // WebKit/Safari renders "GMT" for the exact same zone/instant), which
        // is what made the same timestamp read as both "UTC" and "GMT"
        // depending on the visitor's browser. Every other zone still uses
        // Intl's own abbreviation (CET, GMT+2, etc.) since those are correct.
        const zoneName = timeZone === 'UTC'
            ? 'UTC'
            : new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
                .formatToParts(date).find((p) => p.type === 'timeZoneName').value;

        return `${parts.year}-${parts.month}-${parts.day} `
            + `${parts.hour}:${parts.minute}`
            + `${withSeconds ? ':' + parts.second : ''} ${zoneName}`;
    } catch (err) {
        // Unknown/unsupported timeZone (e.g. a stale saved value) - fall
        // back to the original UTC-only rendering rather than showing an error.
        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} `
            + `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
            + `${withSeconds ? ':' + pad(date.getUTCSeconds()) : ''} UTC`;
    }
}

/** Convert a <input type="datetime-local"> value ("YYYY-MM-DDTHH:MM") to the API's strict ISO format. */
function toApiDatetime(inputValue) {
    if (!inputValue) return null;
    return `${inputValue}:00Z`;
}

/** Convert an API ISO datetime back into a value usable by <input type="datetime-local">. */
function toInputDatetime(isoString) {
    if (!isoString) return '';
    const normalized = isoString.includes('T') ? isoString : isoString.replace(' ', 'T');
    return normalized.replace('Z', '').slice(0, 16);
}

function isFuture(isoString) {
    if (!isoString) return false;
    const normalized = isoString.includes('T') ? isoString : isoString.replace(' ', 'T');
    const withZone = /Z|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
    return new Date(withZone).getTime() > Date.now();
}

function normalizeIsoWithZone(isoString) {
    const normalized = isoString.includes('T') ? isoString : isoString.replace(' ', 'T');
    return /Z|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
}

/** Add a duration (in seconds) to an ISO datetime, returning a new API-format ISO string. */
function addDurationSeconds(isoString, seconds) {
    if (!isoString) return null;
    const date = new Date(normalizeIsoWithZone(isoString));
    if (isNaN(date.getTime())) return null;
    date.setUTCSeconds(date.getUTCSeconds() + seconds);
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Seconds between two ISO datetimes (arrival - departure). */
function durationSecondsBetween(departureIso, arrivalIso) {
    if (!departureIso || !arrivalIso) return 0;
    const departure = new Date(normalizeIsoWithZone(departureIso));
    const arrival = new Date(normalizeIsoWithZone(arrivalIso));
    if (isNaN(departure.getTime()) || isNaN(arrival.getTime())) return 0;
    return Math.round((arrival.getTime() - departure.getTime()) / 1000);
}

/** Convert duration parts (days/hours/minutes) into a total number of seconds. */
function durationToSeconds({ days = 0, hours = 0, minutes = 0 } = {}) {
    return (Number(days) || 0) * 86400 + (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60;
}

/** Convert a total number of seconds into {days, hours, minutes} parts (minute resolution). */
function secondsToDurationParts(totalSeconds) {
    const safe = Math.max(0, Math.floor(totalSeconds / 60)) * 60;
    return {
        days: Math.floor(safe / 86400),
        hours: Math.floor((safe % 86400) / 3600),
        minutes: Math.floor((safe % 3600) / 60)
    };
}
