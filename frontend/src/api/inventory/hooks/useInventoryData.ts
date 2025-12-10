/**
 * @file useInventoryData.ts
 * @module api/inventory/hooks
 *
 * @summary
 * Barrel export for inventory data fetching hooks.
 * Provides unified interface for supplier loading, item search, and item details queries.
 *
 * @enterprise
 * - Single import location for all inventory hooks
 * - Backward compatible with existing imports (no changes needed in consuming files)
 * - Clear separation of concerns across hook modules
 * - Consistent caching strategy: 5min suppliers, 30s items
 * - Performance optimized with conditional enabling
 * - Comprehensive TypeDoc documentation
 *
 * @backend_limitation
 * The /api/inventory search endpoint doesn't properly filter by supplierId parameter,
 * so `useItemSearchQuery` applies client-side filtering to ensure supplier isolation.
 *
 * @usage
 * ```typescript
 * import { useSuppliersQuery, useItemSearchQuery, useItemDetailsQuery } from '@/api/inventory/hooks';
 *
 * const suppliers = useSuppliersQuery(dialogOpen);
 * const items = useItemSearchQuery(selectedSupplier, searchQuery);
 * const itemDetails = useItemDetailsQuery(selectedItem?.id);
 * ```
 */

// Supplier selection hook
export { useSuppliersQuery } from './useSuppliersQuery';

// Item search with client-side supplier filtering
export { useItemSearchQuery } from './useItemSearchQuery';

// Item details for forms and dialogs
export { useItemDetailsQuery } from './useItemDetailsQuery';
