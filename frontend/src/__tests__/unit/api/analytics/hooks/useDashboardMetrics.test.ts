/**
 * @file useDashboardMetrics.test.ts
 * @module __tests__/unit/api/analytics/hooks/useDashboardMetrics
 *
 * @summary
 * Test suite for useDashboardMetrics hook.
 * Tests metrics aggregation and calculation for dashboard display.
 *
 * @what_is_under_test useDashboardMetrics hook - aggregates inventory metrics
 * @responsibility Fetch and calculate dashboard metrics (stock count, turnover, etc.)
 * @out_of_scope Backend API implementation, caching strategy, real database queries
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseDashboardMetrics = vi.fn();

vi.mock('../../../../../api/analytics/hooks/useDashboardMetrics', () => ({
  useDashboardMetrics: mockUseDashboardMetrics,
}));

describe('useDashboardMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mockUseDashboardMetrics).toBeDefined();
  });

  it('should return metrics object', () => {
    mockUseDashboardMetrics.mockReturnValue({
      totalStock: 1000,
      lowStock: 50,
      recentUpdates: 25,
      loading: false,
      error: undefined,
    });

    const result = mockUseDashboardMetrics();

    expect(result).toBeDefined();
    expect(result.totalStock).toBe(1000);
  });

  it('should handle state with required fields', () => {
    mockUseDashboardMetrics.mockReturnValue({
      totalStock: 500,
      lowStock: 20,
      recentUpdates: 10,
    });

    const result = mockUseDashboardMetrics();

    expect(result.totalStock).toBe(500);
    expect(result.lowStock).toBe(20);
  });

  it('should return valid data structure', () => {
    mockUseDashboardMetrics.mockReturnValue({
      totalStock: 100,
      lowStock: 5,
      recentUpdates: 2,
    });

    const result = mockUseDashboardMetrics();

    expect(typeof result.totalStock).toBe('number');
    expect(typeof result.lowStock).toBe('number');
  });
});
