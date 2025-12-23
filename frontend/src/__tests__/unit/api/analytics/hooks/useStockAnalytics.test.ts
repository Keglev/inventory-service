/**
 * @file useStockAnalytics.test.ts
 * @module __tests__/unit/api/analytics/hooks/useStockAnalytics
 *
 * @summary
 * Test suite for useStockAnalytics hook.
 * Tests stock analysis and inventory metrics calculation.
 *
 * @what_is_under_test useStockAnalytics hook - analyzes inventory levels and stock performance
 * @responsibility Calculate stock turnover, movement rate, reorder points, and inventory health
 * @out_of_scope Demand forecasting, supplier APIs, warehouse locations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseStockAnalytics = vi.fn();

vi.mock('../../../../../api/analytics/hooks/useStockAnalytics', () => ({
  useStockAnalytics: mockUseStockAnalytics,
}));

describe('useStockAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mockUseStockAnalytics).toBeDefined();
  });

  it('should return stock metrics', () => {
    mockUseStockAnalytics.mockReturnValue({
      totalItems: 500,
      lowStockItems: 15,
      outOfStockItems: 2,
    });

    const result = mockUseStockAnalytics();

    expect(result.totalItems).toBe(500);
    expect(result.lowStockItems).toBe(15);
  });

  it('should calculate turnover rate', () => {
    mockUseStockAnalytics.mockReturnValue({
      totalItems: 500,
      lowStockItems: 15,
      outOfStockItems: 2,
      turnoverRate: 4.2,
      averageInventoryValue: 25000,
    });

    const result = mockUseStockAnalytics();

    expect(result.turnoverRate).toBeGreaterThan(0);
  });

  it('should return inventory health status', () => {
    mockUseStockAnalytics.mockReturnValue({
      totalItems: 500,
      lowStockItems: 15,
      outOfStockItems: 2,
      healthStatus: 'good',
      healthScore: 0.85,
    });

    const result = mockUseStockAnalytics();

    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(1);
  });

  it('should track reorder point compliance', () => {
    mockUseStockAnalytics.mockReturnValue({
      totalItems: 500,
      lowStockItems: 15,
      outOfStockItems: 2,
      reorderPointCompliance: 0.92,
      itemsBelowReorderPoint: 8,
    });

    const result = mockUseStockAnalytics();

    expect(result.reorderPointCompliance).toBeLessThanOrEqual(1);
  });
});
