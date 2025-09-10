/**
 * @file resources.d.ts
 * @description
 * Type augmentation for i18next to provide compile-time safety when using `t('...')`.
 * This ties your translation keys to the structure you define in your resources.
 *
 * Namespaces supported:
 * - 'common'
 * - 'auth'
 * - 'system'
 *
 * IMPORTANT:
 * - We augment 'i18next' directly here because we are typing the CustomTypeOptions.
 * - This ensures `useTranslation('<ns>')` only accepts your declared namespaces,
 *   and keys inside `t('...')` are validated.
 *
 * @enterprise
 * - Keeps i18n usage self-documenting and safe during refactors.
 * - When adding new translation keys, update this file to keep TS in sync.
 */

import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    /** @default 'common' */
    defaultNS: 'common';

    resources: {
      common: {
        app: { title: string };
        nav: {
          dashboard: string;
          inventory: string;
          suppliers: string;
          orders: string;
          analytics: string;
          logout: string;
        };
        actions: {
          toggleDensity: string;
          toggleLanguage: string;
        };
        toast: { densityStatic: string };
        profile: { soon: string };
      };

      auth: {
        signIn: string;
        signInGoogle: string;
        welcome: string;
        email: string;
        password: string;
        or: string;
        ssoHint: string;

        // Current keys (used across login/logout flows)
        errorTitle: string;
        errorTryAgain: string;
        logoutSigningOut: string;
        logoutFailed: string;
        logoutSuccessTitle: string;
        logoutSuccessBody: string;
        signInAgain: string;
        backToHome: string;

        // Optional (used in AuthCallback defaultValue)
        verifying?: string;
      };

      system: {
        notFound: {
          title: string;
          body: string;
        };
      };
    };
  }
}
