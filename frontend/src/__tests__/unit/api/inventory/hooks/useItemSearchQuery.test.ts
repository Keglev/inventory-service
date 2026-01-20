/**
 * @file useItemSearchQuery.test.ts
 * @module tests/api/inventory/hooks/useItemSearchQuery
 *
 * @summary
 * Validates the supplier-scoped inventory search hook behavior under backend limitations.
 * Confirms query wiring, client-side supplier filtering, and gating logic for type-ahead UX.
 *
 * @enterprise
 * - Protects cache key semantics that drive query deduplication and revalidation
 * - Ensures supplier isolation remains enforced even if backend regresses
 * - Keeps short-query throttling intact to prevent unnecessary API pressure
 */

import { describe, expect, it, vi } from 'vitest';

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

describe('useItemSearchQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters results client-side and maps to item options', async () => {
    const mockQuery = vi.fn();
    useQueryMock.mockImplementation((config) => {
      mockQuery(config);
      return { data: undefined };
    });
    searchItemsForSupplierMock.mockResolvedValue([
      { id: 'ITEM-1', name: 'Widget', supplierId: 'SUP-1' },
      { id: 'ITEM-2', name: 'Other', supplierId: 'SUP-2' },
    ]);

    const result = useItemSearchQuery(supplier, 'bolt');

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['inventory', 'search', 'SUP-1', 'bolt'],
      enabled: true,
      staleTime: 30_000,
    }));
    const cfg = mockQuery.mock.calls[0][0];
    expect(await cfg.queryFn()).toEqual([
      { id: 'ITEM-1', name: 'Widget' },
    ]);
    expect(searchItemsForSupplierMock).toHaveBeenCalledWith('SUP-1', 'bolt', 500);
    expect(result).toEqual({ data: undefined });
  });

  it('short-circuits when supplier is missing', async () => {
    const mockQuery = vi.fn();
    useQueryMock.mockImplementation((config) => {
      mockQuery(config);
      return { data: undefined };
    });

    useItemSearchQuery(null, 'bolt');

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    const cfg = mockQuery.mock.calls[0][0];
    expect(await cfg.queryFn()).toEqual([]);
    expect(searchItemsForSupplierMock).not.toHaveBeenCalled();
  });

  it('disables search when query length is below threshold', () => {
    const mockQuery = vi.fn();
    useQueryMock.mockImplementation((config) => {
      mockQuery(config);
      return { data: undefined };
    });

    useItemSearchQuery(supplier, 'a');

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });
});
