/**
 * @file matchItems.ts
 * @module api/inventory/matchItems
 *
 * @summary
 * Filters one supplier's item list by a typed fragment, in the browser.
 *
 * @enterprise
 * - The inventory dialogs load a supplier's items once and match them here,
 *   not with one request per keystroke (frontend ADR-0014).
 * - Same rule as the backend search: the fragment anywhere in the name OR
 *   the SKU, case-insensitive, from SEARCH_MIN_CHARS characters on.
 */

import type { ItemRef } from '../shared/types';
import { searchFragment } from '../../utils/searchFragment';

/**
 * Items whose name or SKU contains the fragment, case-insensitively, in
 * list order; [] while the fragment is shorter than SEARCH_MIN_CHARS.
 */
export function matchItems(items: readonly ItemRef[], query: string): ItemRef[] {
  const fragment = searchFragment(query);
  if (!fragment) return [];
  return items.filter(
    (item) => item.name.toLowerCase().includes(fragment) || (item.sku ?? '').toLowerCase().includes(fragment)
  );
}
