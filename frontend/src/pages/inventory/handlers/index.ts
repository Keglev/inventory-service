/**
 * @file index.ts
 * @module pages/inventory/handlers
 *
 * @summary
 * Barrel for the five orchestrator hooks consumed by InventoryBoard.
 *
 * @enterprise
 * - Splitting handler logic by surface (toolbar / filter / table /
 *   refresh / data-fetch) keeps InventoryBoard a thin composition
 *   layer and makes each handler unit-testable in isolation. The
 *   barrel exists so InventoryBoard imports from one path instead
 *   of five.
 */

export { useToolbarHandlers } from './useToolbarHandlers';
export { useFilterHandlers } from './useFilterHandlers';
export { useTableHandlers } from './useTableHandlers';
export { useRefreshHandler } from './useRefreshHandler';
export { useDataFetchingLogic } from './useDataFetchingLogic';
