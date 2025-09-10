/**
 * @file resources.d.ts
 * @description
 * Type augmentation for i18next to provide compile-time safety when using `t('...')`.
 * This ties your translation keys to the structure you define in your resources.
 * - We `useTranslation('<ns>')` accepts 'common' | 'auth' | 'system'
 * and keys are type-checked.
 *
 * IMPORTANT: We augment 'react-i18next' (the library that exports the hook types),
 * not 'i18next'. This is because the `useTranslation` hook is defined there.
 *
 * @enterprise
 * - Keeps your i18n usage self-documenting and safe during refactors.
 * - When you migrate to JSON resource files, you can import their types here so
 *   your keys remain typed without changing component code.
 */

import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    /**
     * @default 'translation'
     * The default namespace. We’re using the single default namespace “translation”
     * since resources are inline in `src/i18n/index.ts` for now.
     */
    defaultNS: 'common';

    /**
     * Shape of your resources for the default namespace.
     *
     * NOTE:
     * - Keep this in sync with the object you export in `src/i18n/index.ts`.
     * - When you move to external JSON files, you can switch this to:
     *
     *    resources: {
     *      translation: typeof import('./locales/de/common.json')
     *    }
     *
     *   (assuming your DE file contains the superset of keys).
     */
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
        logoutTitle: string;
        logoutBody: string;
        // Optional key used in AuthCallback defaultValue:
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