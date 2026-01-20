/**
 * @file useSupplierSearchQuery.test.ts
 * @module tests/api/suppliers/hooks/useSupplierSearchQuery
 *
 * @summary
 * Covers the supplier search hook behaviour with controlled React Query mocks.
 * Verifies cache keys, length gating, and client-side empty handling.
 *
 * @enterprise
 * - Avoids accidental cache overlap across distinct search terms
 * - Ensures short queries never hit the backend, protecting latency budgets
 * - Validates blank queries short-circuit locally to keep UI responsive
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

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const getSuppliersPageMock = getSuppliersPage as ReturnType<typeof vi.fn>;

interface MockQueryConfig<TData> {
  queryKey: unknown;
  queryFn: () => Promise<TData> | TData;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

describe('useSupplierSearchQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    getSuppliersPageMock.mockReset();
  });

  it('wires the search query to backend pagination when length threshold met', async () => {
    let capturedConfig: MockQueryConfig<SupplierRow[]> | undefined;
    const queryHandle = { data: undefined };
    const term = 'acme';

    useQueryMock.mockImplementation((config) => {
      capturedConfig = config as MockQueryConfig<SupplierRow[]>;
      return queryHandle;
    });

    const response = {
      items: [{ id: 'SUP-5', name: 'Acme Labs' }],
      total: 1,
      page: 1,
      pageSize: 1000,
    };
    getSuppliersPageMock.mockResolvedValue(response);

    const hookResult = useSupplierSearchQuery(term, true);

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    expect(capturedConfig).toMatchObject({
      queryKey: ['suppliers', 'search', term],
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    });

    const payload = await capturedConfig!.queryFn();
    expect(payload).toEqual(response.items);
    expect(getSuppliersPageMock).toHaveBeenCalledWith({
      page: 1,
      pageSize: 1000,
      q: term,
    });
    expect(hookResult).toBe(queryHandle);
  });

  it('short-circuits short or blank queries without hitting the backend', async () => {
    const configs: MockQueryConfig<SupplierRow[]>[] = [];
    useQueryMock.mockImplementation((config) => {
      configs.push(config as MockQueryConfig<SupplierRow[]>);
      return { data: undefined };
    });

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
