/**
 * PriceChangeDialog module exports
 * 
 * @module dialogs/PriceChangeDialog
 * @description
 * Barrel export organizing PriceChangeDialog by responsibility:
 * - Main: PriceChangeDialog component
 * - Orchestrator: usePriceChangeForm hook
 * - State: usePriceChangeFormState (component state)
 * - Queries: usePriceChangeFormQueries (data fetching)
 * - Views: PriceChangeForm, PriceChangeItemDetails
 * - Types: PriceChangeDialogProps
 */

export { PriceChangeDialog } from './PriceChangeDialog';
export type { PriceChangeDialogProps } from './PriceChangeDialog.types';
export { usePriceChangeForm } from './usePriceChangeForm';
export type { UsePriceChangeFormReturn } from './usePriceChangeForm';
export { usePriceChangeFormState } from './usePriceChangeFormState';
export { usePriceChangeFormQueries } from './usePriceChangeFormQueries';
export { PriceChangeForm } from './PriceChangeForm';
export { PriceChangeItemDetails } from './PriceChangeItemDetails';
