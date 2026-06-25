/**
 * @module api/inventory
 *
 * Public barrel for the inventory API. Re-exports types, list-fetching
 * utilities, mutation helpers, validation, and the primary useInventoryData
 * hook. Three additional hooks (useItemDetailsQuery, useItemSearchQuery,
 * useSuppliersQuery) are imported directly by their consumers and are not
 * re-exported here; that gap is a known deferred structural item.
 */
export * from './types';
export * from './list';
export * from './mutations';
export * from './validation';
export * from './hooks/useInventoryData';

