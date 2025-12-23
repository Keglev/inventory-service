import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearchHandlers } from '../../../../../pages/suppliers/handlers/useSearchHandlers';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';

describe('useSearchHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockState = (): UseSuppliersBoardStateReturn => ({
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
  });

  it('should return handler functions', () => {
    // Arrange
    const state = createMockState();

    // Act
    const { result } = renderHook(() => useSearchHandlers(state));

    // Assert
    expect(result.current).toHaveProperty('handleSearchChange');
    expect(result.current).toHaveProperty('handleSearchResultSelect');
    expect(result.current).toHaveProperty('handleClearSearchSelection');
    expect(typeof result.current.handleSearchChange).toBe('function');
    expect(typeof result.current.handleSearchResultSelect).toBe('function');
    expect(typeof result.current.handleClearSearchSelection).toBe('function');
  });

  it('handleSearchChange should update search query and reset selection', () => {
    // Arrange
    const state = createMockState();
    state.paginationModel = { page: 2, pageSize: 10 };
    state.selectedId = '123';

    const { result } = renderHook(() => useSearchHandlers(state));

    // Act
    result.current.handleSearchChange('acme');

    // Assert
    expect(state.setSearchQuery).toHaveBeenCalledWith('acme');
    expect(state.setSelectedSearchResult).toHaveBeenCalledWith(null);
    expect(state.setSelectedId).toHaveBeenCalledWith(null);
    expect(state.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 10 });
  });

  it('handleSearchResultSelect should select result and update query', () => {
    // Arrange
    const supplier = { id: '123', name: 'Acme Corp' };
    const state = createMockState();
    state.paginationModel = { page: 1, pageSize: 10 };

    const { result } = renderHook(() => useSearchHandlers(state));

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.handleSearchResultSelect(supplier as any);

    // Assert
    expect(state.setSelectedSearchResult).toHaveBeenCalledWith(supplier);
    expect(state.setSelectedId).toHaveBeenCalledWith('123');
    expect(state.setSearchQuery).toHaveBeenCalledWith('Acme Corp');
    expect(state.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 10 });
  });

  it('handleClearSearchSelection should clear all search state', () => {
    // Arrange
    const state = createMockState();
    state.selectedId = '123';
    state.searchQuery = 'acme';
    state.selectedSearchResult = { id: '123', name: 'Acme Corp' };

    const { result } = renderHook(() => useSearchHandlers(state));

    // Act
    result.current.handleClearSearchSelection();

    // Assert
    expect(state.setSelectedSearchResult).toHaveBeenCalledWith(null);
    expect(state.setSelectedId).toHaveBeenCalledWith(null);
    expect(state.setSearchQuery).toHaveBeenCalledWith('');
  });

  it('handleSearchChange should handle empty search query', () => {
    // Arrange
    const state = createMockState();
    state.paginationModel = { page: 1, pageSize: 10 };
    state.selectedId = '123';
    state.searchQuery = 'test';

    const { result } = renderHook(() => useSearchHandlers(state));

    // Act
    result.current.handleSearchChange('');

    // Assert
    expect(state.setSearchQuery).toHaveBeenCalledWith('');
    expect(state.setSelectedSearchResult).toHaveBeenCalledWith(null);
    expect(state.setSelectedId).toHaveBeenCalledWith(null);
  });

  it('handleSearchResultSelect should handle supplier with empty name', () => {
    // Arrange
    const supplier = { id: '456', name: '' };
    const state = createMockState();

    const { result } = renderHook(() => useSearchHandlers(state));

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.handleSearchResultSelect(supplier as any);

    // Assert
    expect(state.setSelectedId).toHaveBeenCalledWith('456');
    expect(state.setSearchQuery).toHaveBeenCalledWith('');
  });

  it('handleSearchResultSelect should handle supplier with null name', () => {
    // Arrange
    const supplier = { id: '789', name: null };
    const state = createMockState();

    const { result } = renderHook(() => useSearchHandlers(state));

    // Act
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result.current.handleSearchResultSelect(supplier as any);

    // Assert
    expect(state.setSelectedId).toHaveBeenCalledWith('789');
    expect(state.setSearchQuery).toHaveBeenCalledWith('');
  });
});
