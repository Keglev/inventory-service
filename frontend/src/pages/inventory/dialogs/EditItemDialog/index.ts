/**
 * EditItemDialog module barrel exports
 * 
 * @module dialogs/EditItemDialog/index
 * @description
 * Central export point for the edit item dialog module.
 * Organizes exports by responsibility for easy imports and discoverability.
 * 
 * @example
 * ```tsx
 * // Import main component
 * import EditItemDialog from './dialogs/EditItemDialog';
 * 
 * // Import hook for custom usage
 * import { useEditItemForm } from './dialogs/EditItemDialog/useEditItemForm';
 * 
 * // Import types for props/state
 * import type { EditItemDialogProps } from './dialogs/EditItemDialog';
 * ```
 */

// Main dialog component
export { EditItemDialog, type EditItemDialogProps } from './EditItemDialog';

// Form orchestration hook
export { useEditItemForm, type UseEditItemFormReturn } from './useEditItemForm';

// Form view component
export { EditItemForm } from './EditItemForm';
