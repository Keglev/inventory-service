/**
 * @module api/inventory/list
 *
 * Barrel facade for inventory list operations.
 * Re-exports getInventoryPage from listFetcher and toInventoryRow from rowNormalizers,
 * preserving existing import paths after the module was split from a single file into
 * focused single-responsibility modules — zero breaking changes for consuming components.
 */

export { getInventoryPage } from './listFetcher';

// Re-exported for testing and reuse
export { toInventoryRow } from './rowNormalizers';
