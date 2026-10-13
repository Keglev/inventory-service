/**
 * @file useLowStockRows.test.tsx
 * @module __tests__/pages/analytics/hooks/useLowStockRows
 * @description Contract tests for the low-stock derivation hook.
 *
 * Contract under test:
 * - No supplier: enabled is false and the API is never called.
 * - Deficit is `minimumQuantity - quantity` floored at 0; items at or
 *   below their minimum are kept, others dropped.
 * - Rows are ordered by deficit descending (most urgent first).
 * - `limit` caps the visible slice; `0` shows all; `total` reports the
 *   pre-cap count for the "Showing n of m" footer.
 *
 * Out of scope:
 * - Table rendering and severity chips (LowStockTable markup).
 * - HTTP behavior of getLowStockItems (unit/api/analytics/lowStock).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from '@/__tests__/test/queryClient';
import { useLowStockRows } from '@/pages/analytics/hooks/useLowStockRows';

const mockGetLowStockItems = vi.fn();
vi.mock('@/api/analytics/lowStock', () => ({
  getLowStockItems: (...args: unknown[]) => mockGetLowStockItems(...args),
}));

describe('useLowStockRows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is disabled without a supplier and never calls the API', () => {
    const { result } = renderHook(() => useLowStockRows('', 12), { wrapper: createQueryWrapper() });
    expect(result.current.enabled).toBe(false);
    expect(mockGetLowStockItems).not.toHaveBeenCalled();
  });

  it('computes deficits, drops healthy items, and orders most severe first', async () => {
    mockGetLowStockItems.mockResolvedValue([
      { itemName: 'Small gap', quantity: 4, minimumQuantity: 5 },
      { itemName: 'Healthy', quantity: 10, minimumQuantity: 5 },
      { itemName: 'Big gap', quantity: 0, minimumQuantity: 8 },
      { itemName: 'At minimum', quantity: 5, minimumQuantity: 5 },
    ]);
    const { result } = renderHook(() => useLowStockRows('sup-1', 0), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.visible.map((r) => r.itemName)).toEqual(['Big gap', 'Small gap', 'At minimum']);
    expect(result.current.visible.map((r) => r.deficit)).toEqual([8, 1, 0]);
  });

  it('caps the visible slice by limit while total reports the pre-cap count', async () => {
    mockGetLowStockItems.mockResolvedValue([
      { itemName: 'A', quantity: 0, minimumQuantity: 3 },
      { itemName: 'B', quantity: 0, minimumQuantity: 2 },
      { itemName: 'C', quantity: 0, minimumQuantity: 1 },
    ]);
    const { result } = renderHook(() => useLowStockRows('sup-1', 2), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.visible.length).toBe(2));
    expect(result.current.total).toBe(3);
    expect(result.current.visible.map((r) => r.itemName)).toEqual(['A', 'B']);
  });

  it('treats missing quantity and minimum as zero', async () => {
    mockGetLowStockItems.mockResolvedValue([{ itemName: 'Nulls', quantity: null, minimumQuantity: null }]);
    const { result } = renderHook(() => useLowStockRows('sup-1', 0), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    // 0 - 0 = deficit 0, quantity <= minimum keeps the row.
    expect(result.current.visible).toHaveLength(1);
    expect(result.current.visible[0].deficit).toBe(0);
  });

  it('requests the supplier only, without date bounds', async () => {
    mockGetLowStockItems.mockResolvedValue([]);
    renderHook(() => useLowStockRows('sup-1', 12), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(mockGetLowStockItems).toHaveBeenCalled());
    expect(mockGetLowStockItems).toHaveBeenCalledWith('sup-1');
  });
});
