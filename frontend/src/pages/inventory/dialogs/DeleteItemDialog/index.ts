/**
 * @file index.ts
 * @description
 * Barrel export for DeleteItemDialog module.
 * Exports main component and types for external consumption.
 */

export { DeleteItemDialog, type DeleteItemDialogProps } from './DeleteItemDialog';
export type { UseDeleteItemDialogReturn, DeleteItemContentProps } from './DeleteItemDialog.types';
export { useDeleteItemDialog } from './useDeleteItemDialog';
export { handleDeleteError, type DeleteErrorResult } from './deleteItemErrorHandler';

// Field components exported for testing purposes only
// (not meant for external use - prefer DeleteItemContent)
export { SupplierSelectField, ItemSelectField, DeletionReasonField, ItemInfoDisplay } from './DeleteFormFields';
