/**
 * @file index.ts
 * @module pages/suppliers/board
 *
 * @summary
 * Barrel export for suppliers board.
 */

export { default as SuppliersBoard } from './SuppliersBoard';
export { useSuppliersBoardState, useSuppliersBoardData } from './hooks';
export {
  SuppliersToolbar,
  SuppliersSearchPanel,
  SuppliersFilterPanel,
  SuppliersTable,
  SuppliersDialogs,
} from './components';
