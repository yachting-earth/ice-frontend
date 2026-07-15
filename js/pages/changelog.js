/**
 * Public changelog page (#/changelog), linked from the version number in the
 * site footer. Entries are maintained by hand in frontend/i18n/{en,sv}.json
 * ("changelog.entries") alongside each dev -> main release promotion - see
 * "Versioning & releases" in CLAUDE.md.
 */
const ChangelogPage = {
    async render(container) {
        const entries = t('changelog.entries');

        container.innerHTML = `
            ${renderPublicHeader()}
            <div class="page">
                <article class="blog-article">
                    <h1>${escapeHtml(t('changelog.title'))}</h1>
                    <div class="blog-article__body">
                        <p>${escapeHtml(t('changelog.intro'))}</p>
                        ${entries.map((entry) => `
                            <h2>${escapeHtml(entry.version)} <small>${escapeHtml(entry.date)}</small></h2>
                            <ul>${entry.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                        `).join('')}
                    </div>
                </article>
            </div>
            ${renderPublicFooter()}`;

        setupPublicHeader();
    }
};
