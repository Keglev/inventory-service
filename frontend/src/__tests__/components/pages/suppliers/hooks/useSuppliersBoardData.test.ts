/**
 * @file useSuppliersBoardData.test.ts
 * @module __tests__/components/pages/suppliers/hooks/useSuppliersBoardData
 * @description Contract tests for the `useSuppliersBoardData` orchestration hook.
 *
 * Contract under test:
 * - Calls the supplier list query (no page or sort); no search request exists.
 * - Projects query results into the simplified view model consumed by the board.
 * - Matches the search text against the loaded list (anywhere in the name,
 *   case-insensitive, at least 2 characters).
 * - Surfaces errors as a user-friendly message string.
 *
 * Out of scope:
 * - React Query behavior and caching semantics (owned by React Query).
 * - Network/API correctness (owned by API layer tests).
 *
 * Test strategy:
 * - Mock the query hooks deterministically (hoisted, typed).
 * - Centralize unavoidable React Query return-shape casting in helpers.
 * - Use table-driven cases to keep coverage explicit without inflating LOC.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSuppliersBoardData } from '@/pages/suppliers/hooks/useSuppliersBoardData';
import { useSupplierListQuery } from '@/api/suppliers/hooks/useSupplierListQuery';
import type { SupplierRow } from '@/api/suppliers/types';

const mocks = vi.hoisted(() => ({
  useSupplierListQuery: vi.fn<typeof useSupplierListQuery>(),
}));

vi.mock('@/api/suppliers/hooks/useSupplierListQuery', () => ({
  useSupplierListQuery: mocks.useSupplierListQuery,
}));

type SupplierListQueryReturn = ReturnType<typeof useSupplierListQuery>;
type SupplierListQueryOverrides = Omit<Partial<SupplierListQueryReturn>, 'data'> & {
  data?: SupplierRow[] | null;
};

// Fixture builder: minimal SupplierRow with sensible defaults.
const supplierRow = (overrides: Partial<SupplierRow> = {}): SupplierRow => ({
  id: '1',
  name: 'Acme Corp',
  contactName: 'John Doe',
  email: 'john@acme.example',
  phone: '123-456-7890',
  createdBy: 'admin',
  createdAt: '2024-01-01T10:00:00Z',
  ...overrides,
});

/**
 * React Query result types are large; the hook under test only reads a small subset.
 * We centralize the (unavoidable) cast here to keep test bodies strict and clean.
 */
const mockSupplierListQuery = (
  overrides: SupplierListQueryOverrides = {}
) => {
  mocks.useSupplierListQuery.mockReturnValue(
    ({
      data: null,
      isLoading: false,
      error: null,
      ...overrides,
    } as unknown) as SupplierListQueryReturn
  );
};

describe('useSuppliersBoardData', () => {
  const mockSuppliers: SupplierRow[] = [
    supplierRow(),
    supplierRow({
      id: '2',
      name: 'Tech Supplies Inc',
      contactName: 'Jane Smith',
      email: 'jane@techsupplies.example',
      phone: '098-765-4321',
      createdAt: '2024-02-01T10:00:00Z',
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupplierListQuery();
  });

  it('projects the full supplier list from the list query', () => {
    mockSupplierListQuery({ data: mockSuppliers });

    const { result } = renderHook(() => useSuppliersBoardData(''));

    expect(result.current.suppliers).toEqual(mockSuppliers);
    expect(result.current.isLoadingSuppliers).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('matches the search text against the loaded list', () => {
    mockSupplierListQuery({ data: mockSuppliers });

    // "supp" sits inside "Tech Supplies Inc", in another case.
    const { result } = renderHook(() => useSuppliersBoardData('SUPP'));

    expect(result.current.searchResults).toEqual([mockSuppliers[1]]);
    expect(result.current.isLoadingSearch).toBe(false);
  });

  it('matches nothing below two characters', () => {
    mockSupplierListQuery({ data: mockSuppliers });

    const { result } = renderHook(() => useSuppliersBoardData(' a '));

    expect(result.current.searchResults).toEqual([]);
  });

  it.each([
    {
      name: 'suppliers loading',
      arrange: () => mockSupplierListQuery({ isLoading: true }),
      assert: (value: ReturnType<typeof useSuppliersBoardData>) => {
        expect(value.isLoadingSuppliers).toBe(true);
        expect(value.suppliers).toEqual([]);
      },
    },
    {
      name: 'search waits for the list',
      arrange: () => mockSupplierListQuery({ isLoading: true }),
      assert: (value: ReturnType<typeof useSuppliersBoardData>) => {
        expect(value.isLoadingSearch).toBe(true);
        expect(value.searchResults).toEqual([]);
      },
    },
    {
      name: 'error is exposed as message string',
      arrange: () => mockSupplierListQuery({ error: new Error('Failed to fetch suppliers') }),
      assert: (value: ReturnType<typeof useSuppliersBoardData>) => {
        expect(value.error).toBe('Failed to fetch suppliers');
        expect(value.suppliers).toEqual([]);
      },
    },
    {
      name: 'null query data falls back to empty projections',
      arrange: () => mockSupplierListQuery({ data: null }),
      assert: (value: ReturnType<typeof useSuppliersBoardData>) => {
        expect(value.suppliers).toEqual([]);
        expect(value.searchResults).toEqual([]);
      },
    },
  ])('$name', ({ arrange, assert }) => {
    arrange();

    const { result } = renderHook(() => useSuppliersBoardData('test'));

    assert(result.current);
  });

  it('requests the full list without page, sort or search arguments', () => {
    renderHook(() => useSuppliersBoardData('test'));

    expect(mocks.useSupplierListQuery).toHaveBeenCalledWith();
  });
});
