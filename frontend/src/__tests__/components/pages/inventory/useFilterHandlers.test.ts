/**
 * @file useFilterHandlers.test.ts
 * @module __tests__/pages/inventory/useFilterHandlers
 * 
 * @summary
 * Tests for filter panel handlers hook.
 * Tests handleSearchChange, handleSupplierChange, handleBelowMinChange.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilterHandlers } from '../../../../pages/inventory/handlers/useFilterHandlers';
import type { InventoryState, InventoryStateSetters } from '../../../../pages/inventory/hooks/useInventoryState';

describe('useFilterHandlers', () => {
  const createMockState = (): InventoryState & InventoryStateSetters => ({
    // State
    q: '',
    supplierId: null,
    belowMinOnly: false,
    paginationModel: { page: 2, pageSize: 25 },
    sortModel: [],
    selectedId: '123',
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

  it('should initialize with all handler functions', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    expect(result.current.handleSearchChange).toBeTypeOf('function');
    expect(result.current.handleSupplierChange).toBeTypeOf('function');
    expect(result.current.handleBelowMinChange).toBeTypeOf('function');
  });

  it('should call setQ when handleSearchChange is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleSearchChange('test query');

    expect(mockState.setQ).toHaveBeenCalledOnce();
    expect(mockState.setQ).toHaveBeenCalledWith('test query');
  });

  it('should handle empty search string', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleSearchChange('');

    expect(mockState.setQ).toHaveBeenCalledWith('');
  });

  it('should update supplier and reset related state when handleSupplierChange is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleSupplierChange('456');

    expect(mockState.setSupplierId).toHaveBeenCalledWith('456');
    expect(mockState.setSelectedId).toHaveBeenCalledWith(null);
    expect(mockState.setQ).toHaveBeenCalledWith('');
    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 25 });
  });

  it('should handle numeric supplierId', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleSupplierChange(789);

    expect(mockState.setSupplierId).toHaveBeenCalledWith(789);
    expect(mockState.setSelectedId).toHaveBeenCalledWith(null);
  });

  it('should handle null supplierId for "All suppliers"', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleSupplierChange(null);

    expect(mockState.setSupplierId).toHaveBeenCalledWith(null);
    expect(mockState.setSelectedId).toHaveBeenCalledWith(null);
    expect(mockState.setQ).toHaveBeenCalledWith('');
  });

  it('should preserve pageSize when resetting pagination', () => {
    const mockState = createMockState();
    mockState.paginationModel = { page: 5, pageSize: 50 };
    
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleSupplierChange('123');

    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 50 });
  });

  it('should call setBelowMinOnly when handleBelowMinChange is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleBelowMinChange(true);

    expect(mockState.setBelowMinOnly).toHaveBeenCalledWith(true);
  });

  it('should reset pagination to page 0 when toggling belowMinOnly', () => {
    const mockState = createMockState();
    mockState.paginationModel = { page: 3, pageSize: 20 };
    
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleBelowMinChange(true);

    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 20 });
  });

  it('should handle toggling belowMinOnly off', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleBelowMinChange(false);

    expect(mockState.setBelowMinOnly).toHaveBeenCalledWith(false);
  });

  it('should memoize handlers to avoid unnecessary re-renders', () => {
    const mockState = createMockState();
    const { result, rerender } = renderHook(() => useFilterHandlers(mockState));

    const firstHandlers = result.current;
    rerender();
    const secondHandlers = result.current;

    expect(firstHandlers.handleSearchChange).toBe(secondHandlers.handleSearchChange);
    expect(firstHandlers.handleSupplierChange).toBe(secondHandlers.handleSupplierChange);
    expect(firstHandlers.handleBelowMinChange).toBe(secondHandlers.handleBelowMinChange);
  });

  it('should handle multiple sequential filter changes', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useFilterHandlers(mockState));

    result.current.handleSearchChange('widget');
    result.current.handleSupplierChange('999');
    result.current.handleBelowMinChange(true);

    expect(mockState.setQ).toHaveBeenCalledWith('widget');
    expect(mockState.setSupplierId).toHaveBeenCalledWith('999');
    expect(mockState.setBelowMinOnly).toHaveBeenCalledWith(true);
  });
});
