/**
 * Shared Telegram account-linking widget (backend: TelegramHandler /
 * user/telegram/*). Used by profile.js (personal preferred_channel) and
 * ice-account.js (per ICE-contact-row preferred_channel) - the underlying
 * link is account-wide (users.telegram_chat_id), so both pages share the
 * same onboarding flow and poll the same status endpoint.
 */
const TelegramLink = {
    POLL_INTERVAL_MS: 3000,
    POLL_MAX_ATTEMPTS: 100,  // ~5 minutes

    /**
     * Fetch and render the current link status into `container`.
     *
     * @param {HTMLElement} container
     * @param {{onLinked?: Function, onUnlinked?: Function}} callbacks
     */
    async render(container, callbacks = {}) {
        this._stopPolling(container);
        const response = await apiRequest('/user/telegram/status');
        const status = response.success ? response.data : { linked: false, linked_at: null };
        this._renderStatus(container, status, callbacks);
    },

    _renderStatus(container, status, callbacks) {
        if (status.linked) {
            container.innerHTML = `
                <div class="stack" style="gap: var(--space-2);">
                    <p class="text-muted">${escapeHtml(t('telegramLink.linkedSince', { date: formatDateTime(status.linked_at) }))}</p>
                    <button class="btn btn-ghost btn-sm" type="button" data-telegram-unlink>${escapeHtml(t('telegramLink.unlinkButton'))}</button>
                </div>`;
            container.querySelector('[data-telegram-unlink]').addEventListener('click', () => this._handleUnlink(container, callbacks));
            return;
        }

        container.innerHTML = `
            <div class="stack" style="gap: var(--space-2);">
                <p class="text-muted">${escapeHtml(t('telegramLink.notLinkedHint'))}</p>
                <button class="btn btn-secondary btn-sm" type="button" data-telegram-start>${escapeHtml(t('telegramLink.heading'))}</button>
                <div data-telegram-onboarding></div>
            </div>`;
        container.querySelector('[data-telegram-start]').addEventListener('click', () => this._handleStart(container, callbacks));
    },

    async _handleStart(container, callbacks) {
        const startBtn = container.querySelector('[data-telegram-start]');
        if (startBtn) startBtn.disabled = true;

        const response = await apiRequest('/user/telegram/link-token', { method: 'POST' });

        if (startBtn) startBtn.disabled = false;

        const onboardingBox = container.querySelector('[data-telegram-onboarding]');
        if (!onboardingBox) return;

        if (!response.success || !response.data.bot_configured) {
            onboardingBox.innerHTML = `<div class="alert alert-error">${escapeHtml(t('telegramLink.botNotConfigured'))}</div>`;
            return;
        }

        const deepLink = response.data.deep_link;
        onboardingBox.innerHTML = `
            <div class="stack" style="gap: var(--space-2); margin-top: var(--space-2);">
                <a class="btn btn-primary btn-sm" href="${escapeHtml(deepLink)}" target="_blank" rel="noopener">${escapeHtml(t('telegramLink.openButton'))}</a>
                <small>${escapeHtml(t('telegramLink.manualHint'))}<br><code style="word-break: break-all;">${escapeHtml(deepLink)}</code></small>
                <p class="text-muted"><span class="spinner"></span> ${escapeHtml(t('telegramLink.waitingHint'))}</p>
                <button class="btn btn-ghost btn-sm" type="button" data-telegram-check>${escapeHtml(t('telegramLink.checkNowButton'))}</button>
            </div>`;

        onboardingBox.querySelector('[data-telegram-check]').addEventListener('click', () => this._checkStatus(container, callbacks, false));
        this._startPolling(container, callbacks);
    },

    _startPolling(container, callbacks) {
        this._stopPolling(container);
        let attempts = 0;

        container._telegramLinkPoll = setInterval(async () => {
            if (!document.body.contains(container)) {
                this._stopPolling(container);
                return;
            }

            attempts += 1;
            if (attempts > this.POLL_MAX_ATTEMPTS) {
                this._stopPolling(container);
                return;
            }

            await this._checkStatus(container, callbacks, true);
        }, this.POLL_INTERVAL_MS);
    },

    _stopPolling(container) {
        if (container._telegramLinkPoll) {
            clearInterval(container._telegramLinkPoll);
            container._telegramLinkPoll = null;
        }
    },

    async _checkStatus(container, callbacks, silent) {
        const response = await apiRequest('/user/telegram/status');

        if (!response.success) {
            if (!silent) showToast(t('telegramLink.statusCheckFailed'), 'error');
            return false;
        }

        if (!response.data.linked) return false;

        this._stopPolling(container);
        this._renderStatus(container, response.data, callbacks);
        showToast(t('telegramLink.linkedToast'), 'success');
        if (callbacks.onLinked) callbacks.onLinked(response.data);
        return true;
    },

    async _handleUnlink(container, callbacks) {
        if (!confirm(t('telegramLink.unlinkConfirm'))) return;

        const response = await apiRequest('/user/telegram/link', { method: 'DELETE' });

        if (!response.success) {
            showToast(response.code ? t.error(response.code) : (response.error || t('telegramLink.linkFailed')), 'error');
            return;
        }

        showToast(t('telegramLink.unlinkedToast'), 'success');
        this._renderStatus(container, { linked: false, linked_at: null }, callbacks);
        if (callbacks.onUnlinked) callbacks.onUnlinked();
    }
};
