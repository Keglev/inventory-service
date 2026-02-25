/**
 * @file useLowStockAlerts.test.tsx
 * @module __tests__/unit/api/analytics/hooks/useLowStockAlerts
 * @what_is_under_test useItemFrequencyQuery and useLowStockQuery hooks
 * @responsibility
 * - Gates queries on supplier identity and an explicit enabled flag
 * - Delegates to analytics API functions with the supplierId contract
 * - Exposes React Query success state when dependencies resolve
 * @out_of_scope
 * - Threshold logic, alert messaging, and user notification delivery
 * - Backend filtering/sorting semantics and payload validation
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

import { createReactQueryWrapper } from '../../../utils/reactQueryTestUtils';

//  Mock the API functions the hooks call (they import from ../index => api/analytics/index.ts)
vi.mock('../../../../../api/analytics', () => ({
  getItemUpdateFrequency: vi.fn(),
  getLowStockItems: vi.fn(),
}));

import {
  getItemUpdateFrequency,
  getLowStockItems,
} from '../../../../../api/analytics';

import {
  useItemFrequencyQuery,
  useLowStockQuery,
} from '../../../../../api/analytics/hooks/useLowStockAlerts';

describe('useLowStockAlerts hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useItemFrequencyQuery', () => {
    it('fetches frequency when supplierId is provided and enabled=true', async () => {
      // Arrange
      vi.mocked(getItemUpdateFrequency).mockResolvedValue([
        { itemId: 'I-1', updates: 3 },
      ] as unknown as never);

      const wrapper = createReactQueryWrapper({ retry: false });

      // Act
      const { result } = renderHook(
        () => useItemFrequencyQuery('SUP-001', true),
        { wrapper }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assert
      expect(getItemUpdateFrequency).toHaveBeenCalledTimes(1);
      expect(getItemUpdateFrequency).toHaveBeenCalledWith('SUP-001');
    });

    it('does not fetch when supplierId is empty', async () => {
      // Arrange
      const wrapper = createReactQueryWrapper({ retry: false });

      // Act
      renderHook(() => useItemFrequencyQuery('', true), { wrapper });

      await Promise.resolve();

      // Assert
      expect(getItemUpdateFrequency).not.toHaveBeenCalled();
    });

    it('does not fetch when enabled=false', async () => {
      // Arrange
      const wrapper = createReactQueryWrapper({ retry: false });

      // Act
      renderHook(() => useItemFrequencyQuery('SUP-001', false), { wrapper });

      await Promise.resolve();

      // Assert
      expect(getItemUpdateFrequency).not.toHaveBeenCalled();
    });
  });

  describe('useLowStockQuery', () => {
    it('fetches low stock items when supplierId is provided and enabled=true', async () => {
      // Arrange
      vi.mocked(getLowStockItems).mockResolvedValue([
        { id: 'ITEM-1', name: 'Item A', onHand: 2, minQty: 5 },
      ] as unknown as never);

      const wrapper = createReactQueryWrapper({ retry: false });

      // Act
      const { result } = renderHook(() => useLowStockQuery('SUP-001', true), {
        wrapper,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Assert
      expect(getLowStockItems).toHaveBeenCalledTimes(1);
      expect(getLowStockItems).toHaveBeenCalledWith('SUP-001');
    });

    it('does not fetch when supplierId is empty', async () => {
      // Arrange
      const wrapper = createReactQueryWrapper({ retry: false });

      // Act
      renderHook(() => useLowStockQuery('', true), { wrapper });

      await Promise.resolve();

      // Assert
      expect(getLowStockItems).not.toHaveBeenCalled();
    });

    it('does not fetch when enabled=false', async () => {
      // Arrange
      const wrapper = createReactQueryWrapper({ retry: false });

      // Act
      renderHook(() => useLowStockQuery('SUP-001', false), { wrapper });

      await Promise.resolve();

      // Assert
      expect(getLowStockItems).not.toHaveBeenCalled();
    });
  });
});
