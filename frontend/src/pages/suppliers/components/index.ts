/**
 * @file index.ts
 * @module pages/suppliers/components
 *
 * @summary
 * Barrel export for suppliers board components.
 *
 * @enterprise
 * - Single re-export point for all suppliers-board UI components
 * - Keeps SuppliersBoard import block flat (one path, multiple symbols)
 * - Re-exports component prop types alongside components for downstream typing
 */

export { SuppliersToolbar, type SuppliersToolbarProps } from './SuppliersToolbar';
export { SuppliersSearchPanel, type SuppliersSearchPanelProps } from './SuppliersSearchPanel';
export { SuppliersFilterPanel, type SuppliersFilterPanelProps } from './SuppliersFilterPanel';
export { SuppliersTable, type SuppliersTableProps } from './SuppliersTable';
export { SuppliersDialogs, type SuppliersDialogsProps } from './SuppliersDialogs';
