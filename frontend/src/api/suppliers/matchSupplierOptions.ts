/**
 * @file matchSupplierOptions.ts
 * @module api/suppliers/matchSupplierOptions
 *
 * @summary
 * Filters the supplier options by a typed fragment, in the browser.
 *
 * @enterprise
 * - Feeds SupplierPickerField: the supplier list is loaded once and cached,
 *   so typing sends no request (frontend ADR-0014, S2-9).
 * - Same rule as matchSuppliers on the suppliers board: the fragment anywhere
 *   in the name, case-insensitive, from SEARCH_MIN_CHARS characters on.
 */

import type { SupplierOption } from '../analytics/types';
import { searchFragment } from '../../utils/searchFragment';

/**
 * Suppliers whose name contains the typed fragment, ignoring case, in list order.
 *
 * @param suppliers every supplier
 * @param query the typed text
 * @returns the matches; [] while the text is shorter than SEARCH_MIN_CHARS
 */
export function matchSupplierOptions(suppliers: readonly SupplierOption[], query: string): SupplierOption[] {
  const fragment = searchFragment(query);
  if (!fragment) return [];
  return suppliers.filter((supplier) => supplier.label.toLowerCase().includes(fragment));
}
