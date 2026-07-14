/**
 * @file i18nEn.ts
 * @module __tests__/test/i18nEn
 *
 * @description
 * Shared real-English key resolver for test mocks of react-i18next.
 * Resolves translation keys against the actual EN locale resources so that
 * test assertions match production-rendered text without in-code fallbacks.
 *
 * @responsibility
 * - Load all EN locale namespaces once.
 * - Resolve 'ns:dotted.key' and bare 'dotted.key' forms in a namespace order.
 * - Perform i18next-style {{placeholder}} interpolation from an options object.
 */

import analytics from '../../../public/locales/en/analytics.json';
import auth from '../../../public/locales/en/auth.json';
import common from '../../../public/locales/en/common.json';
import errors from '../../../public/locales/en/errors.json';
import footer from '../../../public/locales/en/footer.json';
import help from '../../../public/locales/en/help.json';
import inventory from '../../../public/locales/en/inventory.json';
import landing from '../../../public/locales/en/landing.json';
import legal from '../../../public/locales/en/legal.json';
import suppliers from '../../../public/locales/en/suppliers.json';
import system from '../../../public/locales/en/system.json';

const RESOURCES: Record<string, unknown> = {
  analytics,
  auth,
  common,
  errors,
  footer,
  help,
  inventory,
  landing,
  legal,
  suppliers,
  system,
};

const ALL_NS = Object.keys(RESOURCES);

const lookup = (ns: string, key: string): string | undefined => {
  let node: unknown = RESOURCES[ns];
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object' || !(part in (node as Record<string, unknown>))) {
      return undefined;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
};

const interpolate = (text: string, options?: Record<string, unknown>): string =>
  options
    ? text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, name: string) =>
        name in options ? String(options[name]) : m,
      )
    : text;

/**
 * Build a t()-shaped resolver bound to a namespace search order.
 * Explicit 'ns:' prefixes always win; bare keys try the given order,
 * then every remaining namespace. Unresolvable keys echo the key,
 * matching i18next's missing-key behavior.
 */
export const makeTEn =
  (nsOrder: string[] = ['common']) =>
  (key: string, options?: Record<string, unknown>): string => {
    if (key.includes(':')) {
      const [ns, rest] = key.split(/:(.+)/);
      const hit = lookup(ns, rest);
      return hit !== undefined ? interpolate(hit, options) : key;
    }
    for (const ns of [...nsOrder, ...ALL_NS.filter((n) => !nsOrder.includes(n))]) {
      const hit = lookup(ns, key);
      if (hit !== undefined) return interpolate(hit, options);
    }
    return key;
  };

/** Default resolver with common-first search order. */
export const tEn = makeTEn(['common']);
