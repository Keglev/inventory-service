/**
 * @file useToolbarHandlers.test.ts
 * @module __tests__/pages/inventory/useToolbarHandlers
 * 
 * @summary
 * Tests for toolbar action handlers hook.
 * Tests handleAddNew, handleEdit, handleDelete, handleAdjustQty, handleChangePrice.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useToolbarHandlers } from '../../../../pages/inventory/handlers/useToolbarHandlers';
import type { InventoryState, InventoryStateSetters } from '../../../../pages/inventory/hooks/useInventoryState';

describe('useToolbarHandlers', () => {
  const createMockState = (): InventoryState & InventoryStateSetters => ({
    // State
    q: '',
    supplierId: null,
    belowMinOnly: false,
    paginationModel: { page: 0, pageSize: 10 },
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

  it('should initialize with all handler functions', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useToolbarHandlers(mockState));

    expect(result.current.handleAddNew).toBeTypeOf('function');
    expect(result.current.handleEdit).toBeTypeOf('function');
    expect(result.current.handleDelete).toBeTypeOf('function');
    expect(result.current.handleAdjustQty).toBeTypeOf('function');
    expect(result.current.handleChangePrice).toBeTypeOf('function');
  });

  it('should call setOpenNew when handleAddNew is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useToolbarHandlers(mockState));

    result.current.handleAddNew();

    expect(mockState.setOpenNew).toHaveBeenCalledOnce();
    expect(mockState.setOpenNew).toHaveBeenCalledWith(true);
  });

  it('should call setOpenEditName when handleEdit is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useToolbarHandlers(mockState));

    result.current.handleEdit();

    expect(mockState.setOpenEditName).toHaveBeenCalledOnce();
    expect(mockState.setOpenEditName).toHaveBeenCalledWith(true);
  });

  it('should call setOpenDelete when handleDelete is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useToolbarHandlers(mockState));

    result.current.handleDelete();

    expect(mockState.setOpenDelete).toHaveBeenCalledOnce();
    expect(mockState.setOpenDelete).toHaveBeenCalledWith(true);
  });

  it('should call setOpenAdjust when handleAdjustQty is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useToolbarHandlers(mockState));

    result.current.handleAdjustQty();

    expect(mockState.setOpenAdjust).toHaveBeenCalledOnce();
    expect(mockState.setOpenAdjust).toHaveBeenCalledWith(true);
  });

  it('should call setOpenPrice when handleChangePrice is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useToolbarHandlers(mockState));

    result.current.handleChangePrice();

    expect(mockState.setOpenPrice).toHaveBeenCalledOnce();
    expect(mockState.setOpenPrice).toHaveBeenCalledWith(true);
  });

  it('should memoize handlers to avoid unnecessary re-renders', () => {
    const mockState = createMockState();
    const { result, rerender } = renderHook(() => useToolbarHandlers(mockState));

    const firstHandlers = result.current;
    rerender();
    const secondHandlers = result.current;

    // Handlers should be the same reference (memoized)
    expect(firstHandlers.handleAddNew).toBe(secondHandlers.handleAddNew);
    expect(firstHandlers.handleEdit).toBe(secondHandlers.handleEdit);
    expect(firstHandlers.handleDelete).toBe(secondHandlers.handleDelete);
    expect(firstHandlers.handleAdjustQty).toBe(secondHandlers.handleAdjustQty);
    expect(firstHandlers.handleChangePrice).toBe(secondHandlers.handleChangePrice);
  });

  it('should not call other setters when one handler is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useToolbarHandlers(mockState));

    result.current.handleAddNew();

    expect(mockState.setOpenNew).toHaveBeenCalled();
    expect(mockState.setOpenEditName).not.toHaveBeenCalled();
    expect(mockState.setOpenDelete).not.toHaveBeenCalled();
    expect(mockState.setOpenAdjust).not.toHaveBeenCalled();
    expect(mockState.setOpenPrice).not.toHaveBeenCalled();
  });

  it('should handle multiple sequential calls correctly', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useToolbarHandlers(mockState));

    result.current.handleAddNew();
    result.current.handleEdit();
    result.current.handleDelete();

    expect(mockState.setOpenNew).toHaveBeenCalledTimes(1);
    expect(mockState.setOpenEditName).toHaveBeenCalledTimes(1);
    expect(mockState.setOpenDelete).toHaveBeenCalledTimes(1);
  });
});
