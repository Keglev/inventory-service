/**
 * @file useSupplierByIdQuery.test.ts
 * @module tests/unit/api/suppliers/hooks/useSupplierByIdQuery
 * @what_is_under_test useSupplierByIdQuery
 * @responsibility
 * Guarantees the hook’s contract: stable queryKey composition, enablement gating when the supplier ID
 * or opt-in flag is missing, and deterministic selection of the matching supplier row.
 * @out_of_scope
 * React Query runtime behavior (cache lifetimes, retries, background refetching, observer lifecycles).
 * @out_of_scope
 * Supplier pagination behavior and backend search correctness (this suite treats the fetcher as a dependency).
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
import { useSupplierByIdQuery } from '@/api/suppliers/hooks/useSupplierByIdQuery';
import type { SupplierRow } from '@/api/suppliers/types';
import {
  arrangeUseQueryConfigCapture,
  arrangeUseQueryConfigCollector,
} from '../../../utils/reactQueryCapture';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const getSuppliersPageMock = getSuppliersPage as ReturnType<typeof vi.fn>;

describe('useSupplierByIdQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    getSuppliersPageMock.mockReset();
  });

  it('builds query configuration and surfaces the matching supplier row', async () => {
    const { queryResult, getConfig } = arrangeUseQueryConfigCapture<SupplierRow | null>(
      useQueryMock,
      { data: null },
    );

    getSuppliersPageMock.mockResolvedValue({
      items: [
        { id: 'SUP-1', name: 'Acme Supply Co.' },
        { id: 'SUP-2', name: 'Beta Parts' },
      ],
      total: 2,
      page: 1,
      pageSize: 100,
    });

    const hookReturn = useSupplierByIdQuery('SUP-1');

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    const capturedConfig = getConfig();
    expect(capturedConfig).toMatchObject({
      queryKey: ['suppliers', 'byId', 'SUP-1'],
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    });

    const resolved = await capturedConfig.queryFn();
    expect(resolved).toEqual({ id: 'SUP-1', name: 'Acme Supply Co.' });
    expect(getSuppliersPageMock).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      q: 'SUP-1',
    });
    expect(hookReturn).toBe(queryResult);
  });

  it('disables fetching when no supplier ID is present or opt-in flag is false', () => {
    const { configs } = arrangeUseQueryConfigCollector<SupplierRow | null>(useQueryMock, { data: null });

    useSupplierByIdQuery(null);
    useSupplierByIdQuery('SUP-9', false);

    expect(configs[0]).toMatchObject({
      queryKey: ['suppliers', 'byId', null],
      enabled: false,
    });
    expect(configs[1]).toMatchObject({
      queryKey: ['suppliers', 'byId', 'SUP-9'],
      enabled: false,
    });
    expect(getSuppliersPageMock).not.toHaveBeenCalled();
  });
});
