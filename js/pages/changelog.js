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

        // Group entries by date, preserving first-seen date order
        const entriesByDate = new Map();
        entries.forEach((entry) => {
            if (!entriesByDate.has(entry.date)) {
                entriesByDate.set(entry.date, []);
            }
            entriesByDate.get(entry.date).push(entry);
        });

        container.innerHTML = `
            ${renderPublicHeader()}
            <div class="page">
                <article class="blog-article">
                    <h1>${escapeHtml(t('changelog.title'))}</h1>
                    <div class="blog-article__body">
                        <p>${escapeHtml(t('changelog.intro'))}</p>
                        ${Array.from(entriesByDate.entries()).map(([date, dateEntries]) => {
                            const versions = dateEntries.map((e) => e.version).join(', ');

                            return `
                                <h2>${escapeHtml(versions)} <small>${escapeHtml(date)}</small></h2>
                                ${CHANGELOG_SECTION_KEYS.map(({ key, labelKey }) => {
                                    const allItems = [];
                                    dateEntries.forEach((entry) => {
                                        const items = entry.sections[key];
                                        if (items && items.length) {
                                            allItems.push(...items);
                                        }
                                    });

                                    if (!allItems.length) return '';
                                    return `
                                        <h3>${escapeHtml(t(labelKey))}</h3>
                                        <ul>${allItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
                                    `;
                                }).join('')}
                            `;
                        }).join('')}
                    </div>
                </article>
            </div>
            ${renderPublicFooter()}`;

        setupPublicHeader();
    }
};
