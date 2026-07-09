/**
 * Leaflet map helpers: parsing route data and rendering it.
 */

/** Parse a Windy route-planner URL into [[lat, lon], ...] pairs (client-side preview only). */
function parseWindyUrl(url) {
    const match = url.match(/route-planner\/(?:[a-z]+\/)?([\d.,;-]+)/i);
    if (!match) return null;

    const coords = match[1].split(';').map((pair) => {
        const [lat, lon] = pair.split(',').map(Number);
        return [lat, lon];
    });

    if (coords.length < 2 || coords.some(([lat, lon]) => Number.isNaN(lat) || Number.isNaN(lon))) {
        return null;
    }

    return coords;
}

/** Parse a MySQL "LINESTRING(lon lat, lon lat, ...)" WKT string (as returned by the API) into [[lat, lon], ...]. */
function parseWktLineString(wkt) {
    if (!wkt) return [];
    const match = wkt.match(/LINESTRING\(([^)]+)\)/i);
    if (!match) return [];

    return match[1].split(',').map((pair) => {
        const [lon, lat] = pair.trim().split(/\s+/).map(Number);
        return [lat, lon];
    });
}

/**
 * Render one or more routes on a Leaflet map inside the given container element.
 * routes: [{ coordinates: [[lat, lon], ...], color, label }]
 */
function renderRouteMap(containerEl, routes) {
    if (typeof L === 'undefined' || !containerEl) return null;

    const map = L.map(containerEl).setView([56, 12], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    const allBounds = [];

    routes.forEach((route) => {
        if (!route.coordinates || route.coordinates.length < 2) return;

        const polyline = L.polyline(route.coordinates, { color: route.color || '#1e88a8', weight: 4 }).addTo(map);
        if (route.label) {
            // Set the label via textContent, not as a string: Leaflet inserts a
            // string tooltip as innerHTML, so a user-supplied label (e.g. a
            // route's free-text "reason") would be a stored-XSS vector. Passing
            // an HTMLElement makes Leaflet use it as-is instead.
            const tooltipLabel = document.createElement('span');
            tooltipLabel.textContent = route.label;
            polyline.bindTooltip(tooltipLabel);
        }

        L.circleMarker(route.coordinates[0], { radius: 7, color: '#1a7f4e', fillColor: '#1a7f4e', fillOpacity: 1 })
            .addTo(map)
            .bindTooltip('Avgång');
        L.circleMarker(route.coordinates[route.coordinates.length - 1], { radius: 7, color: '#b3261e', fillColor: '#b3261e', fillOpacity: 1 })
            .addTo(map)
            .bindTooltip('Ankomst');

        allBounds.push(...route.coordinates);
    });

    if (allBounds.length) {
        map.fitBounds(allBounds, { padding: [24, 24] });
    }

    return map;
}
