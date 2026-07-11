/**
 * Public blog list page (#/blog).
 *
 * Posts are file-based on the backend (see BLOG_DIR / BlogHandler.php) -
 * this page just lists whatever the API returns for the current UI
 * language and links each one to #/blog/:slug.
 */
const BlogPage = {
    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('blog.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('blog.subtitle'))}</div>
                    </div>
                </div>
                <div id="blog-list-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('blog.loading'))}</div></div>
            </div>`;

        await this.loadPosts(container);
    },

    async loadPosts(container) {
        const listContainer = container.querySelector('#blog-list-container');
        const lang = I18n._lang || I18n.getLang();

        const response = await apiRequest(`/blog?lang=${encodeURIComponent(lang)}`);

        if (!response.success) {
            listContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('blog.loadFailed')))}</div>`;
            return;
        }

        const posts = response.data || [];
        if (posts.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <h3>${escapeHtml(t('blog.emptyTitle'))}</h3>
                    <p>${escapeHtml(t('blog.emptyBody'))}</p>
                </div>`;
            return;
        }

        listContainer.innerHTML = `<div class="trip-list">${posts.map((post) => this.renderPostCard(post)).join('')}</div>`;
    },

    renderPostCard(post) {
        const metaParts = [post.date];
        if (post.author) metaParts.push(t('blog.byAuthor', { author: post.author }));
        if (post.category) metaParts.push(post.category);

        const tags = (post.tags || []).map((tag) =>
            `<span class="badge blog-tag">${escapeHtml(tag)}</span>`
        ).join('');

        return `
            <div class="trip-card">
                <div class="stack" style="flex:1; gap: 0.35rem;">
                    <div class="trip-card__top">
                        <span class="trip-card__title">${escapeHtml(post.title)}</span>
                    </div>
                    <div class="trip-card__meta">
                        ${metaParts.map((part) => `<span>${escapeHtml(part)}</span>`).join('')}
                    </div>
                    ${tags ? `<div class="blog-tag-list">${tags}</div>` : ''}
                </div>
                <div class="trip-card__actions">
                    <a class="btn btn-secondary btn-sm" href="#/blog/${encodeURIComponent(post.slug)}">${escapeHtml(t('blog.readMore'))}</a>
                </div>
            </div>`;
    }
};
