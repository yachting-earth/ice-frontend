/**
 * Public "About us" page (#/about), linked from the landing page footer.
 * Static content, no API calls.
 */
const AboutPage = {
    async render(container) {
        const sections = t('about.sections');

        container.innerHTML = `
            <div class="page">
                <article class="blog-article">
                    <h1>${escapeHtml(t('about.title'))}</h1>
                    <div class="blog-article__body">
                        <p>${escapeHtml(t('about.intro'))}</p>
                        ${sections.map((section) => `
                            <h2>${escapeHtml(section.heading)}</h2>
                            ${section.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
                            ${section.list ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
                        `).join('')}
                        <h2>${escapeHtml(t('about.contact.heading'))}</h2>
                        <p>${escapeHtml(t('about.contact.body'))}</p>
                    </div>
                </article>
            </div>`;
    }
};
