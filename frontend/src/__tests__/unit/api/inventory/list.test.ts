/**
 * @file list.test.ts
 * @module tests/unit/api/inventory/list
 * @what_is_under_test inventory list barrel (re-exports)
 * @responsibility
 * Guarantees the module’s public surface remains stable by re-exporting the canonical fetcher
 * and normalizer bindings consumed by the rest of the inventory domain.
 * @out_of_scope
 * Behavior of `getInventoryPage` (covered by listFetcher tests).
 * @out_of_scope
 * Behavior of `toInventoryRow` (covered by row normalizer tests).
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../../api/inventory/listFetcher', () => ({
  getInventoryPage: vi.fn(),
}));

vi.mock('../../../../api/inventory/rowNormalizers', () => ({
  toInventoryRow: vi.fn(),
}));

import { getInventoryPage as fetcherGetInventoryPage } from '../../../../api/inventory/listFetcher';
import { toInventoryRow as normalizerToInventoryRow } from '../../../../api/inventory/rowNormalizers';
import { getInventoryPage, toInventoryRow } from '../../../../api/inventory/list';

describe('inventory list barrel', () => {
  it('re-exports getInventoryPage and toInventoryRow', () => {
    expect(getInventoryPage).toBe(fetcherGetInventoryPage);
    expect(toInventoryRow).toBe(normalizerToInventoryRow);
  });
});
