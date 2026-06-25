/**
 * @file useInventoryData.ts
 * @module api/inventory/hooks
 *
 * Barrel re-export for all inventory data-fetching hooks.
 * Import from this path so that hook files can be reorganized without touching call sites.
 *
 * Caching strategy: suppliers 5 min (`useSuppliersQuery`), items 30 s
 * (`useItemSearchQuery`, `useItemDetailsQuery`).
 */

export { useSuppliersQuery } from './useSuppliersQuery';

// GET /api/inventory/search accepts only `name`, not supplierId, so this hook filters by supplier client-side
export { useItemSearchQuery } from './useItemSearchQuery';

export { useItemDetailsQuery } from './useItemDetailsQuery';
