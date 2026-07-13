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

/**
 * Parse a GPX file's contents into [[lat, lon], ...] pairs. Prefers route
 * points (<rte>/<rtept>) and falls back to track points (<trk>/<trkseg>/
 * <trkpt>, flattened across all segments). Returns null if no usable route
 * with at least 2 points is found.
 */
function parseGpxFile(xmlText) {
    let doc;
    try {
        doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    } catch (err) {
        return null;
    }
    if (!doc || doc.getElementsByTagNameNS('*', 'parsererror').length > 0) return null;

    const toCoords = (points) => Array.from(points)
        .map((pt) => [Number(pt.getAttribute('lat')), Number(pt.getAttribute('lon'))])
        .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180);

    let coords = toCoords(doc.getElementsByTagNameNS('*', 'rtept'));
    if (coords.length < 2) {
        coords = toCoords(doc.getElementsByTagNameNS('*', 'trkpt'));
    }

    return coords.length >= 2 ? coords : null;
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

/**
 * Render an interactive Leaflet map for manually drawing a route: click to
 * add a waypoint, drag a waypoint to move it, click a waypoint and confirm
 * the popup to delete it. Returns a controller object; call destroy() when
 * the containing UI is torn down.
 *
 * options: { initialCoordinates: [[lat, lon], ...], color, onChange(coords) }
 */
function renderRouteDrawMap(containerEl, options = {}) {
    if (typeof L === 'undefined' || !containerEl) return null;

    const { initialCoordinates = [], color = '#1e88a8', onChange = () => {} } = options;

    const map = L.map(containerEl).setView([56, 12], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    const coordinates = [];
    const markers = [];
    const polyline = L.polyline([], { color, weight: 4 }).addTo(map);

    function notify() {
        polyline.setLatLngs(coordinates);
        onChange(coordinates.map((c) => [...c]));
    }

    function removeWaypoint(marker) {
        const index = markers.indexOf(marker);
        if (index === -1) return;
        map.removeLayer(marker);
        markers.splice(index, 1);
        coordinates.splice(index, 1);
        notify();
    }

    function addWaypoint(lat, lon) {
        const marker = L.marker([lat, lon], { draggable: true }).addTo(map);
        markers.push(marker);
        coordinates.push([lat, lon]);

        marker.on('drag', () => {
            const ll = marker.getLatLng();
            coordinates[markers.indexOf(marker)] = [ll.lat, ll.lng];
            polyline.setLatLngs(coordinates);
        });
        marker.on('dragend', () => notify());

        const popupEl = document.createElement('button');
        popupEl.type = 'button';
        popupEl.className = 'btn btn-danger btn-sm';
        popupEl.textContent = 'Ta bort punkt';
        popupEl.addEventListener('click', () => {
            marker.closePopup();
            removeWaypoint(marker);
        });
        marker.bindPopup(popupEl);

        notify();
    }

    map.on('click', (e) => addWaypoint(e.latlng.lat, e.latlng.lng));

    initialCoordinates.forEach(([lat, lon]) => addWaypoint(lat, lon));

    if (coordinates.length) {
        map.fitBounds(coordinates, { padding: [24, 24] });
    }

    return {
        getCoordinates: () => coordinates.map((c) => [...c]),
        clear() {
            markers.splice(0).forEach((m) => map.removeLayer(m));
            coordinates.length = 0;
            notify();
        },
        destroy() {
            map.remove();
        }
    };
}
