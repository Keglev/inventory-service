/**
 * @file useStockAnalytics.test.tsx
 * @module __tests__/unit/api/analytics/hooks/useStockAnalytics
 * @what_is_under_test useStockValueQuery, useMonthlyMovementQuery, useStockPerSupplierQuery hooks
 * @responsibility
 * - Delegates to analytics API functions with the expected params contract
 * - Gates fetch behavior behind an explicit enabled flag
 * - Exposes React Query success state when dependencies resolve
 * @out_of_scope
 * - Stock-health calculations and business logic correctness (turnover/reorder rules)
 * - Backend aggregation semantics, warehouse/location constraints, and forecasting
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { createReactQueryWrapper } from '../../../utils/reactQueryTestUtils';

import type { AnalyticsParams, StockMovementParams } from '../../../../../api/analytics/validation';

vi.mock('../../../../../api/analytics', () => ({
  getStockValueOverTime: vi.fn(),
  getMonthlyStockMovement: vi.fn(),
  getStockPerSupplier: vi.fn(),
}));

import {
  getStockValueOverTime,
  getMonthlyStockMovement,
  getStockPerSupplier,
} from '../../../../../api/analytics';

import {
  useStockValueQuery,
  useMonthlyMovementQuery,
  useStockPerSupplierQuery,
} from '../../../../../api/analytics/hooks/useStockAnalytics';

describe('useStockAnalytics hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('useStockValueQuery calls getStockValueOverTime with AnalyticsParams', async () => {
    // Arrange
    vi.mocked(getStockValueOverTime).mockResolvedValue([] as never);

    const wrapper = createReactQueryWrapper({ retry: false });

    const params: AnalyticsParams = {
      from: '2025-10-01',
      to: '2025-10-31',
      supplierId: 'SUP-001',
    };

    // Act
    const { result } = renderHook(() => useStockValueQuery(params, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(getStockValueOverTime).toHaveBeenCalledTimes(1);
    expect(getStockValueOverTime).toHaveBeenCalledWith(params);
  });

  it('useMonthlyMovementQuery calls getMonthlyStockMovement with StockMovementParams', async () => {
    // Arrange
    vi.mocked(getMonthlyStockMovement).mockResolvedValue([] as never);

    const wrapper = createReactQueryWrapper({ retry: false });

    const params: StockMovementParams = {
      start: '2025-10-01',
      end: '2025-10-31',
      supplierId: 'SUP-001',
    };

    // Act
    const { result } = renderHook(() => useMonthlyMovementQuery(params, true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(getMonthlyStockMovement).toHaveBeenCalledTimes(1);
    expect(getMonthlyStockMovement).toHaveBeenCalledWith(params);
  });

  it('useStockPerSupplierQuery calls getStockPerSupplier', async () => {
    // Arrange
    vi.mocked(getStockPerSupplier).mockResolvedValue([] as never);

    const wrapper = createReactQueryWrapper({ retry: false });

    // Act
    const { result } = renderHook(() => useStockPerSupplierQuery(true), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert
    expect(getStockPerSupplier).toHaveBeenCalledTimes(1);
  });

  it('does not fetch when enabled=false', async () => {
    // Arrange
    const wrapper = createReactQueryWrapper({ retry: false });

    const valueParams: AnalyticsParams = { from: '2025-10-01', to: '2025-10-31' };
    const moveParams: StockMovementParams = { start: '2025-10-01', end: '2025-10-31' };

    // Act
    renderHook(() => useStockValueQuery(valueParams, false), { wrapper });
    renderHook(() => useMonthlyMovementQuery(moveParams, false), { wrapper });
    renderHook(() => useStockPerSupplierQuery(false), { wrapper });

    await Promise.resolve();

    // Assert
    expect(getStockValueOverTime).not.toHaveBeenCalled();
    expect(getMonthlyStockMovement).not.toHaveBeenCalled();
    expect(getStockPerSupplier).not.toHaveBeenCalled();
  });
});
