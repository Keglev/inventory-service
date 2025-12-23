/**
 * @file useSuppliersBoardState.test.ts
 * @module __tests__/pages/suppliers/hooks/useSuppliersBoardState
 *
 * @summary
 * Test suite for useSuppliersBoardState hook.
 * Tests: state initialization, setters, pagination, sorting, search, dialogs.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSuppliersBoardState } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';
import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';

describe('useSuppliersBoardState', () => {
  it('should initialize with default values', () => {
    // Act
    const { result } = renderHook(() => useSuppliersBoardState());

    // Assert
    expect(result.current.searchQuery).toBe('');
    expect(result.current.showAllSuppliers).toBe(false);
    expect(result.current.paginationModel).toEqual({ page: 0, pageSize: 6 });
    expect(result.current.sortModel).toEqual([{ field: 'name', sort: 'asc' }]);
    expect(result.current.selectedId).toBeNull();
    expect(result.current.selectedSearchResult).toBeNull();
    expect(result.current.openCreate).toBe(false);
    expect(result.current.openEdit).toBe(false);
    expect(result.current.openDelete).toBe(false);
  });

  it('should update search query', () => {
    // Arrange
    const { result } = renderHook(() => useSuppliersBoardState());

    // Act
    act(() => {
      result.current.setSearchQuery('acme corp');
    });

    // Assert
    expect(result.current.searchQuery).toBe('acme corp');
  });

  it('should update showAllSuppliers flag', () => {
    // Arrange
    const { result } = renderHook(() => useSuppliersBoardState());

    // Act
    act(() => {
      result.current.setShowAllSuppliers(true);
    });

    // Assert
    expect(result.current.showAllSuppliers).toBe(true);
  });

  it('should update pagination model', () => {
    // Arrange
    const { result } = renderHook(() => useSuppliersBoardState());
    const newPaginationModel: GridPaginationModel = { page: 2, pageSize: 15 };

    // Act
    act(() => {
      result.current.setPaginationModel(newPaginationModel);
    });

    // Assert
    expect(result.current.paginationModel).toEqual(newPaginationModel);
  });

  it('should update sort model', () => {
    // Arrange
    const { result } = renderHook(() => useSuppliersBoardState());
    const newSortModel: GridSortModel = [{ field: 'lastContact', sort: 'desc' }];

    // Act
    act(() => {
      result.current.setSortModel(newSortModel);
    });

    // Assert
    expect(result.current.sortModel).toEqual(newSortModel);
  });

  it('should update selected ID', () => {
    // Arrange
    const { result } = renderHook(() => useSuppliersBoardState());
    const testId = 'supplier-123';

    // Act
    act(() => {
      result.current.setSelectedId(testId);
    });

    // Assert
    expect(result.current.selectedId).toBe(testId);
  });

  it('should clear selected ID', () => {
    // Arrange
    const { result } = renderHook(() => useSuppliersBoardState());

    // Act
    act(() => {
      result.current.setSelectedId('supplier-123');
    });
    act(() => {
      result.current.setSelectedId(null);
    });

    // Assert
    expect(result.current.selectedId).toBeNull();
  });

  it('should toggle create dialog', () => {
    // Arrange
    const { result } = renderHook(() => useSuppliersBoardState());

    // Act
    act(() => {
      result.current.setOpenCreate(true);
    });

    // Assert
    expect(result.current.openCreate).toBe(true);

    // Act
    act(() => {
      result.current.setOpenCreate(false);
    });

    // Assert
    expect(result.current.openCreate).toBe(false);
  });

  it('should toggle edit dialog', () => {
    // Arrange
    const { result } = renderHook(() => useSuppliersBoardState());

    // Act
    act(() => {
      result.current.setOpenEdit(true);
    });

    // Assert
    expect(result.current.openEdit).toBe(true);

    // Act
    act(() => {
      result.current.setOpenEdit(false);
    });

    // Assert
    expect(result.current.openEdit).toBe(false);
  });

  it('should toggle delete dialog', () => {
    // Arrange
    const { result } = renderHook(() => useSuppliersBoardState());

    // Act
    act(() => {
      result.current.setOpenDelete(true);
    });

    // Assert
    expect(result.current.openDelete).toBe(true);

    // Act
    act(() => {
      result.current.setOpenDelete(false);
    });

    // Assert
    expect(result.current.openDelete).toBe(false);
  });

  it('should update multiple state properties independently', () => {
    // Arrange
    const { result } = renderHook(() => useSuppliersBoardState());
    const newPaginationModel: GridPaginationModel = { page: 1, pageSize: 20 };
    const newSortModel: GridSortModel = [{ field: 'name', sort: 'desc' }];

    // Act
    act(() => {
      result.current.setSearchQuery('test query');
      result.current.setPaginationModel(newPaginationModel);
      result.current.setSortModel(newSortModel);
      result.current.setOpenCreate(true);
    });

    // Assert
    expect(result.current.searchQuery).toBe('test query');
    expect(result.current.paginationModel).toEqual(newPaginationModel);
    expect(result.current.sortModel).toEqual(newSortModel);
    expect(result.current.openCreate).toBe(true);
    expect(result.current.showAllSuppliers).toBe(false); // unchanged
  });
});
