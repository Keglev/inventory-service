/**
 * EditItemDialog - Re-export from modular implementation
 * 
 * This file maintains backward compatibility by re-exporting the modularized
 * EditItemDialog from the dialogs/EditItemDialog directory.
 * 
 * @deprecated Use direct import instead
 * @example
 * // Old (still works):
 * import EditItemDialog from './pages/inventory/EditItemDialog';
 * 
 * // New (preferred):
 * import EditItemDialog from './pages/inventory/dialogs/EditItemDialog';
 */

export { EditItemDialog, type EditItemDialogProps } from './dialogs/EditItemDialog';
