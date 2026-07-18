// Access tokens are short-lived (15 min - see issue #93); a single
// in-flight refresh is shared across concurrent 401s so a burst of
// requests doesn't trigger a burst of /auth/refresh calls (which would
// race the one-time-use refresh token rotation against itself).
let _refreshPromise = null;

async function _refreshAccessToken() {
    if (_refreshPromise) {
        return _refreshPromise;
    }

    const refreshToken = Auth.getRefreshToken();
    if (!refreshToken) {
        return false;
    }

    _refreshPromise = (async () => {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken })
            });
            const result = await response.json();
            if (result.success) {
                Auth.setTokens(result.data.auth_token, result.data.refresh_token);
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    })();

    try {
        return await _refreshPromise;
    } finally {
        _refreshPromise = null;
    }
}

// Endpoints where a 401 is a normal part of the flow (bad credentials,
// invalid/expired opaque token) rather than "the session expired" -
// these must never trigger a silent-refresh attempt or a forced redirect.
function _isSessionScoped(endpoint) {
    return !endpoint.startsWith('/auth/') && !endpoint.startsWith('/sar/')
        && endpoint !== '/user/delete-account' && endpoint !== '/user/password';
}

function _handleExpiredSession() {
    Auth.clear();
    if (!location.hash.startsWith('#/login')) {
        // Surface *why* the user landed back on the login page - this used
        // to be a silent redirect, which is confusing on its own and was
        // especially so for pre-#93 sessions with no refresh_token at all
        // (see issue #99): the first API call after such a deploy fails
        // with no explanation otherwise.
        showToast(t.error('AUTH_REQUIRED'), 'info');
        location.hash = '#/login';
    }
}

/**
 * Fetch wrapper for the Yachting Earth API.
 *
 * Always resolves (never throws on API-level errors) - callers check
 * `response.success` and read `response.error` / `response.code`.
 * Network failures are normalized into the same response shape. A 401 on
 * a session-scoped endpoint first tries a silent token refresh (once) and
 * retries the request before giving up and clearing the session.
 */
async function apiRequest(endpoint, options = {}, _isRetry = false) {
    const token = Auth.getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    } catch (err) {
        return {
            success: false,
            error: 'Could not reach the server. Check your connection.',
            code: 'NETWORK_ERROR',
            status: 0
        };
    }

    if (response.status === 401 && _isSessionScoped(endpoint)) {
        if (!_isRetry && await _refreshAccessToken()) {
            return apiRequest(endpoint, options, true);
        }
        _handleExpiredSession();
    }

    try {
        return await response.json();
    } catch (err) {
        return {
            success: false,
            error: 'Invalid response from the server.',
            code: 'PARSE_ERROR',
            status: response.status
        };
    }
}

/**
 * Multipart file upload variant of apiRequest. Sends FormData and lets
 * the browser set the Content-Type (with boundary) itself - apiRequest's
 * hardcoded application/json would break multipart parsing server-side.
 */
async function apiUpload(endpoint, formData, method = 'POST', _isRetry = false) {
    const token = Auth.getToken();
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, { method, headers, body: formData });
    } catch (err) {
        return {
            success: false,
            error: 'Could not reach the server. Check your connection.',
            code: 'NETWORK_ERROR',
            status: 0
        };
    }

    if (response.status === 401 && _isSessionScoped(endpoint)) {
        if (!_isRetry && await _refreshAccessToken()) {
            return apiUpload(endpoint, formData, method, true);
        }
        _handleExpiredSession();
    }

    try {
        return await response.json();
    } catch (err) {
        return {
            success: false,
            error: 'Invalid response from the server.',
            code: 'PARSE_ERROR',
            status: response.status
        };
    }
}
