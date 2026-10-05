/**
 * @file storageKeys.ts
 * @module config/storageKeys
 *
 * @summary
 * Every key the app writes to the browser's localStorage, in one place.
 *
 * @enterprise
 * - This list is the inventory of what the app keeps on the visitor's device
 *   (TTDSG section 25): language, theme, display preferences, the demo
 *   session and a transient cross-tab logout signal. Each serves a function
 *   the visitor asked for; none tracks or identifies them.
 * - The values are a contract with every browser that already holds them:
 *   renaming a key silently drops the choice stored under the old name.
 * - The app writes no sessionStorage, IndexedDB or cookies of its own; the
 *   session cookie is set by the backend.
 */

/** UI language ('de' | 'en'). Also i18next's own default key, so both read one value. */
export const LANGUAGE_KEY = 'i18nextLng';

/** Theme mode ('light' | 'dark'), shared by the public shell and the app shell. */
export const THEME_MODE_KEY = 'themeMode';

/** Display preferences (date format, number format, table density) as JSON. */
export const SETTINGS_KEY = 'appSettings';

/** The client-only demo session, a demo AppUser as JSON; absent for real logins. */
export const DEMO_SESSION_KEY = 'ssp.demo.session';

/** Cross-tab logout signal: written and removed at once, seen only through storage events. */
export const FORCE_LOGOUT_FLAG = 'ssp:forceLogout';
