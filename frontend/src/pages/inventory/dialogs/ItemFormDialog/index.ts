/**
 * ItemFormDialog module exports
 * 
 * @module dialogs/ItemFormDialog
 * @description
 * Barrel export organizing ItemFormDialog by responsibility:
 * - ItemFormDialog: main dialog container
 * - useItemForm: orchestrator hook (state, queries, handlers)
 * - ItemForm: form view component
 * - types: component prop types
 */

export { ItemFormDialog } from './ItemFormDialog';
export type { ItemFormDialogProps } from './ItemFormDialog.types';
export { useItemForm } from './useItemForm';
export type { UseItemFormReturn } from './useItemForm';
