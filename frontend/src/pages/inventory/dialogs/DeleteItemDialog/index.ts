/**
 * @file index.ts
 * @module pages/inventory/dialogs/DeleteItemDialog
 *
 * @summary
 * Public barrel for the DeleteItemDialog feature module. Exposes the main
 * component, the orchestrator hook, the three specialized sub-hooks, the
 * view and field components, and the error-mapping utility.
 *
 * @enterprise
 * - Two entry points by intent. Most consumers import DeleteItemDialog and
 *   forget the internals; tests and advanced compositions reach for the
 *   specialized hooks (useDeleteItemState, useDeleteItemQueries,
 *   useDeleteItemHandlers) directly through this same barrel.
 * - Field components (SupplierSelectField, ItemSelectField,
 *   ItemInfoDisplay) are exported individually so tests can mount them in
 *   isolation against a hand-built state object.
 */

// ============================================
// Main Dialog Component
// ============================================
// Public-facing component for consumer integration
// Provides complete delete workflow with built-in dialogs
export { DeleteItemDialog, type DeleteItemDialogProps } from './DeleteItemDialog';

// ============================================
// Orchestrator Hook (Backwards Compatible)
// ============================================
// High-level hook composing all specialized hooks
// Returns complete state, queries, and handlers
// Recommended for most use cases
export { useDeleteItemDialog } from './useDeleteItemDialog';
export type { UseDeleteItemDialogReturn } from './DeleteItemDialog.types';

// ============================================
// Specialized Hooks (Advanced Composition)
// ============================================
// Focused hooks for fine-grained control and testing
// Can be used individually or composed together

/** Manages selection and dialog state: supplier, item, errors */
export { useDeleteItemState, type UseDeleteItemStateReturn } from './useDeleteItemState';

/** Coordinates React Query for suppliers, item search, item details */
export { useDeleteItemQueries, type UseDeleteItemQueriesReturn } from './useDeleteItemQueries';

/** Handles form submission, deletion, and error responses */
export { useDeleteItemHandlers, type UseDeleteItemHandlersReturn } from './useDeleteItemHandlers';

// ============================================
// View Components (Custom Layouts)
// ============================================
// Presentation components for form and confirmation flows
// Can be integrated into custom dialog wrappers
export { DeleteItemContent, type DeleteItemContentProps } from './DeleteItemContent';
export { DeleteFormView } from './DeleteFormView';
export { DeleteConfirmationView } from './DeleteConfirmationView';

// ============================================
// Field Components (Testing and Reuse)
// ============================================
// Individual field components for isolated testing
// Can be composed into custom forms
export {
  SupplierSelectField,
  ItemSelectField,
  ItemInfoDisplay,
} from './DeleteFormFields';

// ============================================
// Error Handling
// ============================================
// Utility for mapping backend errors to user messages
export { handleDeleteError, type DeleteErrorResult } from './deleteItemErrorHandler';
