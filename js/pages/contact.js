/**
 * Contact form (#/contact, auth-only - see Router.routes in app.js).
 * Category dropdown + message + up to CONFIG.CONTACT_MAX_FILES attachments
 * (CONFIG.CONTACT_MAX_FILE_SIZE each), submitted to POST /contact.
 */
const ContactPage = {
    state: {
        files: []
    },

    async render(container) {
        container.innerHTML = `
            <div class="page">
                <div class="page-header">
                    <div>
                        <h1>${escapeHtml(t('contact.title'))}</h1>
                        <div class="page-header__meta">${escapeHtml(t('contact.subtitle'))}</div>
                    </div>
                </div>
                <div class="card">
                    <div id="contact-alert"></div>
                    <form id="contact-form" novalidate>
                        <div class="field">
                            <label for="contact-category">${escapeHtml(t('contact.categoryLabel'))}</label>
                            <select id="contact-category">
                                <option value="general">${escapeHtml(t('contact.category.general'))}</option>
                                <option value="privacy_gdpr">${escapeHtml(t('contact.category.privacyGdpr'))}</option>
                                <option value="bug">${escapeHtml(t('contact.category.bug'))}</option>
                                <option value="feature_request">${escapeHtml(t('contact.category.featureRequest'))}</option>
                            </select>
                        </div>
                        <div class="field">
                            <label for="contact-message">${escapeHtml(t('contact.messageLabel'))}</label>
                            <textarea id="contact-message" rows="6"></textarea>
                        </div>
                        <div class="field">
                            <label for="contact-attachments">${escapeHtml(t('contact.attachmentsLabel'))}</label>
                            <input type="file" id="contact-attachments" accept="image/jpeg,image/png,image/webp,application/pdf" multiple>
                            <small>${escapeHtml(t('contact.attachmentsHint'))}</small>
                        </div>
                        <ul id="contact-file-list" style="list-style:none; padding:0; margin:0 0 var(--space-3);"></ul>
                        <p class="text-muted" style="font-size: var(--font-size-sm); margin: 0 0 var(--space-3);">${escapeHtml(t('contact.retentionHint'))}</p>
                        <button class="btn btn-primary" type="submit" id="contact-submit">${escapeHtml(t('contact.submit'))}</button>
                    </form>
                </div>
            </div>`;

        document.getElementById('contact-attachments').addEventListener('change', (e) => this.handleFilesChosen(e.target.files));
        document.getElementById('contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    },

    handleFilesChosen(fileList) {
        const alertBox = document.getElementById('contact-alert');
        const error = Validate.contactFiles(Array.from(fileList));

        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            document.getElementById('contact-attachments').value = '';
            this.state.files = [];
            this.renderFileList();
            return;
        }

        alertBox.innerHTML = '';
        this.state.files = Array.from(fileList);
        this.renderFileList();
    },

    renderFileList() {
        const list = document.getElementById('contact-file-list');
        list.innerHTML = this.state.files.map((file, i) => `
            <li style="display:flex; align-items:center; justify-content:space-between; gap: var(--space-2); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border);">
                <span>${escapeHtml(file.name)} <span class="text-muted">(${Math.ceil(file.size / 1024)} KB)</span></span>
                <button type="button" class="btn btn-ghost btn-sm" data-index="${i}">${escapeHtml(t('common.remove'))}</button>
            </li>`).join('');

        list.querySelectorAll('button[data-index]').forEach((btn) => {
            btn.addEventListener('click', () => this.removeFile(Number(btn.dataset.index)));
        });
    },

    removeFile(index) {
        this.state.files.splice(index, 1);

        // Rebuild the <input>'s FileList so it stays in sync with state -
        // a native FileList can't be edited in place.
        const dataTransfer = new DataTransfer();
        this.state.files.forEach((file) => dataTransfer.items.add(file));
        document.getElementById('contact-attachments').files = dataTransfer.files;

        this.renderFileList();
    },

    async handleSubmit() {
        const alertBox = document.getElementById('contact-alert');
        const category = document.getElementById('contact-category').value;
        const message = document.getElementById('contact-message').value.trim();

        const error = Validate.contactMessage(message) || Validate.contactFiles(this.state.files);
        if (error) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(error)}</div>`;
            return;
        }

        const submitBtn = document.getElementById('contact-submit');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> ${escapeHtml(t('contact.submitting'))}`;

        const formData = new FormData();
        formData.append('category', category);
        formData.append('message', message);
        this.state.files.forEach((file) => formData.append('attachments[]', file));

        const response = await apiUpload('/contact', formData, 'POST');

        submitBtn.disabled = false;
        submitBtn.textContent = t('contact.submit');

        if (!response.success) {
            alertBox.innerHTML = `<div class="alert alert-error">${escapeHtml(response.code ? t.error(response.code) : (response.error || t('contact.submitFailed')))}</div>`;
            return;
        }

        alertBox.innerHTML = '';
        document.getElementById('contact-form').reset();
        this.state.files = [];
        this.renderFileList();
        showToast(t('contact.success'), 'success');
    }
};
