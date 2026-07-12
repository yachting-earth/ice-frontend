/**
 * Public marketing landing page, served at the SPA's root ("#/") for
 * logged-out visitors. Renders its own nav/hero/footer chrome instead of
 * the app topbar (Router treats this route as `noTopbar`).
 */
const LandingPage = {
    async render(container) {
        const cards = t('landing.prepared.cards');
        const steps = t('landing.howItWorks.steps');
        const afterFork = t('landing.howItWorks.afterFork');
        const compareRows = t('landing.compare.rows');
        const features = t('landing.features.items');
        const lifecycle = t('landing.privacy.lifecycle');
        const insteadItems = t('landing.worst.insteadItems');
        const haveItems = t('landing.worst.haveItems');
        const readyItems = t('landing.worst.readyItems');
        const badges = t('landing.hero.badges');

        container.innerHTML = `
            <div class="landing-page">
              <a class="skip-link" href="#landing-main" data-scroll="true">${escapeHtml(t('landing.skipLink'))}</a>

              <header class="site-nav" id="site-nav">
                <div class="site-nav__inner">
                  <a class="site-nav__brand" href="#landing-main" data-scroll="true">
                    <img src="img/yachting.png" width="22" height="22" alt="" aria-hidden="true">
                    <span>${escapeHtml(t('app.brand'))}</span>
                  </a>

                  <button class="site-nav__toggle" id="landing-nav-toggle" aria-expanded="false" aria-controls="landing-nav-links" aria-label="${escapeHtml(t('app.toggleNav'))}">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                  </button>

                  <nav class="site-nav__links" id="landing-nav-links" aria-label="Primary">
                    <a href="#landing-prepared" data-scroll="true">${escapeHtml(t('landing.nav.prepared'))}</a>
                    <a href="#landing-how-it-works" data-scroll="true">${escapeHtml(t('landing.nav.howItWorks'))}</a>
                    <a href="#landing-different" data-scroll="true">${escapeHtml(t('landing.nav.different'))}</a>
                    <a href="#landing-privacy" data-scroll="true">${escapeHtml(t('landing.nav.privacy'))}</a>
                    <a class="site-nav__cta site-nav__cta--ghost" href="#/login">${escapeHtml(t('landing.nav.login'))}</a>
                    <a class="site-nav__cta" href="#/register">${escapeHtml(t('landing.nav.cta'))}</a>
                    ${renderLangSelector()}
                  </nav>
                </div>
              </header>

              <main id="landing-main">

                <section class="hero" aria-labelledby="landing-hero-heading">
                  <div class="hero__art" aria-hidden="true">
                    <div class="hero__scrim" aria-hidden="true"></div>
                  </div>
                  <div class="hero__content">
                    <h1 id="landing-hero-heading">${t('landing.hero.heading')}</h1>
                    <p class="hero__lead">${escapeHtml(t('landing.hero.lead'))}</p>
                    <div class="hero__actions">
                      <a class="btn btn--primary btn--lg" href="#/register">${escapeHtml(t('landing.hero.ctaPrimary'))}</a>
                      <a class="btn btn--ghost btn--lg" href="#landing-how-it-works" data-scroll="true">${escapeHtml(t('landing.hero.ctaSecondary'))}</a>
                    </div>
                    <ul class="hero__badges">
                      ${badges.map((badge) => `<li><i data-lucide="check" aria-hidden="true"></i> ${escapeHtml(badge)}</li>`).join('')}
                    </ul>
                  </div>
                </section>

                <section class="section section--tight" aria-labelledby="landing-notice-heading">
                  <div class="notice reveal">
                    <div class="notice__icon"><i data-lucide="info" aria-hidden="true"></i></div>
                    <div>
                      <h2 id="landing-notice-heading">${escapeHtml(t('landing.notice.heading'))}</h2>
                      <p>${escapeHtml(t('landing.notice.p1'))}</p>
                      <p>${escapeHtml(t('landing.notice.p2'))}</p>
                    </div>
                  </div>
                </section>

                <section class="section" id="landing-prepared" aria-labelledby="landing-prepared-heading">
                  <div class="section__head reveal">
                    <h2 id="landing-prepared-heading">${escapeHtml(t('landing.prepared.heading'))}</h2>
                    <p class="section__lead">${escapeHtml(t('landing.prepared.lead'))}</p>
                  </div>
                  <div class="prep-grid">
                    ${cards.map((card) => `
                      <article class="prep-card reveal">
                        <div class="prep-card__icon"><i data-lucide="${escapeHtml(card.icon)}" aria-hidden="true"></i></div>
                        <h3>${escapeHtml(card.title)}</h3>
                        <ul>${card.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                      </article>`).join('')}
                  </div>
                </section>

                <section class="section section--muted" id="landing-how-it-works" aria-labelledby="landing-how-heading">
                  <div class="section__head reveal">
                    <h2 id="landing-how-heading">${escapeHtml(t('landing.howItWorks.heading'))}</h2>
                  </div>
                  <ol class="timeline">
                    ${steps.map((step) => `<li class="timeline__item reveal"><span class="timeline__dot"></span><div><h3>${escapeHtml(step)}</h3></div></li>`).join('')}
                    <li class="timeline__item timeline__item--fork reveal">
                      <span class="timeline__dot timeline__dot--fork"></span>
                      <div>
                        <div class="timeline__fork">
                          <div class="timeline__branch">
                            <h3>${escapeHtml(t('landing.howItWorks.fork.arriveTitle'))}</h3>
                            <p>${escapeHtml(t('landing.howItWorks.fork.arriveText'))}</p>
                          </div>
                          <div class="timeline__branch">
                            <h3>${escapeHtml(t('landing.howItWorks.fork.graceTitle'))}</h3>
                            <p>${escapeHtml(t('landing.howItWorks.fork.graceText'))}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                    ${afterFork.map((step) => `<li class="timeline__item reveal"><span class="timeline__dot"></span><div><h3>${escapeHtml(step)}</h3></div></li>`).join('')}
                  </ol>
                </section>

                <section class="section" id="landing-different" aria-labelledby="landing-different-heading">
                  <div class="section__head reveal">
                    <h2 id="landing-different-heading">${escapeHtml(t('landing.compare.heading'))}</h2>
                  </div>
                  <div class="compare reveal" role="table" aria-label="${escapeHtml(t('landing.compare.traditionalLabel'))} vs ${escapeHtml(t('landing.compare.yachtingLabel'))}">
                    <div class="compare__row compare__row--head" role="row">
                      <div role="columnheader"><i>${escapeHtml(t('landing.compare.traditionalLabel'))}</i></div>
                      <div class="compare__vs" role="presentation" aria-hidden="true">vs</div>
                      <div role="columnheader">${escapeHtml(t('landing.compare.yachtingLabel'))}</div>
                    </div>
                    ${compareRows.map((row) => `
                      <div class="compare__row" role="row">
                        <div role="cell"><i>${escapeHtml(row.traditional)}</i></div><div class="compare__vs" aria-hidden="true"></div><div role="cell">${escapeHtml(row.yachting)}</div>
                      </div>`).join('')}
                  </div>
                </section>

                <section class="section section--muted" aria-labelledby="landing-features-heading">
                  <div class="section__head reveal">
                    <h2 id="landing-features-heading">${escapeHtml(t('landing.features.heading'))}</h2>
                  </div>
                  <div class="feature-grid">
                    ${features.map((item) => `
                      <article class="feature-card reveal">
                        <div class="feature-card__icon"><i data-lucide="${escapeHtml(item.icon)}" aria-hidden="true"></i></div>
                        <h3>${escapeHtml(item.title)}</h3>
                        <p>${escapeHtml(item.description)}</p>
                      </article>`).join('')}
                  </div>
                </section>

                <section class="section" id="landing-privacy" aria-labelledby="landing-privacy-heading">
                  <div class="section__head reveal">
                    <h2 id="landing-privacy-heading">${escapeHtml(t('landing.privacy.heading'))}</h2>
                    <p class="section__lead">${escapeHtml(t('landing.privacy.lead'))}</p>
                  </div>
                  <ol class="lifecycle reveal">
                    ${lifecycle.map((step) => `<li><i data-lucide="${escapeHtml(step.icon)}" aria-hidden="true"></i><span>${escapeHtml(step.label)}</span></li>`).join('')}
                  </ol>
                </section>

                <section class="section section--muted" aria-labelledby="landing-map-heading">
                  <div class="section__head reveal">
                    <h2 id="landing-map-heading">${escapeHtml(t('landing.mapDemo.heading'))}</h2>
                    <p class="section__lead">${escapeHtml(t('landing.mapDemo.lead'))}</p>
                  </div>
                  <div class="map-demo reveal">
                    <div id="landing-map" class="map-demo__canvas" role="img" aria-label="${escapeHtml(t('landing.mapDemo.ariaLabel'))}"></div>
                    <p class="map-demo__note">${escapeHtml(t('landing.mapDemo.note'))}</p>
                  </div>
                </section>

                <section class="section" aria-labelledby="landing-worst-heading">
                  <div class="section__head reveal">
                    <h2 id="landing-worst-heading">${escapeHtml(t('landing.worst.heading'))}</h2>
                  </div>
                  <div class="worst-grid">
                    <div class="worst-col reveal">
                      <div class="worst-col__icon"><i data-lucide="search" aria-hidden="true"></i></div>
                      <h3>${escapeHtml(t('landing.worst.insteadTitle'))}</h3>
                      <ul>${insteadItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                    </div>
                    <div class="worst-col__arrow reveal" aria-hidden="true">
                      <i data-lucide="arrow-right" class="worst-col__arrow-icon worst-col__arrow-icon--horizontal"></i>
                      <i data-lucide="arrow-down" class="worst-col__arrow-icon worst-col__arrow-icon--vertical"></i>
                    </div>
                    <div class="worst-col reveal">
                      <div class="worst-col__icon"><i data-lucide="folder-check" aria-hidden="true"></i></div>
                      <h3>${escapeHtml(t('landing.worst.haveTitle'))}</h3>
                      <ul>${haveItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                    </div>
                    <div class="worst-col__arrow reveal" aria-hidden="true">
                      <i data-lucide="arrow-right" class="worst-col__arrow-icon worst-col__arrow-icon--horizontal"></i>
                      <i data-lucide="arrow-down" class="worst-col__arrow-icon worst-col__arrow-icon--vertical"></i>
                    </div>
                    <div class="worst-col reveal">
                      <div class="worst-col__icon"><i data-lucide="send" aria-hidden="true"></i></div>
                      <h3>${escapeHtml(t('landing.worst.readyTitle'))}</h3>
                      <ul>${readyItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                      <p class="worst-col__note">${escapeHtml(t('landing.worst.readyNote'))}</p>
                    </div>
                  </div>
                </section>

                <section class="section final-cta" aria-labelledby="landing-final-cta-heading">
                  <div class="reveal">
                    <h2 id="landing-final-cta-heading">${escapeHtml(t('landing.finalCta.heading'))}</h2>
                    <p>${escapeHtml(t('landing.finalCta.lead'))}</p>
                    <a class="btn btn--primary btn--lg" href="#/register">${escapeHtml(t('landing.finalCta.cta'))}</a>
                  </div>
                </section>

              </main>

              <footer class="site-footer">
                <div class="site-footer__inner">
                  <span class="site-footer__brand">${escapeHtml(t('app.brand'))}</span>
                  <nav aria-label="Footer">
                    <a href="#/about">${escapeHtml(t('landing.footer.links.about'))}</a>
                    <a href="#/privacy">${escapeHtml(t('landing.footer.links.privacy'))}</a>
                    <a href="#/privacy">${escapeHtml(t('landing.footer.links.gdpr'))}</a>
                    <a href="#/contact">${escapeHtml(t('landing.footer.links.contact'))}</a>
                    <a href="#/terms">${escapeHtml(t('landing.footer.links.terms'))}</a>
                    <a href="#/faq">${escapeHtml(t('landing.footer.links.faq'))}</a>
                  </nav>
                  <p class="site-footer__disclaimer">${escapeHtml(t('landing.footer.disclaimer'))}</p>
                </div>
              </footer>
            </div>`;

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }

        this.setupNavToggle();
        this.setupScrollLinks();
        this.setupComingSoonLinks();
        this.setupScrollReveal();
        this.renderMapDemo();
        setupLangSelector();
    },

    setupNavToggle() {
        const toggle = document.getElementById('landing-nav-toggle');
        const links = document.getElementById('landing-nav-links');
        if (!toggle || !links) return;

        toggle.addEventListener('click', () => {
            const isOpen = links.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });
    },

    // In-page section anchors must never touch location.hash - this page
    // lives inside the hash router, and a plain "#section" hash change
    // would be treated as an unmatched route and bounce the visitor away.
    setupScrollLinks() {
        document.querySelectorAll('[data-scroll="true"]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const target = document.getElementById(link.getAttribute('href').slice(1));
                if (target) target.scrollIntoView({ behavior: 'smooth' });
                const links = document.getElementById('landing-nav-links');
                const toggle = document.getElementById('landing-nav-toggle');
                if (links) links.classList.remove('is-open');
                if (toggle) toggle.setAttribute('aria-expanded', 'false');
            });
        });
    },

    setupComingSoonLinks() {
        document.querySelectorAll('[data-soon="true"]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                showToast(t('landing.footer.comingSoon', { page: link.textContent.trim() }));
            });
        });
    },

    setupScrollReveal() {
        const targets = document.querySelectorAll('.landing-page .reveal');
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
    },

    // Static demo routes so the map section shows "multiple routes"
    // concretely without hitting the API. Leaflet is already loaded
    // globally by index.html for the rest of the app.
    renderMapDemo() {
        const container = document.getElementById('landing-map');
        if (!container || typeof L === 'undefined') return;

        const labels = t('landing.mapDemo.routes');
        const SAMPLE_ROUTES = [
            { color: '#1e88a8', coordinates: [[59.3251, 18.0711], [59.3106, 18.3153], [59.2872, 18.5561], [59.2894, 18.9134]] },
            { color: '#1a7f4e', coordinates: [[59.2894, 18.9134], [59.0453, 18.7231], [58.7442, 18.0578], [58.7396, 17.8659]] },
            { color: '#0b4f6c', coordinates: [[59.3251, 18.0711], [59.4664, 18.7802], [59.7833, 19.4667], [60.1004, 19.9348]] }
        ];

        const map = L.map(container, { scrollWheelZoom: false }).setView([59.2, 18.5], 7);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(map);

        const bounds = [];
        SAMPLE_ROUTES.forEach((route, i) => {
            L.polyline(route.coordinates, { color: route.color, weight: 4 }).addTo(map);

            const tooltipLabel = document.createElement('span');
            tooltipLabel.textContent = labels[i] || '';
            L.circleMarker(route.coordinates[0], { radius: 6, color: route.color, fillColor: route.color, fillOpacity: 1 })
                .addTo(map)
                .bindTooltip(tooltipLabel);

            bounds.push(...route.coordinates);
        });

        if (bounds.length) {
            map.fitBounds(bounds, { padding: [28, 28] });
        }
    }
};
