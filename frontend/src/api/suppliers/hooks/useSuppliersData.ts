/**
 * @file useSuppliersData.ts
 * @module api/suppliers/hooks
 *
 * @summary
 * Coordinator barrel export for supplier hooks.
 * Re-exports specialized React Query hooks for supplier operations.
 *
 * @enterprise
 * - Enables focused single-responsibility hooks
 * - Preserves existing import paths: `import { useSuppliersPageQuery } from '@/api/suppliers/hooks'`
 * - Zero breaking changes for consuming components
 * - Organized by use case: page query, search, detail by id
 *
 * @usage
 * ```typescript
 * import {
 *   useSuppliersPageQuery,
 *   useSupplierSearchQuery,
 *   useSupplierByIdQuery
 * } from '@/api/suppliers/hooks';
 * ```
 */

// Legacy name exports for backward compatibility
export { useSupplierPageQuery as useSuppliersPageQuery } from './useSupplierPageQuery';
export { useSupplierSearchQuery } from './useSupplierSearchQuery';
export { useSupplierByIdQuery } from './useSupplierByIdQuery';

// Standard names
export { useSupplierPageQuery } from './useSupplierPageQuery';
