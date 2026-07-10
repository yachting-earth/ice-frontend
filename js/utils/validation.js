/**
 * Client-side validation mirroring backend/src/Validators/InputValidator.php.
 * Server-side rules are authoritative - these just give instant feedback.
 */
const Validate = {
    email(value) {
        if (!value) return t('validation.emailRequired');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t('validation.emailInvalid');
        return null;
    },

    password(value) {
        if (!value) return t('validation.passwordRequired');
        if (value.length < 8) return t('validation.passwordTooShort');
        if (!/[A-Z]/.test(value)) return t('validation.passwordNeedsUppercase');
        if (!/[0-9]/.test(value)) return t('validation.passwordNeedsNumber');
        return null;
    },

    name(value) {
        if (!value) return t('validation.nameRequired');
        if (value.length < 2) return t('validation.nameTooShort');
        return null;
    },

    phone(value, optional = false) {
        if (!value) return optional ? null : t('validation.phoneRequired');
        if (!/^\+?[1-9]\d{1,14}$/.test(value)) return t('validation.phoneInvalid');
        return null;
    },

    windyUrl(value) {
        if (!value) return t('validation.windyUrlRequired');
        if (!/^https:\/\/www\.windy\.com\/route-planner\/(?:[a-z]+\/)?[\d.,;-]+/i.test(value)) {
            return t('validation.windyUrlInvalid');
        }
        return null;
    },

    vesselYear(value) {
        if (!value) return null;
        const maxYear = new Date().getFullYear() + 1;
        const year = Number(value);
        if (!Number.isInteger(year) || year < 1900 || year > maxYear) {
            return t('validation.vesselYearInvalid', { maxYear });
        }
        return null;
    },

    vesselDimension(value, label) {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (!Number.isFinite(num) || num <= 0 || num > 200) {
            return t('validation.vesselDimensionInvalid', { label });
        }
        return null;
    }
};
