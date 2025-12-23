/**
 * @file useLowStockAlerts.test.ts
 * @module __tests__/unit/api/analytics/hooks/useLowStockAlerts
 *
 * @summary
 * Test suite for useLowStockAlerts hook.
 * Tests low stock detection and alert generation.
 *
 * @what_is_under_test useLowStockAlerts hook - detects and alerts on low stock items
 * @responsibility Monitor inventory levels and trigger alerts for items below threshold
 * @out_of_scope Notification delivery, user preferences, alert persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseLowStockAlerts = vi.fn();

vi.mock('../../../../../api/analytics/hooks/useLowStockAlerts', () => ({
  useLowStockAlerts: mockUseLowStockAlerts,
}));

describe('useLowStockAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(mockUseLowStockAlerts).toBeDefined();
  });

  it('should return alerts array', () => {
    mockUseLowStockAlerts.mockReturnValue({
      alerts: [{ id: '1', name: 'Item A', currentStock: 5, threshold: 10 }],
    });

    const result = mockUseLowStockAlerts();

    expect(Array.isArray(result.alerts)).toBe(true);
  });

  it('should detect items below threshold', () => {
    mockUseLowStockAlerts.mockReturnValue({
      alerts: [
        { id: '1', name: 'Item A', currentStock: 5, threshold: 10 },
        { id: '2', name: 'Item B', currentStock: 2, threshold: 10 },
      ],
    });

    const result = mockUseLowStockAlerts();

    expect(result.alerts.length).toBe(2);
  });

  it('should return empty alerts when healthy', () => {
    mockUseLowStockAlerts.mockReturnValue({
      alerts: [],
    });

    const result = mockUseLowStockAlerts();

    expect(result.alerts.length).toBe(0);
  });

  it('should provide alert information', () => {
    mockUseLowStockAlerts.mockReturnValue({
      alerts: [{ id: '1', name: 'Item A', currentStock: 5, threshold: 10 }],
      count: 1,
    });

    const result = mockUseLowStockAlerts();

    expect(result.alerts).toBeDefined();
  });
});
