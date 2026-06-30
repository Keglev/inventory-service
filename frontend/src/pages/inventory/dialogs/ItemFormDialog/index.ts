/**
 * @file index.ts
 * @module pages/inventory/dialogs/ItemFormDialog
 *
 * @summary
 * Public barrel for the ItemFormDialog feature module: the dialog
 * component, its prop type, the orchestrator hook, and the hook's
 * return type.
 *
 * @enterprise
 * - Smaller surface than EditItemDialog's barrel: no view component
 *   re-export. ItemForm is internal -- consumers always go through
 *   the dialog wrapper, because create-vs-edit mode is decided by the
 *   wrapper's initial prop, not by the form itself.
 */

export { ItemFormDialog } from './ItemFormDialog';
export type { ItemFormDialogProps } from './ItemFormDialog.types';
export { useItemForm } from './useItemForm';
export type { UseItemFormReturn } from './useItemForm';
