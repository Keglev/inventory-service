/**
 * @file src/i18n/index.ts
 * @description
 * i18next initialization for Smart Supply Pro (German-first).
 * - Namespaced JSON backend: /locales/{{lng}}/{{ns}}.json
 * - Language detection: localStorage → querystring → navigator
 * - Persistence to localStorage (key: i18nextLng)
 * - React integration (hooks/context)
 *
 * @enterprise
 * - Default UI language is German (de) to match our target audience; English is fully supported.
 * - Regional variants (de-DE, en-US) are normalized to base languages (de, en).
 * - If a user selected a language previously, that choice wins (from localStorage).
 *
 * @usage
 * Import once in `main.tsx` (side effect): `import './i18n'`.
 * In components: `const { t } = useTranslation('<ns>');`
 */

import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

/** LocalStorage key used by i18next to persist the selected language. */
export const I18N_LS_KEY = 'i18nextLng';

/** Namespaces we maintain as separate JSON files. */
export const I18N_NAMESPACES = ['common', 'auth', 'system'] as const;

/**
 * Force initial language to DE unless the user already chose one.
 * This guarantees a German-first impression on first visit.
 */
const saved = typeof window !== 'undefined' ? localStorage.getItem(I18N_LS_KEY) : null;
const initialLng = saved || 'de';

i18n
  // Load /locales/{{lng}}/{{ns}}.json at runtime
  .use(Backend)
  // Detect language (we still pass `lng: initialLng` below to bias first render)
  .use(LanguageDetector)
  // React integration (context + hooks)
  .use(initReactI18next)
  .init({
    // German-first unless a saved choice exists
    lng: initialLng,

    // Fallback & supported languages
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    nonExplicitSupportedLngs: true, // treat de-DE as de, en-US as en
    load: 'languageOnly',           // ignore region code

    // Namespaces
    ns: I18N_NAMESPACES as unknown as string[],
    defaultNS: 'common',

    // Backend configuration (Vite serves /public as web root)
    backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },

    // Detection & persistence (localStorage first so prior choice wins)
    detection: {
      order: ['localStorage', 'querystring', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: I18N_LS_KEY,
    },

    // React already escapes values
    interpolation: { escapeValue: false },
  });

export default i18n;

/**
 * @tips
 * - To change the language manually, call `i18n.changeLanguage('de' | 'en')`.
 * - If you want to “reset” to German for demos, clear localStorage key `i18nextLng`.
 * - Keep MUI’s locale (theme) in sync via `buildTheme(locale)` and i18n’s `languageChanged` event.
 */
