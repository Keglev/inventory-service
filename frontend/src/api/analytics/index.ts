/**
 * @module api/analytics
 *
 * Barrel that re-exports every public symbol from the analytics API layer so
 * consumers can import from a single stable path (`@/api/analytics`) without
 * knowing the internal module boundaries.
 */
export * from './types';
export * from './util';
export * from './stock';
export * from './priceTrend';
export * from './suppliers';
export * from './lowStock';
export * from './finance';
export * from './frequency';
export * from './updates';
export * from './reasonBreakdown';
export * from './employees';
export * from './metrics';
export * from './validation';
export * from './hooks';
