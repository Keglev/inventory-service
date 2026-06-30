/**
 * @file index.ts
 * @module dialogs/EditSupplierDialog/index
 *
 * @summary
 * Barrel export for EditSupplierDialog module.
 * Re-exports main component, types, and utilities.
 *
 * @enterprise
 * - Single re-export point for the EditSupplierDialog module
 * - Re-exports the component, its props type, and the workflow hook
 * - Keeps consumer import sites flat (one path, multiple symbols)
 */

export { EditSupplierDialog, default } from './EditSupplierDialog';
export type { EditSupplierDialogProps } from './EditSupplierDialog.types';
export { useEditSupplierForm } from './useEditSupplierForm';
