/**
 * Client-side validation mirroring backend/src/Validators/InputValidator.php.
 * Server-side rules are authoritative - these just give instant feedback.
 */
const Validate = {
    email(value) {
        if (!value) return 'E-post krävs';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Ogiltig e-postadress';
        return null;
    },

    password(value) {
        if (!value) return 'Lösenord krävs';
        if (value.length < 8) return 'Lösenordet måste vara minst 8 tecken';
        if (!/[A-Z]/.test(value)) return 'Lösenordet måste innehålla minst en stor bokstav';
        if (!/[0-9]/.test(value)) return 'Lösenordet måste innehålla minst en siffra';
        return null;
    },

    name(value) {
        if (!value) return 'Namn krävs';
        if (value.length < 2) return 'Namnet måste vara minst 2 tecken';
        return null;
    },

    phone(value, optional = false) {
        if (!value) return optional ? null : 'Telefonnummer krävs';
        if (!/^\+?[1-9]\d{1,14}$/.test(value)) return 'Ogiltigt telefonnummer (använd internationellt format, t.ex. +46701234567)';
        return null;
    },

    windyUrl(value) {
        if (!value) return 'Windy-länk krävs';
        if (!/^https:\/\/www\.windy\.com\/route-planner\/(?:[a-z]+\/)?[\d.,;-]+/i.test(value)) {
            return 'Ogiltig Windy-länk. Måste vara från windy.com/route-planner';
        }
        return null;
    },

    vesselYear(value) {
        if (!value) return null;
        const maxYear = new Date().getFullYear() + 1;
        const year = Number(value);
        if (!Number.isInteger(year) || year < 1900 || year > maxYear) {
            return `Årsmodell måste vara ett heltal mellan 1900 och ${maxYear}`;
        }
        return null;
    },

    vesselDimension(value, label) {
        if (value === '' || value === null || value === undefined) return null;
        const num = Number(value);
        if (!Number.isFinite(num) || num <= 0 || num > 200) {
            return `${label} måste vara ett positivt tal i meter (max 200)`;
        }
        return null;
    }
};
