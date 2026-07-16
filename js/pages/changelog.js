/**
 * Public changelog page (#/changelog), linked from the version number in the
 * site footer. Entries are maintained by hand in frontend/i18n/{en,sv}.json
 * ("changelog.entries") alongside each dev -> main release promotion - see
 * "Versioning & releases" in CLAUDE.md.
 */
const CHANGELOG_SECTION_KEYS = [
    { key: 'new', labelKey: 'changelog.sectionNew' },
    { key: 'improved', labelKey: 'changelog.sectionImproved' },
    { key: 'fixed', labelKey: 'changelog.sectionFixed' }
];

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
                            ${CHANGELOG_SECTION_KEYS.map(({ key, labelKey }) => {
                                const items = entry.sections[key];
                                if (!items || !items.length) return '';
                                return `
                                    <h3>${escapeHtml(t(labelKey))}</h3>
                                    <ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                                `;
                            }).join('')}
                        `).join('')}
                    </div>
                </article>
            </div>
            ${renderPublicFooter()}`;

        setupPublicHeader();
    }
};
