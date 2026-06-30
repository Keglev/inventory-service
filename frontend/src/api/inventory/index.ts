/**
 * @module api/inventory
 *
 * Public barrel for the inventory API. Re-exports types, list-fetching
 * utilities, mutation helpers, validation, and the inventory data-fetching
 * hooks (useSuppliersQuery, useItemSearchQuery, useItemDetailsQuery) via the
 * hooks barrel.
 */
export * from './types';
export * from './list';
export * from './mutations';
export * from './validation';
export * from './hooks';

