/**
 * @file index.ts
 * @module dialogs/DeleteSupplierDialog/index
 *
 * @summary
 * Barrel export for DeleteSupplierDialog module.
 * Re-exports main component, types, and utilities.
 *
 * @enterprise
 * - Single re-export point for the DeleteSupplierDialog module
 * - Re-exports the component, its props type, the workflow hook, and the search hook
 * - Keeps consumer import sites flat (one path, multiple symbols)
 */

export { DeleteSupplierDialog, default } from './DeleteSupplierDialog';
export type { DeleteSupplierDialogProps } from './DeleteSupplierDialog.types';
export { useDeleteSupplierForm } from './useDeleteSupplierForm';
export { useSupplierSearch } from '../../hooks/useSupplierSearch';
