/**
 * @file index.ts
 * @module api/suppliers
 *
 * @summary
 * Barrel export for the supplier API module.
 *
 * @enterprise
 * - Single import point for all supplier API surface: fetcher, mutations, normalizers, types, validation, hooks.
 * - toSupplierRow is re-exported for testing and for any consumer that normalizes outside the standard hooks.
 */

// list fetcher and endpoint constant
export { getSuppliersPage, searchSuppliersByName, getSupplierById, SUPPLIERS_BASE } from './supplierListFetcher';

// create / update / delete
export { createSupplier, updateSupplier, deleteSupplier } from './supplierMutations';

// low-level normalizer; prefer hooks or mutations for typical use
export { toSupplierRow } from './supplierNormalizers';

// Types and validation
export * from './types';
export * from './validation';

// Hooks
export * from './hooks';
