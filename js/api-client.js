/**
 * Fetch wrapper for the Yachting Earth API.
 *
 * Always resolves (never throws on API-level errors) - callers check
 * `response.success` and read `response.error` / `response.code`.
 * Network failures are normalized into the same response shape.
 */
async function apiRequest(endpoint, options = {}) {
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
            error: 'Kunde inte nå servern. Kontrollera din anslutning.',
            code: 'NETWORK_ERROR',
            status: 0
        };
    }

    // /auth/, /sar/ and delete-account return 401 for bad credentials as
    // part of their normal flow - only treat 401 as "session expired" elsewhere
    if (response.status === 401 && !endpoint.startsWith('/auth/') && !endpoint.startsWith('/sar/')
        && endpoint !== '/user/delete-account') {
        Auth.clear();
        if (!location.hash.startsWith('#/login')) {
            location.hash = '#/login';
        }
    }

    try {
        return await response.json();
    } catch (err) {
        return {
            success: false,
            error: 'Ogiltigt svar från servern.',
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
async function apiUpload(endpoint, formData, method = 'POST') {
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
            error: 'Kunde inte nå servern. Kontrollera din anslutning.',
            code: 'NETWORK_ERROR',
            status: 0
        };
    }

    try {
        return await response.json();
    } catch (err) {
        return {
            success: false,
            error: 'Ogiltigt svar från servern.',
            code: 'PARSE_ERROR',
            status: response.status
        };
    }
}
