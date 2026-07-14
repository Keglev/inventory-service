/**
 * @file src/i18n/index.ts
 * @module i18n
 * @summary i18next runtime initialization (German-first). Bootstrapped via side-effect
 *   import in main.tsx; not consumed via named imports anywhere in production code.
 *   After init, components access translations via react-i18next's useTranslation()
 *   against the initialized singleton.
 *
 * @enterprise
 * - Side-effect import contract: imported once from main.tsx (`import './i18n'`).
 *   No production code imports from this module's named exports; I18N_LS_KEY and
 *   I18N_NAMESPACES exist as test-pinning surface only (consumed by
 *   __tests__/unit/i18n/i18n.test.ts).
 * - Translation JSON lives in frontend/public/locales/{en,de}/<ns>.json. Nine
 *   namespaces match I18N_NAMESPACES exactly. EN files double as the typing source
 *   via resources.d.ts (see that file's header).
 * - German-first impression: on first visit, localStorage is pre-seeded with 'de'
 *   before LanguageDetector runs. Navigator detection therefore affects returning
 *   users who have cleared localStorage, not first-time visitors. Intentional.
 * - Regional variants collapse to base language (de-DE -> de, en-US -> en) via
 *   supportedLngs + nonExplicitSupportedLngs + load:'languageOnly'.
 * - Vite BASE_URL is in the loadPath — supports sub-path deployment (e.g. /app/).
 * - MUI theme locale must be kept in sync via the languageChanged event (see
 *   @remarks block below).
 */

import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

/** LocalStorage key used by i18next to persist the selected language. */
export const I18N_LS_KEY = 'i18nextLng';

// BUCKET: namespace list duplicated in resources.d.ts (11 imports + 11 typed resources keys); risk of drift on add/remove (CB-APP23)
/** Namespaces we maintain as separate JSON files. */
export const I18N_NAMESPACES = ['common', 'auth', 'system', 'analytics', 'inventory', 'errors', 'suppliers', 'footer', 'help', 'legal', 'landing'] as const;

/**
 * Force initial language to DE unless the user already chose one.
 * This guarantees a German-first impression on first visit.
 */
const saved = typeof window !== 'undefined' ? localStorage.getItem(I18N_LS_KEY) : null;
const initialLng = saved || 'de';
if (!saved && typeof window !== 'undefined') {
  localStorage.setItem(I18N_LS_KEY, 'de'); // <- guarantees German-first
}

i18n
  // Load /locales/{{lng}}/{{ns}}.json at runtime
  .use(Backend)
  // Detect language (we still pass `lng: initialLng` below to bias first render)
  .use(LanguageDetector)
  // React integration (context + hooks)
  .use(initReactI18next)

  // Initialization options
  .init({
    // German-first unless a saved choice exists
    lng: initialLng,

    // Fallback & supported languages
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    nonExplicitSupportedLngs: true, // WHY: regional variants collapse so a user with browser lang en-US sees English without an exact match in supportedLngs.
    load: 'languageOnly',           // ignore region code

    // Namespaces
    ns: I18N_NAMESPACES as unknown as string[],
    defaultNS: 'common',

    // Backend configuration (Vite serves /public as web root)
    backend: { loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/{{ns}}.json` },

    // Detection & persistence (localStorage first so prior choice wins)
    detection: {
      order: ['localStorage', 'querystring', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: I18N_LS_KEY,
    },

    // React already escapes values
    interpolation: { escapeValue: false },

    // Disable suspense mode (handle loading/error states ourselves)
    react: { useSuspense: false },
  });
  
  // Explicitly ensure all namespaces are loaded (might be async)
  i18n.loadNamespaces(I18N_NAMESPACES as unknown as string[]);

  // BUCKET: dev tap is useful — drop the "remove later" instruction or remove the tap (CM-APP6)
  // TEMP: expose for debugging in dev (remove later)
  if (import.meta.env.DEV) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).i18next = i18n;
  }

export default i18n;

/**
 * @remarks
 * - To change the language manually, call `i18n.changeLanguage('de' | 'en')`.
 * - If you want to "reset" to German for demos, clear localStorage key `i18nextLng`.
 * - Keep MUI's locale (theme) in sync via `buildTheme(locale)` and i18n's `languageChanged` event.
 */
