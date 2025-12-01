/**
 * @file api/orders/index.ts
 * @description
 * API calls for purchase orders analytics.
 * Provides stock movement data (purchases, returns) grouped by supplier.
 *
 * @enterprise
 * - Fetches items with "initial supply" status
 * - Fetches stock history (received/returned items) by date
 * - Supports date range filtering (30, 90, 180 days)
 * - Demo mode compatible (read-only)
 */

import http from '../httpClient';
import type { InventoryRow } from '../inventory/types';

/**
 * Stock movement event (purchase, return, etc.)
 */
export interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  reason: 'RECEIVED' | 'SOLD' | 'ADJUSTED' | 'DAMAGED' | 'LOSS' | 'RETURNED';
  quantity: number;
  date: string; // ISO date
  notes?: string;
}

/**
 * Purchase order analytics for a supplier
 */
export interface PurchaseOrderAnalytics {
  supplierId: string;
  supplierName: string;
  /** Items in initial supply status from this supplier */
  initialSupplyItems: InventoryRow[];
  /** Items that were returned to this supplier */
  returnedItems: InventoryRow[];
  /** Historical stock movements */
  movements: StockMovement[];
}

/**
 * Fetch items with "initial supply" status for a supplier
 */
export async function getInitialSupplyItems(supplierId: string): Promise<InventoryRow[]> {
  const response = await http.get<InventoryRow[]>(
    `/api/inventory/suppliers/${supplierId}/initial-supply`
  );
  return response.data || [];
}

/**
 * Fetch items returned to a supplier
 */
export async function getReturnedItems(supplierId: string): Promise<InventoryRow[]> {
  const response = await http.get<InventoryRow[]>(
    `/api/inventory/suppliers/${supplierId}/returned`
  );
  return response.data || [];
}

/**
 * Fetch stock movements (purchases, returns) for a supplier within a date range
 * 
 * @param supplierId - Supplier ID
 * @param fromDate - ISO date (YYYY-MM-DD)
 * @param toDate - ISO date (YYYY-MM-DD)
 */
export async function getStockMovements(
  supplierId: string,
  fromDate: string,
  toDate: string
): Promise<StockMovement[]> {
  const response = await http.get<StockMovement[]>(
    `/api/stock-history/supplier/${supplierId}`,
    {
      params: {
        from: fromDate,
        to: toDate,
        reasons: 'RECEIVED,RETURNED', // Filter for purchases and returns
      },
    }
  );
  return response.data || [];
}

/**
 * Fetch complete purchase order analytics for a supplier
 */
export async function getPurchaseOrderAnalytics(
  supplierId: string,
  fromDate: string,
  toDate: string
): Promise<PurchaseOrderAnalytics> {
  const [initialItems, returnedItems, movements] = await Promise.all([
    getInitialSupplyItems(supplierId),
    getReturnedItems(supplierId),
    getStockMovements(supplierId, fromDate, toDate),
  ]);

  return {
    supplierId,
    supplierName: '', // Will be filled from supplier selector
    initialSupplyItems: initialItems,
    returnedItems: returnedItems,
    movements: movements,
  };
}
