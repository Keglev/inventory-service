/**
 * @file index.ts
 * @module pages/suppliers/handlers
 *
 * @summary
 * Barrel exports for all supplier board event handler hooks.
 *
 * @enterprise
 * - Single re-export point for all SuppliersBoard event-handler hooks
 * - Keeps orchestrator import block flat (one path, multiple hooks)
 * - Each handler hook is a thin closure over the shared state object
 */

export { useToolbarHandlers } from './useToolbarHandlers';
export { useSearchHandlers } from './useSearchHandlers';
export { useTableHandlers } from './useTableHandlers';
export { useFilterHandlers } from './useFilterHandlers';
export { useDialogHandlers } from './useDialogHandlers';
export { useDataFetchingLogic } from './useDataFetchingLogic';
