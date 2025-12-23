/**
 * @file useDashboardMetrics.test.tsx
 * @module __tests__/unit/api/analytics/hooks/useDashboardMetrics
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // fail fast in tests
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and returns KPI metrics', async () => {
    vi.mocked(getItemCount).mockResolvedValue(1000);
    vi.mocked(getSupplierCount).mockResolvedValue(25);
    vi.mocked(getLowStockCount).mockResolvedValue(50);

    const wrapper = createWrapper();

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
    const wrapper = createWrapper();

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

    const wrapper = createWrapper();

    const { result } = renderHook(() => useDashboardMetrics(true), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
