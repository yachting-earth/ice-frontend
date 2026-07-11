/**
 * Public Terms of Service page (#/terms), linked from the landing page
 * footer's "Terms" link. Static content, no API calls.
 */
const TermsPage = {
    async render(container) {
        const sections = t('terms.sections');

        container.innerHTML = `
            <div class="page">
                <article class="blog-article">
                    <h1>${escapeHtml(t('terms.title'))}</h1>
                    <div class="page-header__meta">${escapeHtml(t('terms.lastUpdated'))}</div>
                    <div class="blog-article__body">
                        <p>${escapeHtml(t('terms.intro'))}</p>
                        ${sections.map((section) => `
                            <h2>${escapeHtml(section.heading)}</h2>
                            ${section.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
                            ${section.list ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
                        `).join('')}
                        <h2>${escapeHtml(t('terms.contact.heading'))}</h2>
                        <p>${escapeHtml(t('terms.contact.body'))}</p>
                    </div>
                </article>
            </div>`;
    }
};
