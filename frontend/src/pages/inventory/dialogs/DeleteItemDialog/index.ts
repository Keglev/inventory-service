// Main dialog component
export { DeleteItemDialog, type DeleteItemDialogProps } from './DeleteItemDialog';

// Hooks - composition
export { useDeleteItemDialog } from './useDeleteItemDialog';
export type { UseDeleteItemDialogReturn } from './DeleteItemDialog.types';

// Hooks - specialized (can be used individually if needed)
export { useDeleteItemState, type UseDeleteItemStateReturn } from './useDeleteItemState';
export { useDeleteItemQueries, type UseDeleteItemQueriesReturn } from './useDeleteItemQueries';
export { useDeleteItemHandlers, type UseDeleteItemHandlersReturn } from './useDeleteItemHandlers';

// Views
export { DeleteItemContent, type DeleteItemContentProps } from './DeleteItemContent';
export { DeleteFormView } from './DeleteFormView';
export { DeleteConfirmationView } from './DeleteConfirmationView';

// Field components
export {
  SupplierSelectField,
  ItemSelectField,
  DeletionReasonField,
  ItemInfoDisplay,
} from './DeleteFormFields';

// Error handling
export { handleDeleteError, type DeleteErrorResult } from './deleteItemErrorHandler';
