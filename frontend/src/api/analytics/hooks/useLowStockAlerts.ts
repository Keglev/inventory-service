/**
 * @file useLowStockAlerts.ts
 * @module api/analytics/hooks
 *
 * @summary
 * Low-stock and inventory frequency hooks for alert and monitoring features.
 * Provides hooks for identifying low-stock items and analyzing item update patterns.
 *
 * @enterprise
 * - Consistent 5-minute cache strategy for alert data
 * - Supplier-specific filtering support
 * - Conditional fetching with supplier validation
 * - Full TypeDoc documentation for monitoring queries
 */

import { useQuery } from '@tanstack/react-query';
import {
  getItemUpdateFrequency,
  getLowStockItems,
} from '../index';

/**
 * Hook to load item update frequency for a supplier.
 * Shows which items are modified most frequently.
 *
 * @param supplierId - Supplier to analyze
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with frequency data per item
 *
 * @example
 * ```typescript
 * const { data: frequencies } = useItemFrequencyQuery('SUP-001');
 *
 * return <Table data={frequencies} />;
 * ```
 */
export function useItemFrequencyQuery(supplierId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'item-frequency', supplierId],
    queryFn: () => getItemUpdateFrequency(supplierId),
    enabled: enabled && !!supplierId,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}

/**
 * Hook to load items below minimum stock threshold.
 * Useful for inventory planning and alerts.
 *
 * @param supplierId - Supplier to check
 * @param enabled - Whether to fetch (defaults to true)
 * @returns React Query result with low stock items
 *
 * @example
 * ```typescript
 * const { data: lowStockItems } = useLowStockQuery('SUP-001');
 *
 * return <AlertTable data={lowStockItems} />;
 * ```
 */
export function useLowStockQuery(supplierId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['analytics', 'low-stock-items', supplierId],
    queryFn: () => getLowStockItems(supplierId),
    enabled: enabled && !!supplierId,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
}
