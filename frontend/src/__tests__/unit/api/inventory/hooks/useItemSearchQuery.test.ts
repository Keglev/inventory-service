/**
 * @file useItemSearchQuery.test.ts
 * @module tests/unit/api/inventory/hooks/useItemSearchQuery
 * @what_is_under_test useItemSearchQuery
 * @responsibility
 * Guarantees the hook’s public contract: queryKey composition, enabled gating for type-ahead UX,
 * and supplier isolation via client-side filtering when upstream results are broader than expected.
 * @out_of_scope
 * Backend search relevance/ranking correctness (server-side implementation and scoring).
 * @out_of_scope
 * React Query cache mechanics (retry/backoff, background refetching, observer subscription).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/api/analytics/search', () => ({
  searchItemsForSupplier: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { searchItemsForSupplier } from '@/api/analytics/search';
import { useItemSearchQuery } from '@/api/inventory/hooks/useItemSearchQuery';
import type { SupplierOption } from '@/api/analytics/types';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const searchItemsForSupplierMock = searchItemsForSupplier as ReturnType<typeof vi.fn>;

const supplier: SupplierOption = { id: 'SUP-1', label: 'Acme' };

function arrangeUseQueryConfigCapture() {
  useQueryMock.mockImplementation(() => ({ data: undefined }));
}

describe('useItemSearchQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters results client-side and maps to item options', async () => {
    arrangeUseQueryConfigCapture();
    searchItemsForSupplierMock.mockResolvedValue([
      { id: 'ITEM-1', name: 'Widget', supplierId: 'SUP-1' },
      { id: 'ITEM-2', name: 'Other', supplierId: 'SUP-2' },
    ]);

    const result = useItemSearchQuery(supplier, 'bolt');

    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['inventory', 'search', 'SUP-1', 'bolt'],
      enabled: true,
      staleTime: 30_000,
    }));
    const cfg = useQueryMock.mock.calls[0][0];
    expect(await cfg.queryFn()).toEqual([
      { id: 'ITEM-1', name: 'Widget' },
    ]);
    expect(searchItemsForSupplierMock).toHaveBeenCalledWith('SUP-1', 'bolt', 500);
    expect(result).toEqual({ data: undefined });
  });

  it('short-circuits when supplier is missing', async () => {
    arrangeUseQueryConfigCapture();

    useItemSearchQuery(null, 'bolt');

    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    const cfg = useQueryMock.mock.calls[0][0];
    expect(await cfg.queryFn()).toEqual([]);
    expect(searchItemsForSupplierMock).not.toHaveBeenCalled();
  });

  it('disables search when query length is below threshold', () => {
    arrangeUseQueryConfigCapture();

    useItemSearchQuery(supplier, 'a');

    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});
