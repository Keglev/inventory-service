/**
 * DeleteItemDialog Module - Barrel exports
 * 
 * @module dialogs/DeleteItemDialog
 * @description
 * Public API for the DeleteItemDialog feature module.
 * Exports organized by responsibility:
 * - Main dialog component for easy integration
 * - Orchestrator hook (useDeleteItemDialog) for backwards compatibility
 * - Specialized hooks for advanced composition and testing
 * - View components for custom layouts
 * - Field components for testing and reuse
 * - Error handling utilities
 * 
 * @enterprise
 * - Single entry point: consumers import from 'dialogs/DeleteItemDialog'
 * - Hierarchical exports: main component first, internals last
 * - Type-safe: all exports are typed
 * - Testable: specialized hooks can be imported individually
 * 
 * @example
 * ```tsx
 * // Simple usage
 * import { DeleteItemDialog } from './dialogs/DeleteItemDialog';
 * 
 * // Advanced usage with custom hooks
 * import { useDeleteItemState, useDeleteItemQueries } from './dialogs/DeleteItemDialog';
 * ```
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

/** Manages selection and dialog state: supplier, item, reason, errors */
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
  DeletionReasonField,
  ItemInfoDisplay,
} from './DeleteFormFields';

// ============================================
// Error Handling
// ============================================
// Utility for mapping backend errors to user messages
export { handleDeleteError, type DeleteErrorResult } from './deleteItemErrorHandler';
