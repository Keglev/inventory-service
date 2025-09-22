/**
* @file index.ts (barrel)
* @module api/analytics
*
* @summary
* Barrel re-exports to keep existing imports stable while we refactor.
* Consumers can continue to `import { getPriceTrend } from '@/api/analytics'`.
*/
export * from './types';
export * from './util'; 
export * from './stock';
export * from './priceTrend';
export * from './suppliers';
export * from './lowStock';
export * from './search';
export * from './finance';
export * from './frequency';
export * from './updates';
// Future: add exports for new analytics endpoints here