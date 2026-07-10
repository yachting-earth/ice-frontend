# Adding a language (frontend)

1. Copy the reference file `en.json` → `xx.json` and translate every value.
   `en.json` must stay 100% complete - it's the fallback every other
   language falls back to, and the CI guard measures completeness against it.
2. Add `'xx'` to `I18n.SUPPORTED` in `frontend/js/i18n.js`.
3. Add `xx` to the language selector rendered in `renderTopbar()`
   (`frontend/js/app.js`) - it's built from `I18n.SUPPORTED`, so this is
   usually automatic.

No other code changes. `scripts/check-i18n-completeness.js` (run in CI) fails
the build if `xx.json` is missing a key that exists in `en.json`.

See `documents/12-I18N-IMPLEMENTATION.md` for the full design.
