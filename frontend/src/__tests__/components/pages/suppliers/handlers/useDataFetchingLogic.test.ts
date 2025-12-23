/**
 * @file useDataFetchingLogic.test.ts
 * @module __tests__/components/pages/suppliers/handlers/useDataFetchingLogic
 *
 * @summary
 * Test suite for useDataFetchingLogic hook.
 * Tests: parameter transformation, server communication preparation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDataFetchingLogic } from '../../../../../pages/suppliers/handlers/useDataFetchingLogic';
import { useSuppliersBoardData } from '../../../../../pages/suppliers/hooks/useSuppliersBoardData';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';

// Mock the useSuppliersBoardData hook
vi.mock('../../../../../pages/suppliers/hooks/useSuppliersBoardData', () => ({
  useSuppliersBoardData: vi.fn(),
}));

describe('useDataFetchingLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert 0-based pagination to 1-based for server', () => {
    // Arrange
    const mockData = {
      suppliers: [],
      loading: false,
      error: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersBoardData as any).mockReturnValue(mockData);

    const state: UseSuppliersBoardStateReturn = {
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
    };

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useDataFetchingLogic(state as any);

    // Assert
    expect(useSuppliersBoardData).toHaveBeenCalledWith(
      1, // serverPage (0 + 1)
      10, // pageSize
      'name,asc', // serverSort (default)
      '',
      false
    );
  });

  it('should apply sort from sortModel when present', () => {
    // Arrange
    const mockData = {
      suppliers: [],
      loading: false,
      error: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersBoardData as any).mockReturnValue(mockData);

    const state: UseSuppliersBoardStateReturn = {
      paginationModel: { page: 2, pageSize: 25 },
      sortModel: [{ field: 'lastContact', sort: 'desc' }],
      searchQuery: 'abc',
      showAllSuppliers: true,
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
    };

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useDataFetchingLogic(state as any);

    // Assert
    expect(useSuppliersBoardData).toHaveBeenCalledWith(
      3, // serverPage (2 + 1)
      25, // pageSize
      'lastContact,desc', // serverSort from sortModel
      'abc',
      true
    );
  });

  it('should use default sort when sortModel is empty', () => {
    // Arrange
    const mockData = {
      suppliers: [],
      loading: false,
      error: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersBoardData as any).mockReturnValue(mockData);

    const state: UseSuppliersBoardStateReturn = {
      paginationModel: { page: 1, pageSize: 15 },
      sortModel: [],
      searchQuery: 'test',
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
    };

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useDataFetchingLogic(state as any);

    // Assert
    expect(useSuppliersBoardData).toHaveBeenCalledWith(
      2,
      15,
      'name,asc', // default sort
      'test',
      false
    );
  });

  it('should pass search query to data hook', () => {
    // Arrange
    const mockData = {
      suppliers: [],
      loading: false,
      error: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersBoardData as any).mockReturnValue(mockData);

    const state: UseSuppliersBoardStateReturn = {
      paginationModel: { page: 0, pageSize: 10 },
      sortModel: [],
      searchQuery: 'acme corp',
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
    };

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useDataFetchingLogic(state as any);

    // Assert
    expect(useSuppliersBoardData).toHaveBeenCalledWith(
      1,
      10,
      'name,asc',
      'acme corp',
      false
    );
  });

  it('should pass showAllSuppliers flag to data hook', () => {
    // Arrange
    const mockData = {
      suppliers: [],
      loading: false,
      error: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersBoardData as any).mockReturnValue(mockData);

    const state: UseSuppliersBoardStateReturn = {
      paginationModel: { page: 0, pageSize: 10 },
      sortModel: [],
      searchQuery: '',
      showAllSuppliers: true,
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
    };

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useDataFetchingLogic(state as any);

    // Assert
    expect(useSuppliersBoardData).toHaveBeenCalledWith(
      1,
      10,
      'name,asc',
      '',
      true
    );
  });

  it('should combine pagination, search, sort, and showAllSuppliers', () => {
    // Arrange
    const mockData = {
      suppliers: [],
      loading: false,
      error: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersBoardData as any).mockReturnValue(mockData);

    const state: UseSuppliersBoardStateReturn = {
      paginationModel: { page: 5, pageSize: 50 },
      sortModel: [{ field: 'name', sort: 'asc' }],
      searchQuery: 'supplier',
      showAllSuppliers: true,
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
    };

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useDataFetchingLogic(state as any);

    // Assert
    expect(useSuppliersBoardData).toHaveBeenCalledWith(
      6, // serverPage (5 + 1)
      50, // pageSize
      'name,asc', // serverSort from sortModel
      'supplier',
      true
    );
  });
});
