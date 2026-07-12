/**
 * Public Contact page (#/contact), linked from the landing page footer's
 * "Contact" link. Static content, no API calls or contact form backend.
 */
const ContactPage = {
    async render(container) {
        container.innerHTML = `
            <div class="page">
                <article class="blog-article">
                    <h1>${escapeHtml(t('contact.title'))}</h1>
                    <div class="blog-article__body">
                        <p>${escapeHtml(t('contact.intro'))}</p>

                        <h2>${escapeHtml(t('contact.general.heading'))}</h2>
                        <p>${escapeHtml(t('contact.general.body'))}</p>
                        <p><a href="mailto:support@yachting.earth">support@yachting.earth</a></p>

                        <h2>${escapeHtml(t('contact.privacy.heading'))}</h2>
                        <p>${escapeHtml(t('contact.privacy.body'))}</p>
                        <p><a href="mailto:privacy@yachting.earth">privacy@yachting.earth</a></p>

                        <h2>${escapeHtml(t('contact.company.heading'))}</h2>
                        <p>${escapeHtml(t('contact.company.body'))}</p>
                    </div>
                </article>
            </div>`;
    }
};
