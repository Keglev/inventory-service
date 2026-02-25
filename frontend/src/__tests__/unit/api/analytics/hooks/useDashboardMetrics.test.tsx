/**
 * @file useDashboardMetrics.test.tsx
 * @module __tests__/unit/api/analytics/hooks/useDashboardMetrics
 * @what_is_under_test useDashboardMetrics hook
 * @responsibility
 * - Aggregates KPI counts into a single query result when enabled
 * - Prevents any network-facing calls when disabled
 * - Surfaces an error state when a dependency fails
 * @out_of_scope
 * - Backend response semantics (HTTP, serialization, auth)
 * - React Query cache invalidation and retry strategies beyond deterministic test settings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { createReactQueryWrapper } from '../../../utils/reactQueryTestUtils';

// ✅ Mock what the hook imports: ../index from hooks => api/analytics/index.ts
vi.mock('../../../../../api/analytics', () => ({
  getItemCount: vi.fn(),
  getSupplierCount: vi.fn(),
  getLowStockCount: vi.fn(),
}));

import {
  getItemCount,
  getSupplierCount,
  getLowStockCount,
} from '../../../../../api/analytics';

import { useDashboardMetrics } from '../../../../../api/analytics/hooks/useDashboardMetrics';

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns KPI metrics', async () => {
    // Arrange
    vi.mocked(getItemCount).mockResolvedValue(1000);
    vi.mocked(getSupplierCount).mockResolvedValue(25);
    vi.mocked(getLowStockCount).mockResolvedValue(50);

    const wrapper = createReactQueryWrapper({ retry: false });

    // Act
    const { result } = renderHook(() => useDashboardMetrics(true), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Assert
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
    // Arrange
    const wrapper = createReactQueryWrapper({ retry: false });

    // Act
    renderHook(() => useDashboardMetrics(false), { wrapper });

    // allow microtasks/react-query scheduling
    await Promise.resolve();

    // Assert
    expect(getItemCount).not.toHaveBeenCalled();
    expect(getSupplierCount).not.toHaveBeenCalled();
    expect(getLowStockCount).not.toHaveBeenCalled();
  });

  it('exposes error state when a dependency rejects', async () => {
    // Arrange
    vi.mocked(getItemCount).mockRejectedValue(new Error('boom'));
    vi.mocked(getSupplierCount).mockResolvedValue(25);
    vi.mocked(getLowStockCount).mockResolvedValue(50);

    const wrapper = createReactQueryWrapper({ retry: false });

    // Act
    const { result } = renderHook(() => useDashboardMetrics(true), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Assert
    expect(result.current.error).toBeDefined();
  });
});
