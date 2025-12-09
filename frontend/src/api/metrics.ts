/**
 * @file metrics.ts
 * @description
 * DEPRECATED: Backward compatibility barrel for metrics.
 * All metrics have been moved to src/api/analytics/metrics.ts
 *
 * Use: import { getInventoryCount } from '@/api/analytics'
 * Instead of: import { getInventoryCount } from '@/api/metrics'
 */

export {
  getItemCount,
  getSupplierCount,
  getLowStockCount,
  getInventoryCount,
  getSuppliersCount,
} from './analytics/metrics';
