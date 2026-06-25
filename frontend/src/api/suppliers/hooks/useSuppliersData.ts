/**
 * @file useSuppliersData.ts
 * @module api/suppliers/hooks
 *
 * @summary
 * Barrel re-export of supplier hooks — content is identical to hooks/index.ts.
 *
 * @enterprise
 * - Despite the hook-style filename, this file is a pure barrel; it contains no logic of its own.
 * - useSuppliersPageQuery is a legacy alias for useSupplierPageQuery; both are exported to avoid
 *   breaking existing consumers while the canonical name is standardized.
 */
// BUCKET: exports are identical to hooks/index.ts and no non-test file imports this; delete-or-justify later — export removal is a behavior change (B#7)

// legacy alias kept for backward compatibility
export { useSupplierPageQuery as useSuppliersPageQuery } from './useSupplierPageQuery';
export { useSupplierSearchQuery } from './useSupplierSearchQuery';
export { useSupplierByIdQuery } from './useSupplierByIdQuery';

// canonical name
export { useSupplierPageQuery } from './useSupplierPageQuery';
