/**
 * @file index.ts
 * @module pages/inventory/dialogs/QuantityAdjustDialog
 *
 * @summary
 * Public barrel for the QuantityAdjustDialog feature module: the
 * dialog, all five sub-component views, the orchestrator hook, the
 * two specialized sub-hooks (state, queries), and the price query.
 *
 * @enterprise
 * - Widest export surface of the inventory dialog family. Quantity
 *   adjust is split into five visual components (supplier select,
 *   item select, item details, quantity input) so each step is
 *   independently testable and replaceable.
 * - useItemPriceQuery is exported because it can be reused outside
 *   the dialog -- the analytics price trend lookup is generic.
 */

// Components
export { QuantityAdjustDialog } from './QuantityAdjustDialog';
export { QuantityAdjustForm } from './QuantityAdjustForm';
export { QuantityAdjustItemDetails } from './QuantityAdjustItemDetails';
export { QuantityAdjustSupplierSelect } from './QuantityAdjustSupplierSelect';
export { QuantityAdjustItemSelect } from './QuantityAdjustItemSelect';
export { QuantityAdjustQuantityInput } from './QuantityAdjustQuantityInput';

// Hooks
export { useQuantityAdjustForm } from './useQuantityAdjustForm';
export { useQuantityAdjustFormState } from './useQuantityAdjustFormState';
export { useQuantityAdjustFormQueries } from './useQuantityAdjustFormQueries';
export { useItemPriceQuery } from './useItemPriceQuery';

// Types
export type { QuantityAdjustDialogProps } from './QuantityAdjustDialog.types';
export type { UseQuantityAdjustFormReturn } from './useQuantityAdjustForm';
export type { QuantityAdjustFormState, QuantityAdjustFormStateSetters } from './useQuantityAdjustFormState';
export type { QuantityAdjustFormQueries } from './useQuantityAdjustFormQueries';
