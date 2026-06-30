/**
 * @module api/inventory/hooks
 *
 * Barrel for the inventory data-fetching hooks. Import the hooks from this
 * directory path (api/inventory/hooks) rather than the individual hook files
 * so the hook files can be reorganized without touching call sites. Mirrors
 * the index.ts barrel convention used by the analytics and suppliers hook
 * directories.
 *
 * Caching strategy: suppliers 5 min (useSuppliersQuery), items 30 s
 * (useItemSearchQuery, useItemDetailsQuery).
 */

export { useSuppliersQuery } from './useSuppliersQuery';

// GET /api/inventory/search accepts only `name`, not supplierId, so this hook filters by supplier client-side
export { useItemSearchQuery } from './useItemSearchQuery';

export { useItemDetailsQuery } from './useItemDetailsQuery';
