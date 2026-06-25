/**
 * @file index.ts
 * @module api/suppliers/hooks
 *
 * @summary
 * Barrel export for supplier React Query hooks.
 *
 * @enterprise
 * - useSuppliersPageQuery is a legacy alias for useSupplierPageQuery; both are exported to avoid
 *   breaking existing consumers while the canonical name is standardized.
 */

// legacy alias kept for backward compatibility
export { useSupplierPageQuery as useSuppliersPageQuery } from './useSupplierPageQuery';
export { useSupplierSearchQuery } from './useSupplierSearchQuery';
export { useSupplierByIdQuery } from './useSupplierByIdQuery';

// canonical name
export { useSupplierPageQuery } from './useSupplierPageQuery';
