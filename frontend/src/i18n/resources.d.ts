/**
 * @file resources.d.ts
 * @description
 * Type augmentation for i18next to provide compile-time safety when using `t('...')`.
 * This ties your translation keys to the structure you define in your resources.
 *
 * Keep this file in sync with actual JSON namespaces under:
 *   public/locales/{en,de}/...json
 *
 * IMPORTANT:
 * - We augment 'i18next' directly here because we are typing the CustomTypeOptions.
 * - This ensures `useTranslation('<ns>')` only accepts your declared namespaces,
 *   and keys inside `t('...')` are validated at compile time.
 *
 * @enterprise
 * - Keeps i18n usage self-documenting and safe during refactors.
 * - When adding new translation keys/namespaces, update this file to keep TS in sync.
 */

import 'i18next';

// Import JSONs (EN versions are enough for typing) so their shapes become the source of truth.
import common from '../../public/locales/en/common.json';
import analytics from '../../public/locales/en/analytics.json';
import auth from '../../public/locales/en/auth.json';
import system from '../../public/locales/en/system.json';
import inventory from '../../public/locales/en/inventory.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    /** Default namespace if not passed to useTranslation */
    defaultNS: 'common';

    /**
     * Declare all namespaces and their key shapes.
     * NOTE:
     *  - We keep `common` typed via the actual JSON (safer than hand-written shapes).
     *  - We expose `analytics` as a dedicated namespace.
     */
    resources: {
      /** Shared/global keys (navigation, basic actions, dashboard, etc.) */
      common: typeof common;

      /** dedicated namespace for analytics UI */
      analytics: typeof analytics;

      /** dedicated namespace for auth screens */
      auth: typeof auth;

      /** dedicated namespace for system-level screens */
      system: typeof system;

      /** dedicated namespace for inventory screens */
      inventory: typeof inventory;

    };
  }
}
