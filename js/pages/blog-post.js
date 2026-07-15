/**
 * Public blog post detail page (#/blog/:slug).
 *
 * content_html is produced server-side (BlogHandler::detail ->
 * MarkdownParser::toHtml) from an already-escaped-then-selectively-tagged
 * pipeline, so it's safe to insert directly rather than via escapeHtml().
 */
const BlogPostPage = {
    async render(container, params) {
        container.innerHTML = `
            ${renderPublicHeader()}
            <div class="page">
                <a class="btn btn-secondary btn-sm" href="#/blog">${escapeHtml(t('blog.backToList'))}</a>
                <div id="blog-post-container"><div class="loading-state"><span class="spinner"></span> ${escapeHtml(t('blog.loading'))}</div></div>
            </div>
            ${renderPublicFooter()}`;

        setupPublicHeader();
        await this.loadPost(container, params.slug);
    },

    async loadPost(container, slug) {
        const postContainer = container.querySelector('#blog-post-container');
        const lang = I18n._lang || I18n.getLang();

        const response = await apiRequest(`/blog/${encodeURIComponent(slug)}?lang=${encodeURIComponent(lang)}`);

        if (!response.success) {
            const message = response.code === 'NOT_FOUND'
                ? t('blog.notFound')
                : (response.code ? t.error(response.code) : (response.error || t('blog.loadFailed')));
            postContainer.innerHTML = `<div class="alert alert-error">${escapeHtml(message)}</div>`;
            return;
        }

        const post = response.data;
        const metaParts = [post.date];
        if (post.author) metaParts.push(t('blog.byAuthor', { author: post.author }));
        if (post.category) metaParts.push(post.category);

        const tags = (post.tags || []).map((tag) =>
            `<span class="badge blog-tag">${escapeHtml(tag)}</span>`
        ).join('');

        postContainer.innerHTML = `
            <article class="blog-article">
                <h1>${escapeHtml(post.title)}</h1>
                <div class="page-header__meta">${metaParts.map((part) => escapeHtml(part)).join(' · ')}</div>
                ${tags ? `<div class="blog-tag-list">${tags}</div>` : ''}
                <div class="blog-article__body">${post.content_html}</div>
            </article>`;
    }
};
