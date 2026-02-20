/**
 * @file useSuppliersBoardData.test.ts
 * @module __tests__/components/pages/suppliers/hooks/useSuppliersBoardData
 * @description Contract tests for the `useSuppliersBoardData` orchestration hook.
 *
 * Contract under test:
 * - Calls the supplier page query and search query hooks with the expected arguments.
 * - Projects query results into the simplified view model consumed by the board.
 * - Applies the search-query length rules (min 2 chars) consistently for both list filtering and search.
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
import { useSuppliersBoardData } from '../../../../../pages/suppliers/hooks/useSuppliersBoardData';
import {
  useSupplierSearchQuery,
  useSuppliersPageQuery,
  type SupplierListResponse,
  type SupplierRow,
} from '../../../../../api/suppliers';

const mocks = vi.hoisted(() => ({
  useSuppliersPageQuery: vi.fn<
    Parameters<typeof useSuppliersPageQuery>,
    ReturnType<typeof useSuppliersPageQuery>
  >(),
  useSupplierSearchQuery: vi.fn<
    Parameters<typeof useSupplierSearchQuery>,
    ReturnType<typeof useSupplierSearchQuery>
  >(),
}));

vi.mock('../../../../../api/suppliers', () => ({
  useSuppliersPageQuery: mocks.useSuppliersPageQuery,
  useSupplierSearchQuery: mocks.useSupplierSearchQuery,
}));

type SuppliersPageQueryReturn = ReturnType<typeof useSuppliersPageQuery>;
type SupplierSearchQueryReturn = ReturnType<typeof useSupplierSearchQuery>;
type SuppliersPageQueryOverrides = Omit<Partial<SuppliersPageQueryReturn>, 'data'> & {
  data?: SupplierListResponse | null;
};
type SupplierSearchQueryOverrides = Omit<Partial<SupplierSearchQueryReturn>, 'data'> & {
  data?: SupplierRow[] | null;
};

// Fixture builder: minimal SupplierRow with sensible defaults.
const supplierRow = (overrides: Partial<SupplierRow> = {}): SupplierRow => ({
  id: '1',
  name: 'Acme Corp',
  contactName: 'John Doe',
  email: 'john@acme.com',
  phone: '123-456-7890',
  createdBy: 'admin',
  createdAt: '2024-01-01T10:00:00Z',
  ...overrides,
});

// Fixture builder: paginated list response with defaults.
const suppliersPage = (overrides: Partial<SupplierListResponse> = {}): SupplierListResponse => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  ...overrides,
});

/**
 * React Query result types are large; the hook under test only reads a small subset.
 * We centralize the (unavoidable) cast here to keep test bodies strict and clean.
 */
const mockSuppliersPageQuery = (
  overrides: SuppliersPageQueryOverrides = {}
) => {
  mocks.useSuppliersPageQuery.mockReturnValue(
    ({
      data: null,
      isLoading: false,
      error: null,
      ...overrides,
    } as unknown) as SuppliersPageQueryReturn
  );
};

const mockSupplierSearchQuery = (
  overrides: SupplierSearchQueryOverrides = {}
) => {
  mocks.useSupplierSearchQuery.mockReturnValue(
    ({
      data: [],
      isLoading: false,
      ...overrides,
    } as unknown) as SupplierSearchQueryReturn
  );
};

describe('useSuppliersBoardData', () => {
  const mockSuppliers: SupplierRow[] = [
    supplierRow(),
    supplierRow({
      id: '2',
      name: 'Tech Supplies Inc',
      contactName: 'Jane Smith',
      email: 'jane@techsupplies.com',
      phone: '098-765-4321',
      createdAt: '2024-02-01T10:00:00Z',
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSuppliersPageQuery();
    mockSupplierSearchQuery();
  });

  it('projects supplier list + totals from the paginated query', () => {
    mockSuppliersPageQuery({
      data: suppliersPage({ items: mockSuppliers, total: mockSuppliers.length }),
    });

    const { result } = renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', '', false)
    );

    expect(result.current.suppliers).toEqual(mockSuppliers);
    expect(result.current.total).toBe(mockSuppliers.length);
    expect(result.current.isLoadingSuppliers).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('projects search results from the search query', () => {
    const searchResults = [mockSuppliers[0]];
    mockSupplierSearchQuery({ data: searchResults });

    const { result } = renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', 'acme', false)
    );

    expect(result.current.searchResults).toEqual(searchResults);
    expect(result.current.isLoadingSearch).toBe(false);
  });

  it.each([
    {
      name: 'suppliers loading',
      arrange: () => mockSuppliersPageQuery({ isLoading: true }),
      assert: (value: ReturnType<typeof useSuppliersBoardData>) => {
        expect(value.isLoadingSuppliers).toBe(true);
        expect(value.suppliers).toEqual([]);
      },
    },
    {
      name: 'search loading',
      arrange: () => mockSupplierSearchQuery({ isLoading: true }),
      assert: (value: ReturnType<typeof useSuppliersBoardData>) => {
        expect(value.isLoadingSearch).toBe(true);
        expect(value.searchResults).toEqual([]);
      },
    },
    {
      name: 'error is exposed as message string',
      arrange: () => mockSuppliersPageQuery({ error: new Error('Failed to fetch suppliers') }),
      assert: (value: ReturnType<typeof useSuppliersBoardData>) => {
        expect(value.error).toBe('Failed to fetch suppliers');
        expect(value.suppliers).toEqual([]);
      },
    },
    {
      name: 'null query data falls back to empty projections',
      arrange: () => {
        mockSuppliersPageQuery({ data: null });
        mockSupplierSearchQuery({ data: null });
      },
      assert: (value: ReturnType<typeof useSuppliersBoardData>) => {
        expect(value.suppliers).toEqual([]);
        expect(value.total).toBe(0);
        expect(value.searchResults).toEqual([]);
      },
    },
  ])('$name', ({ arrange, assert }) => {
    arrange();

    const { result } = renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', 'test', false)
    );

    assert(result.current);
  });

  it.each([
    {
      name: 'includes q when showAllSuppliers is true and query length >= 2',
      showAllSuppliers: true,
      searchQuery: 'test',
      expectedQ: 'test',
    },
    {
      name: 'omits q when showAllSuppliers is false',
      showAllSuppliers: false,
      searchQuery: 'test',
      expectedQ: undefined,
    },
    {
      name: 'omits q when query length < 2',
      showAllSuppliers: true,
      searchQuery: 't',
      expectedQ: undefined,
    },
  ])('wires pagination params ($name)', ({ showAllSuppliers, searchQuery, expectedQ }) => {
    renderHook(() =>
      useSuppliersBoardData(2, 25, 'lastContact,desc', searchQuery, showAllSuppliers)
    );

    expect(mocks.useSuppliersPageQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        pageSize: 25,
        sort: 'lastContact,desc',
        q: expectedQ,
      }),
      true
    );
  });

  it.each([
    { name: 'passes query through when length >= 2', searchQuery: 'ac', expectedQueryArg: 'ac' },
    { name: 'passes empty string when length < 2', searchQuery: 'a', expectedQueryArg: '' },
    { name: 'passes empty string when empty', searchQuery: '', expectedQueryArg: '' },
  ])('wires search query arg ($name)', ({ searchQuery, expectedQueryArg }) => {
    renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', searchQuery, true)
    );

    expect(mocks.useSupplierSearchQuery).toHaveBeenCalledWith(expectedQueryArg, true);
  });
});
