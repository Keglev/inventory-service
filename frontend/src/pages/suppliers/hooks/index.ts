/**
 * @file index.ts
 * @module pages/suppliers/hooks
 *
 * @summary
 * Barrel export for suppliers board hooks.
 *
 * @enterprise
 * - Single re-export point for the SuppliersBoard state and data hooks
 * - State hook (useSuppliersBoardState) and data hook (useSuppliersBoardData) deliberately separated
 * - Re-exports the state/data interface types so handlers can type their state argument
 */

export { useSuppliersBoardState, type SuppliersBoardState, type SuppliersBoardStateSetters } from './useSuppliersBoardState';
export { useSuppliersBoardData, type SuppliersBoardData } from './useSuppliersBoardData';
