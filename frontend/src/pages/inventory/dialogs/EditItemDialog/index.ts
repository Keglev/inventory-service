/**
 * @file index.ts
 * @module pages/inventory/dialogs/EditItemDialog
 *
 * @summary
 * Public barrel for the EditItemDialog feature module. Exposes the main
 * component, the orchestrator hook, and the form view.
 *
 * @enterprise
 * - Three exports, three intents. Most consumers import EditItemDialog
 *   and stop there; tests reach for useEditItemForm to mount the
 *   orchestrator without the dialog chrome; advanced composition reaches
 *   for EditItemForm to embed the body in a custom container.
 * - Smaller surface than DeleteItemDialog's barrel because the rename
 *   flow has only one sub-hook; no specialized state/queries/handlers
 *   split is needed at this size.
 */

// Main dialog component
export { EditItemDialog, type EditItemDialogProps } from './EditItemDialog';

// Form orchestration hook
export { useEditItemForm, type UseEditItemFormReturn } from './useEditItemForm';

// Form view component
export { EditItemForm } from './EditItemForm';
