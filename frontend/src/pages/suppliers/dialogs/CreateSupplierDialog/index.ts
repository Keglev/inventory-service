/**
 * @file index.ts
 * @module dialogs/CreateSupplierDialog/index
 *
 * @summary
 * Barrel export for CreateSupplierDialog module.
 * Re-exports main component, types, and utilities.
 *
 * @enterprise
 * - Single re-export point for the CreateSupplierDialog module
 * - Re-exports the component, its props type, the form hook, and the form view
 * - Keeps consumer import sites flat (one path, multiple symbols)
 */

export { CreateSupplierDialog, default } from './CreateSupplierDialog';
export type { CreateSupplierDialogProps } from './CreateSupplierDialog.types';
export { useCreateSupplierForm } from './useCreateSupplierForm';
export { CreateSupplierForm } from './CreateSupplierForm';
