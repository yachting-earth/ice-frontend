/**
 * Datetime helpers.
 *
 * The backend stores and expects everything in UTC (APP_TIMEZONE=UTC) and
 * validates datetimes as strict ISO 8601 (YYYY-MM-DDTHH:MM:SSZ). To avoid
 * silent local-timezone bugs, every datetime input in the UI is treated as
 * a UTC value directly (labeled "(UTC)" next to the field) rather than
 * converted from the browser's local timezone.
 */

function formatDateTime(isoString, { withSeconds = false } = {}) {
    if (!isoString) return '–';
    const normalized = isoString.includes('T') ? isoString : isoString.replace(' ', 'T');
    const withZone = /Z|[+-]\d\d:\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
    const date = new Date(withZone);
    if (isNaN(date.getTime())) return isoString;

    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} `
        + `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
        + `${withSeconds ? ':' + pad(date.getUTCSeconds()) : ''} UTC`;
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
