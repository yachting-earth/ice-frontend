/**
 * Yachting Earth landing page - core interactions.
 * Vanilla JS, no build step. Loaded with `defer`, so DOM is parsed by the time this runs.
 */
(function () {
    'use strict';

    function initIcons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function initNavToggle() {
        const toggle = document.getElementById('nav-toggle');
        const links = document.getElementById('site-nav-links');
        if (!toggle || !links) return;

        toggle.addEventListener('click', () => {
            const isOpen = links.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        links.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                links.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    function initScrollReveal() {
        const targets = document.querySelectorAll('.reveal');
        if (!targets.length) return;

        if (!('IntersectionObserver' in window)) {
            targets.forEach((el) => el.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        targets.forEach((el) => observer.observe(el));
    }

    let toastTimer = null;
    function showToast(message) {
        let toast = document.querySelector('.landing-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'landing-toast';
            toast.setAttribute('role', 'status');
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        requestAnimationFrame(() => toast.classList.add('is-visible'));
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
    }

    function initComingSoonLinks() {
        document.querySelectorAll('[data-soon]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                showToast(`${link.textContent.trim()} page coming soon`);
            });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        initIcons();
        initNavToggle();
        initScrollReveal();
        initComingSoonLinks();
    });
})();
