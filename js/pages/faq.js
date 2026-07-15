/**
 * Public FAQ/help page (#/faq), linked from the landing page footer and the
 * topbar. Static content (accordion via native <details>/<summary>), no API
 * calls.
 */
const FaqPage = {
    async render(container) {
        const categories = t('faq.categories');

        container.innerHTML = `
            ${renderPublicHeader()}
            <div class="page">
                <article class="blog-article">
                    <h1>${escapeHtml(t('faq.title'))}</h1>
                    <div class="blog-article__body">
                        <p>${escapeHtml(t('faq.lead'))}</p>
                        ${categories.map((category) => `
                            <h2>${escapeHtml(category.heading)}</h2>
                            <div class="faq-list">
                                ${category.items.map((item) => `
                                    <details class="faq-item">
                                        <summary>${escapeHtml(item.q)}</summary>
                                        <p>${escapeHtml(item.a)}</p>
                                    </details>`).join('')}
                            </div>
                        `).join('')}
                    </div>
                </article>
            </div>
            ${renderPublicFooter()}`;

        setupPublicHeader();
    }
};
