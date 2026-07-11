/**
 * Lazy-loaded Leaflet demo map: renders a handful of static sample routes so the
 * landing page can show "multiple routes" concretely without hitting the API or
 * blocking first paint on the Leaflet bundle.
 */
(function () {
    'use strict';

    const SAMPLE_ROUTES = [
        {
            label: 'Stockholm → Sandhamn',
            color: '#1e88a8',
            coordinates: [
                [59.3251, 18.0711],
                [59.3106, 18.3153],
                [59.2872, 18.5561],
                [59.2894, 18.9134]
            ]
        },
        {
            label: 'Sandhamn → Landsort',
            color: '#1a7f4e',
            coordinates: [
                [59.2894, 18.9134],
                [59.0453, 18.7231],
                [58.7442, 18.0578],
                [58.7396, 17.8659]
            ]
        },
        {
            label: 'Stockholm → Åland (alternative)',
            color: '#0b4f6c',
            coordinates: [
                [59.3251, 18.0711],
                [59.4664, 18.7802],
                [59.7833, 19.4667],
                [60.1004, 19.9348]
            ]
        }
    ];

    let leafletLoadStarted = false;

    function loadLeaflet() {
        if (leafletLoadStarted) return;
        leafletLoadStarted = true;

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.defer = true;
        script.onload = renderDemoMap;
        document.body.appendChild(script);
    }

    function renderDemoMap() {
        const container = document.getElementById('landing-map');
        if (!container || typeof L === 'undefined') return;

        const map = L.map(container, { scrollWheelZoom: false }).setView([59.2, 18.5], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(map);

        const bounds = [];
        SAMPLE_ROUTES.forEach((route) => {
            L.polyline(route.coordinates, { color: route.color, weight: 4 }).addTo(map);

            const tooltipLabel = document.createElement('span');
            tooltipLabel.textContent = route.label;
            L.circleMarker(route.coordinates[0], { radius: 6, color: route.color, fillColor: route.color, fillOpacity: 1 })
                .addTo(map)
                .bindTooltip(tooltipLabel);

            bounds.push(...route.coordinates);
        });

        if (bounds.length) {
            map.fitBounds(bounds, { padding: [28, 28] });
        }
    }

    function init() {
        const container = document.getElementById('landing-map');
        if (!container) return;

        if (!('IntersectionObserver' in window)) {
            loadLeaflet();
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    loadLeaflet();
                    observer.disconnect();
                }
            });
        }, { rootMargin: '200px' });

        observer.observe(container);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
