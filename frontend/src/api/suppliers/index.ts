/**
 * @file index.ts
 * @module api/suppliers
 *
 * @summary
 * Coordinator barrel export for supplier API operations.
 * Re-exports from focused modules to maintain backward compatibility.
 *
 * @enterprise
 * - Enables single-responsibility modules (list fetching, mutations, normalization)
 * - Preserves existing import paths: `import { getSuppliersPage, createSupplier } from '@/api/suppliers'`
 * - Zero breaking changes for consuming components
 * - Clear organization: listFetcher, mutations, normalizers, validation
 *
 * @usage
 * ```typescript
 * import { getSuppliersPage, createSupplier, SUPPLIERS_BASE } from '@/api/suppliers';
 * ```
 */

// API endpoints and list fetching
export { getSuppliersPage, SUPPLIERS_BASE } from './supplierListFetcher';

// CRUD mutations
export { createSupplier, updateSupplier, deleteSupplier } from './supplierMutations';

// Normalization utilities (internal, for testing/reuse)
export { toSupplierRow } from './supplierNormalizers';

// Types and validation
export * from './types';
export * from './validation';

// Hooks
export * from './hooks';
