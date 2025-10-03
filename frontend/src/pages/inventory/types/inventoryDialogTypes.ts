/**
 * @file inventoryDialogTypes.ts
 * @module pages/inventory/types/inventoryDialogTypes
 *
 * @summary
 * Shared types, validation schemas, and constants for inventory dialogs.
 * Centralizes common definitions used across quantity and price adjustment dialogs.
 *
 * @enterprise
 * - Type safety: fully typed interfaces for all dialog operations
 * - Validation: centralized Zod schemas for consistent validation
 * - Business rules: enum definitions that mirror backend constraints
 * - Audit trail: predefined reason codes for regulatory compliance
 */

import { z } from 'zod';

/**
 * Business reasons for stock quantity changes.
 * Mirrors the backend StockChangeReason enum for audit trail consistency.
 * 
 * @enterprise
 * These values provide traceability for all stock movements and support
 * regulatory compliance, financial reconciliation, and operational analytics.
 */
export const STOCK_CHANGE_REASONS = [
  'MANUAL_UPDATE',
  'SOLD',
  'SCRAPPED',
  'DESTROYED',
  'DAMAGED',
  'EXPIRED',
  'LOST',
  'RETURNED_TO_SUPPLIER',
  'RETURNED_BY_CUSTOMER',
] as const;

/**
 * Business reasons for price changes.
 * Mirrors real-world scenarios where price adjustments occur.
 * 
 * @enterprise
 * These values provide traceability for all price movements and support
 * regulatory compliance, financial reconciliation, and operational analytics.
 * Aligned with item creation reasons for consistency across operations.
 */
export const PRICE_CHANGE_REASONS = [
  'INITIAL_STOCK',
  'MANUAL_UPDATE',
] as const;

/**
 * Type definitions for business reason enums
 */
export type StockChangeReason = typeof STOCK_CHANGE_REASONS[number];
export type PriceChangeReason = typeof PRICE_CHANGE_REASONS[number];

/**
 * Validation schema for quantity adjustment form.
 * Enforces business rules and data integrity constraints.
 * 
 * @enterprise
 * - Quantity must be non-negative (≥ 0) to prevent invalid stock levels
 * - Item selection is mandatory for operation context
 * - Business reason is required for audit trail compliance
 */
export const quantityAdjustSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
  newQuantity: z.number()
    .nonnegative('Quantity cannot be negative')
    .finite('Quantity must be a valid number'),
  reason: z.enum(STOCK_CHANGE_REASONS, {
    message: 'Please select a valid reason',
  }),
});

/**
 * Validation schema for price change form.
 * Enforces business rules and data integrity constraints.
 * 
 * @enterprise
 * - Price must be non-negative (≥ 0) to prevent invalid pricing
 * - Item selection is mandatory for operation context
 * - Business reason is required for audit trail compliance
 */
export const priceChangeSchema = z.object({
  itemId: z.string().min(1, 'Item selection is required'),
  newPrice: z.number()
    .nonnegative('Price cannot be negative')
    .finite('Price must be a valid number'),
  reason: z.enum(PRICE_CHANGE_REASONS, {
    message: 'Please select a valid reason',
  }),
});

/**
 * Form data types inferred from schemas
 */
export type QuantityAdjustFormData = z.infer<typeof quantityAdjustSchema>;
export type PriceChangeFormData = z.infer<typeof priceChangeSchema>;

/**
 * Common props for inventory operation dialogs
 */
export interface BaseInventoryDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  
  /** Function to close the dialog */
  onClose: () => void;
  
  /** Optional callback after successful operation */
  onSuccess?: () => void;
}

/**
 * Supplier selection state used across dialogs
 */
export interface SupplierSelectionState {
  /** Currently selected supplier */
  selectedSupplier: { id: string; name: string } | null;
  
  /** Function to update selected supplier */
  setSelectedSupplier: (supplier: { id: string; name: string } | null) => void;
}