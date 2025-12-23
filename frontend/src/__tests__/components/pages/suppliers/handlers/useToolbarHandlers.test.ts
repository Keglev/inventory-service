/**
 * @file useToolbarHandlers.test.ts
 * @module __tests__/components/pages/suppliers/handlers/useToolbarHandlers
 *
 * @summary
 * Test suite for useToolbarHandlers hook.
 * Tests: Create, Edit, Delete button click handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useToolbarHandlers } from '../../../../../pages/suppliers/handlers/useToolbarHandlers';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';

describe('useToolbarHandlers', () => {
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
    const { result } = renderHook(() => useToolbarHandlers(state));

    // Assert
    expect(result.current).toHaveProperty('handleAddNew');
    expect(result.current).toHaveProperty('handleEdit');
    expect(result.current).toHaveProperty('handleDelete');
    expect(typeof result.current.handleAddNew).toBe('function');
    expect(typeof result.current.handleEdit).toBe('function');
    expect(typeof result.current.handleDelete).toBe('function');
  });

  it('handleAddNew should open create dialog', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useToolbarHandlers(state));

    // Act
    result.current.handleAddNew();

    // Assert
    expect(state.setOpenCreate).toHaveBeenCalledWith(true);
  });

  it('handleEdit should open edit dialog', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useToolbarHandlers(state));

    // Act
    result.current.handleEdit();

    // Assert
    expect(state.setOpenEdit).toHaveBeenCalledWith(true);
  });

  it('handleDelete should open delete dialog', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useToolbarHandlers(state));

    // Act
    result.current.handleDelete();

    // Assert
    expect(state.setOpenDelete).toHaveBeenCalledWith(true);
  });

  it('should handle multiple calls to handlers', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useToolbarHandlers(state));

    // Act
    result.current.handleAddNew();
    result.current.handleAddNew();
    result.current.handleEdit();
    result.current.handleDelete();

    // Assert
    expect(state.setOpenCreate).toHaveBeenCalledTimes(2);
    expect(state.setOpenEdit).toHaveBeenCalledTimes(1);
    expect(state.setOpenDelete).toHaveBeenCalledTimes(1);
  });

  it('should accept state parameter and use its setters', () => {
    // Arrange
    const state = createMockState();
    state.selectedId = '123';

    // Act
    const { result } = renderHook(() => useToolbarHandlers(state));

    // Assert
    expect(result.current).toBeDefined();
    result.current.handleAddNew();
    expect(state.setOpenCreate).toHaveBeenCalledWith(true);
  });

  it('handleAddNew should only call setOpenCreate, not other setters', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useToolbarHandlers(state));

    // Act
    result.current.handleAddNew();

    // Assert
    expect(state.setOpenCreate).toHaveBeenCalledWith(true);
    expect(state.setOpenEdit).not.toHaveBeenCalled();
    expect(state.setOpenDelete).not.toHaveBeenCalled();
  });

  it('handleEdit should only call setOpenEdit, not other setters', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useToolbarHandlers(state));

    // Act
    result.current.handleEdit();

    // Assert
    expect(state.setOpenEdit).toHaveBeenCalledWith(true);
    expect(state.setOpenCreate).not.toHaveBeenCalled();
    expect(state.setOpenDelete).not.toHaveBeenCalled();
  });

  it('handleDelete should only call setOpenDelete, not other setters', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useToolbarHandlers(state));

    // Act
    result.current.handleDelete();

    // Assert
    expect(state.setOpenDelete).toHaveBeenCalledWith(true);
    expect(state.setOpenCreate).not.toHaveBeenCalled();
    expect(state.setOpenEdit).not.toHaveBeenCalled();
  });
});
