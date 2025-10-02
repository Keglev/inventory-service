/**
 * @file itemUtils.ts
 * @module pages/inventory/utils/itemUtils
 *
 * @summary
 * Utility functions for item display and formatting.
 */

import type { DisplayableItem } from '../components/ItemAutocompleteOption';

/**
 * Get display label for item in autocomplete input field.
 * Shows just the item name for clean input appearance.
 */
export function getItemLabel(item: DisplayableItem): string {
  return item.name;
}

/**
 * Convert ItemRef to DisplayableItem with default values.
 */
export function toDisplayableItem(item: { id: string; name: string; supplierId?: string | null }): DisplayableItem {
  return {
    id: item.id,
    name: item.name,
    supplierId: item.supplierId,
    // These will be filled in by the search API if available
    onHand: undefined,
    currentPrice: undefined,
  };
}