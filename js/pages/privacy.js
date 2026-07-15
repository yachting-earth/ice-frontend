/**
 * Public Privacy & GDPR page (#/privacy), linked from the landing page
 * footer's "Privacy" and "GDPR" links. Static content, no API calls.
 */
const PrivacyPage = {
    async render(container) {
        const sections = t('privacy.sections');

        container.innerHTML = `
            ${renderPublicHeader()}
            <div class="page">
                <article class="blog-article">
                    <h1>${escapeHtml(t('privacy.title'))}</h1>
                    <div class="page-header__meta">${escapeHtml(t('privacy.lastUpdated'))}</div>
                    <div class="blog-article__body">
                        <p>${escapeHtml(t('privacy.intro'))}</p>
                        ${sections.map((section) => `
                            <h2>${escapeHtml(section.heading)}</h2>
                            ${section.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
                            ${section.list ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
                        `).join('')}
                        <h2>${escapeHtml(t('privacy.contact.heading'))}</h2>
                        <p>${escapeHtml(t('privacy.contact.body'))}</p>
                    </div>
                </article>
            </div>
            ${renderPublicFooter()}`;

        setupPublicHeader();
    }
};
