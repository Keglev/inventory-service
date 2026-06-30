/**
 * @file index.ts
 * @module pages/inventory/dialogs/PriceChangeDialog
 *
 * @summary
 * Public barrel for the PriceChangeDialog feature module. Exposes the
 * main component, the orchestrator hook, the two specialized sub-hooks
 * (state, queries), the form view, and the item-details panel.
 *
 * @enterprise
 * - Same three-way split as DeleteItemDialog: state hook, queries hook,
 *   orchestrator. The orchestrator is the recommended consumer entry;
 *   the sub-hooks are exported for tests and advanced composition.
 * - PriceChangeForm and PriceChangeItemDetails are exported individually
 *   so tests can mount the panel without the dialog chrome.
 */

export { PriceChangeDialog } from './PriceChangeDialog';
export type { PriceChangeDialogProps } from './PriceChangeDialog.types';
export { usePriceChangeForm } from './usePriceChangeForm';
export type { UsePriceChangeFormReturn } from './usePriceChangeForm';
export { usePriceChangeFormState } from './usePriceChangeFormState';
export { usePriceChangeFormQueries } from './usePriceChangeFormQueries';
export { PriceChangeForm } from './PriceChangeForm';
export { PriceChangeItemDetails } from './PriceChangeItemDetails';
