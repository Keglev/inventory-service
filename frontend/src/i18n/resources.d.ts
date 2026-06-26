/**
 * @file resources.d.ts
 * @module i18n/resources
 * @summary TypeScript module augmentation for i18next CustomTypeOptions. Ties the
 *   runtime translation keys to compile-time types: useTranslation('<ns>') only
 *   accepts declared namespaces; t('<key>') is validated against the JSON shapes
 *   at compile time.
 *
 * @enterprise
 * - Augments 'i18next' directly via declare module — affects every useTranslation()
 *   call site project-wide.
 * - Typing source contract: the nine EN JSON files (public/locales/en/*.json) are
 *   imported as the shape source. DE JSON files are expected to mirror the EN shape;
 *   mismatches surface as runtime missing-key warnings, not compile errors.
 * - Cross-boundary import: reaches out of src/ into public/ — intentional; the
 *   English JSON files are the typing contract, not an implementation detail.
 * - Coupled to I18N_NAMESPACES in i18n/index.ts — both must be edited together
 *   when adding or removing a namespace. Tracked under CB-APP23.
 * - .d.ts file: no runtime emit; comment-only changes are safe.
 */

import 'i18next';

// BUCKET: nine imports + nine typed keys duplicate the I18N_NAMESPACES list in i18n/index.ts; investigate deriving the typed shape from a mapped type over the namespace tuple (CB-APP23)
import common from '../../public/locales/en/common.json';
import analytics from '../../public/locales/en/analytics.json';
import auth from '../../public/locales/en/auth.json';
import system from '../../public/locales/en/system.json';
import inventory from '../../public/locales/en/inventory.json';
import errors from '../../public/locales/en/errors.json';
import suppliers from '../../public/locales/en/suppliers.json';
import footer from '../../public/locales/en/footer.json';
import help from '../../public/locales/en/help.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    /** Default namespace if not passed to useTranslation */
    defaultNS: 'common';

    resources: {
      common: typeof common;
      analytics: typeof analytics;
      auth: typeof auth;
      system: typeof system;
      inventory: typeof inventory;
      errors: typeof errors;
      suppliers: typeof suppliers;
      footer: typeof footer;
      help: typeof help;
    };
  }
}
