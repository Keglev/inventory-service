/**
 * @file useRefreshHandler.test.ts
 * @module __tests__/pages/inventory/useRefreshHandler
 * 
 * @summary
 * Tests for data refresh handler hook.
 * Tests handleReload function that triggers data refresh.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRefreshHandler } from '../../../../pages/inventory/handlers/useRefreshHandler';
import type { InventoryState, InventoryStateSetters } from '../../../../pages/inventory/hooks/useInventoryState';

describe('useRefreshHandler', () => {
  const createMockState = (): InventoryState & InventoryStateSetters => ({
    // State
    q: '',
    supplierId: null,
    belowMinOnly: false,
    paginationModel: { page: 3, pageSize: 25 },
    sortModel: [],
    selectedId: null,
    openNew: false,
    openEditName: false,
    openDelete: false,
    openEdit: false,
    openAdjust: false,
    openPrice: false,
    
    // Setters
    setQ: vi.fn(),
    setSupplierId: vi.fn(),
    setBelowMinOnly: vi.fn(),
    setPaginationModel: vi.fn(),
    setSortModel: vi.fn(),
    setSelectedId: vi.fn(),
    setOpenNew: vi.fn(),
    setOpenEditName: vi.fn(),
    setOpenDelete: vi.fn(),
    setOpenEdit: vi.fn(),
    setOpenAdjust: vi.fn(),
    setOpenPrice: vi.fn(),
  });

  it('should initialize with handleReload function', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useRefreshHandler(mockState));

    expect(result.current.handleReload).toBeTypeOf('function');
  });

  it('should reset pagination to page 0 when handleReload is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useRefreshHandler(mockState));

    result.current.handleReload();

    expect(mockState.setPaginationModel).toHaveBeenCalledOnce();
    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 25 });
  });

  it('should preserve pageSize when reloading', () => {
    const mockState = createMockState();
    mockState.paginationModel = { page: 5, pageSize: 50 };
    
    const { result } = renderHook(() => useRefreshHandler(mockState));

    result.current.handleReload();

    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 50 });
  });

  it('should work correctly when already on page 0', () => {
    const mockState = createMockState();
    mockState.paginationModel = { page: 0, pageSize: 10 };
    
    const { result } = renderHook(() => useRefreshHandler(mockState));

    result.current.handleReload();

    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 10 });
  });

  it('should memoize handler to avoid unnecessary re-renders', () => {
    const mockState = createMockState();
    const { result, rerender } = renderHook(() => useRefreshHandler(mockState));

    const firstHandler = result.current.handleReload;
    rerender();
    const secondHandler = result.current.handleReload;

    expect(firstHandler).toBe(secondHandler);
  });

  it('should handle multiple sequential reload calls', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useRefreshHandler(mockState));

    result.current.handleReload();
    result.current.handleReload();
    result.current.handleReload();

    expect(mockState.setPaginationModel).toHaveBeenCalledTimes(3);
    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 25 });
  });

  it('should not modify other state when reloading', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useRefreshHandler(mockState));

    result.current.handleReload();

    expect(mockState.setQ).not.toHaveBeenCalled();
    expect(mockState.setSupplierId).not.toHaveBeenCalled();
    expect(mockState.setBelowMinOnly).not.toHaveBeenCalled();
    expect(mockState.setSortModel).not.toHaveBeenCalled();
    expect(mockState.setSelectedId).not.toHaveBeenCalled();
  });
});
