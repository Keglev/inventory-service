/**
 * @file index.ts
 * @module dialogs/QuantityAdjustDialog
 *
 * @summary
 * Barrel exports for QuantityAdjustDialog module.
 * Exports components, hooks, and types for convenient imports.
 *
 * @usage
 * ```ts
 * import {
 *   QuantityAdjustDialog,
 *   useQuantityAdjustForm,
 *   useQuantityAdjustFormState,
 *   useQuantityAdjustFormQueries,
 * } from './dialogs/QuantityAdjustDialog';
 * ```
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
