/**
 * @file useSupplierByIdQuery.test.ts
 * @module tests/api/suppliers/hooks/useSupplierByIdQuery
 *
 * @summary
 * Validates the single-supplier query hook wiring by mocking React Query.
 * Confirms cache keys, enablement guards, and the record lookup logic.
 *
 * @enterprise
 * - Prevents cache segmentation regressions when selecting suppliers for detail forms
 * - Ensures disabled states avoid unnecessary network traffic when the ID is absent
 * - Guards the item finder against null results so consumer components can branch safely
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

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const getSuppliersPageMock = getSuppliersPage as ReturnType<typeof vi.fn>;

interface MockQueryConfig<TData> {
  queryKey: unknown;
  queryFn: () => Promise<TData> | TData;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

describe('useSupplierByIdQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    getSuppliersPageMock.mockReset();
  });

  it('builds query configuration and surfaces the matching supplier row', async () => {
    let capturedConfig: MockQueryConfig<SupplierRow | null> | undefined;
    const queryResult = { data: null };
    useQueryMock.mockImplementation((config) => {
      capturedConfig = config as MockQueryConfig<SupplierRow | null>;
      return queryResult;
    });

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
    expect(capturedConfig).toMatchObject({
      queryKey: ['suppliers', 'byId', 'SUP-1'],
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    });

    const resolved = await capturedConfig!.queryFn();
    expect(resolved).toEqual({ id: 'SUP-1', name: 'Acme Supply Co.' });
    expect(getSuppliersPageMock).toHaveBeenCalledWith({
      page: 1,
      pageSize: 100,
      q: 'SUP-1',
    });
    expect(hookReturn).toBe(queryResult);
  });

  it('disables fetching when no supplier ID is present or opt-in flag is false', () => {
    const configs: MockQueryConfig<SupplierRow | null>[] = [];
    useQueryMock.mockImplementation((config) => {
      configs.push(config as MockQueryConfig<SupplierRow | null>);
      return { data: null };
    });

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
