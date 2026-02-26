/**
 * @file useSupplierSearchQuery.test.ts
 * @module tests/unit/api/suppliers/hooks/useSupplierSearchQuery
 * @what_is_under_test useSupplierSearchQuery
 * @responsibility
 * Guarantees the hook’s contract: stable search queryKey composition, enablement gating for
 * short/blank terms, and deterministic empty results without calling the backend when gated.
 * @out_of_scope
 * React Query runtime behavior (cache lifetimes, retries, background refetching, observer lifecycles).
 * @out_of_scope
 * Supplier list fetcher behavior beyond parameter forwarding (HTTP wiring and response parsing).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/api/suppliers/supplierListFetcher', () => ({
  getSuppliersPage: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { getSuppliersPage } from '@/api/suppliers/supplierListFetcher';
import { useSupplierSearchQuery } from '@/api/suppliers/hooks/useSupplierSearchQuery';
import type { SupplierRow } from '@/api/suppliers/types';
import {
  arrangeUseQueryConfigCapture,
  arrangeUseQueryConfigCollector,
} from '../../../utils/reactQueryCapture';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const getSuppliersPageMock = getSuppliersPage as ReturnType<typeof vi.fn>;

describe('useSupplierSearchQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    getSuppliersPageMock.mockReset();
  });

  it('wires the search query to backend pagination when length threshold met', async () => {
    const queryHandle = { data: undefined };
    const term = 'acme';

    const { getConfig } = arrangeUseQueryConfigCapture<SupplierRow[]>(useQueryMock, queryHandle);

    const response = {
      items: [{ id: 'SUP-5', name: 'Acme Labs' }],
      total: 1,
      page: 1,
      pageSize: 1000,
    };
    getSuppliersPageMock.mockResolvedValue(response);

    const hookResult = useSupplierSearchQuery(term, true);

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    const capturedConfig = getConfig();
    expect(capturedConfig).toMatchObject({
      queryKey: ['suppliers', 'search', term],
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    });

    const payload = await capturedConfig.queryFn();
    expect(payload).toEqual(response.items);
    expect(getSuppliersPageMock).toHaveBeenCalledWith({
      page: 1,
      pageSize: 1000,
      q: term,
    });
    expect(hookResult).toBe(queryHandle);
  });

  it('short-circuits short or blank queries without hitting the backend', async () => {
    const { configs } = arrangeUseQueryConfigCollector<SupplierRow[]>(useQueryMock);

    useSupplierSearchQuery('A');
    useSupplierSearchQuery('   ');

    expect(configs[0]).toMatchObject({
      queryKey: ['suppliers', 'search', 'A'],
      enabled: false,
    });

    const blankResult = await configs[1]!.queryFn();
    expect(blankResult).toEqual([]);
    expect(configs[1]).toMatchObject({ queryKey: ['suppliers', 'search', '   '] });
    expect(getSuppliersPageMock).not.toHaveBeenCalled();
  });
});
