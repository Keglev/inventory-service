/**
 * @file useDashboardMetrics.test.tsx
 * @module __tests__/api/analytics/hooks/useDashboardMetrics
 * @description Contract tests for useDashboardMetrics hook.
 *
 * Contract under test:
 * - Aggregates KPI counts into a single query result when enabled
 * - Prevents any network-facing calls when disabled
 * - Surfaces an error state when a dependency fails
 *
 * Out of scope:
 * - Backend response semantics (HTTP, serialization, auth)
 * - React Query cache invalidation and retry strategies beyond
 *   deterministic test settings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';


// Mock the module the hook imports.
vi.mock('@/api/analytics/metrics', () => ({
  getItemCount: vi.fn(),
  getSupplierCount: vi.fn(),
  getLowStockCount: vi.fn(),
}));

import { getItemCount, getSupplierCount, getLowStockCount } from '@/api/analytics/metrics';

import { useDashboardMetrics } from '@/api/analytics/hooks/useDashboardMetrics';
import { createQueryWrapper } from '@/__tests__/test/queryClient';

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns KPI metrics', async () => {
    vi.mocked(getItemCount).mockResolvedValue(1000);
    vi.mocked(getSupplierCount).mockResolvedValue(25);
    vi.mocked(getLowStockCount).mockResolvedValue(50);

    const wrapper = createQueryWrapper();

    const { result } = renderHook(() => useDashboardMetrics(true), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      inventoryCount: 1000,
      suppliersCount: 25,
      lowStockCount: 50,
    });

    expect(getItemCount).toHaveBeenCalledTimes(1);
    expect(getSupplierCount).toHaveBeenCalledTimes(1);
    expect(getLowStockCount).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when enabled is false', async () => {
    const wrapper = createQueryWrapper();

    renderHook(() => useDashboardMetrics(false), { wrapper });

    // allow microtasks/react-query scheduling
    await Promise.resolve();

    expect(getItemCount).not.toHaveBeenCalled();
    expect(getSupplierCount).not.toHaveBeenCalled();
    expect(getLowStockCount).not.toHaveBeenCalled();
  });

  it('exposes error state when a dependency rejects', async () => {
    vi.mocked(getItemCount).mockRejectedValue(new Error('boom'));
    vi.mocked(getSupplierCount).mockResolvedValue(25);
    vi.mocked(getLowStockCount).mockResolvedValue(50);

    const wrapper = createQueryWrapper();

    const { result } = renderHook(() => useDashboardMetrics(true), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
