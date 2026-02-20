/**
 * @file useDataFetchingLogic.test.ts
 * @module __tests__/components/pages/suppliers/handlers/useDataFetchingLogic
 * @description Contract tests for `useDataFetchingLogic`.
 *
 * Contract under test:
 * - Converts UI board state into server parameters for `useSuppliersBoardData`.
 *   - Pagination: 0-based UI → 1-based server (`page + 1`).
 *   - Sorting: first `sortModel` entry → `field,dir` string; default `name,asc`.
 *   - Forwards `searchQuery` and `showAllSuppliers` unchanged.
 *
 * Out of scope:
 * - React Query behavior and API calls inside `useSuppliersBoardData`.
 * - Any memoization/performance concerns (this hook is a thin adapter).
 *
 * Test strategy:
 * - Mock `useSuppliersBoardData` and assert it is called with correct transformed params.
 * - Use `renderHook` to keep hook usage valid under React's rules.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDataFetchingLogic } from '../../../../../pages/suppliers/handlers/useDataFetchingLogic';
import {
  useSuppliersBoardData,
  type SuppliersBoardData,
} from '../../../../../pages/suppliers/hooks/useSuppliersBoardData';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';

vi.mock('../../../../../pages/suppliers/hooks/useSuppliersBoardData', () => ({
  // This dependency is treated as an integration boundary.
  useSuppliersBoardData: vi.fn(),
}));

const emptyData: SuppliersBoardData = {
  suppliers: [],
  total: 0,
  searchResults: [],
  isLoadingSuppliers: false,
  isLoadingSearch: false,
  error: null,
};

const createState = (overrides: Partial<UseSuppliersBoardStateReturn> = {}): UseSuppliersBoardStateReturn => ({
  paginationModel: { page: 0, pageSize: 10 },
  sortModel: [],
  searchQuery: '',
  showAllSuppliers: false,
  selectedId: null,
  selectedSearchResult: null,
  openCreate: false,
  openEdit: false,
  openDelete: false,
  setOpenCreate: vi.fn(),
  setOpenEdit: vi.fn(),
  setOpenDelete: vi.fn(),
  setSearchQuery: vi.fn(),
  setSelectedSearchResult: vi.fn(),
  setSelectedId: vi.fn(),
  setPaginationModel: vi.fn(),
  setSortModel: vi.fn(),
  setShowAllSuppliers: vi.fn(),
  ...overrides,
});

describe('useDataFetchingLogic', () => {
  const mockUseSuppliersBoardData = vi.mocked(useSuppliersBoardData);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSuppliersBoardData.mockReturnValue(emptyData);
  });

  it.each([
    {
      name: 'converts 0-based pagination to 1-based for server',
      state: createState({ paginationModel: { page: 0, pageSize: 10 } }),
      expected: [1, 10, 'name,asc', '', false] as const,
    },
    {
      name: 'formats sort from sortModel when present',
      state: createState({
        paginationModel: { page: 2, pageSize: 25 },
        sortModel: [{ field: 'lastContact', sort: 'desc' }],
        searchQuery: 'abc',
        showAllSuppliers: true,
      }),
      expected: [3, 25, 'lastContact,desc', 'abc', true] as const,
    },
    {
      name: 'defaults sort direction to asc when sort is missing',
      state: createState({
        paginationModel: { page: 1, pageSize: 15 },
        // `GridSortItem.sort` is required but can be null; the hook must normalize it.
        sortModel: [{ field: 'name', sort: null }],
        searchQuery: 'test',
      }),
      expected: [2, 15, 'name,asc', 'test', false] as const,
    },
    {
      name: 'passes searchQuery and showAllSuppliers through unchanged',
      state: createState({
        paginationModel: { page: 5, pageSize: 50 },
        searchQuery: 'supplier',
        showAllSuppliers: true,
      }),
      expected: [6, 50, 'name,asc', 'supplier', true] as const,
    },
  ])('$name', ({ state, expected }) => {
    renderHook(() => useDataFetchingLogic(state));
    expect(mockUseSuppliersBoardData).toHaveBeenCalledWith(...expected);
  });
});
