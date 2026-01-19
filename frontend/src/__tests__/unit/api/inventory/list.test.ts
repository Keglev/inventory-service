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
