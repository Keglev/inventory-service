/**
 * @file inventory-dialog.types.ts
 * @module pages/inventory/types
 *
 * @summary
 * Shared TypeScript type definitions for inventory dialog components.
 * Centralizes common interfaces to ensure consistency across dialogs.
 *
 * @enterprise
 * - Single source of truth for dialog-related types
 * - Prevents type definition duplication across components
 * - Ensures type consistency between dialogs
 * - Supports refactoring and maintainability
 * - Comprehensive TypeDoc documentation for all exports
 *
 * @usage
 * ```typescript
 * import { SupplierOption, ItemOption, ItemDetails } from './types/inventory-dialog.types';
 * ```
 */

/**
 * Supplier option shape for dropdown and autocomplete components.
 * Normalized from backend supplier data for consistent UI handling.
 * 
 * @interface SupplierOption
 * @property {string | number} id - Unique supplier identifier (can be string or number from backend)
 * @property {string} label - Display name for supplier selection in UI components
 * 
 * @example
 * ```typescript
 * const supplier: SupplierOption = {
 *   id: "supplier-123",
 *   label: "Acme Corporation"
 * };
 * ```
 */
export interface SupplierOption {
  /** Unique supplier identifier (can be string or number from backend) */
  id: string | number;
  /** Display name for supplier selection dropdown */
  label: string;
}

/**
 * Item option shape for autocomplete search results.
 * Normalized from backend inventory search data for consistent UI handling.
 * 
 * @interface ItemOption
 * @property {string} id - Unique item identifier
 * @property {string} name - Display name for item selection
 * @property {number} onHand - Current quantity on hand (placeholder until full details loaded)
 * @property {number} price - Current price per unit (placeholder until full details loaded)
 * 
 * @remarks
 * Note: `onHand` and `price` are placeholders (usually 0) when item appears in search results.
 * Full details should be fetched via `useItemDetailsQuery()` when user selects an item.
 * 
 * @example
 * ```typescript
 * const searchResult: ItemOption = {
 *   id: "item-456",
 *   name: "Widget A",
 *   onHand: 0,  // Placeholder - fetch actual value on selection
 *   price: 0    // Placeholder - fetch actual value on selection
 * };
 * ```
 */
export interface ItemOption {
  /** Unique item identifier */
  id: string;
  /** Display name for item selection */
  name: string;
  /** Current quantity on hand (placeholder in search results, actual value from details query) */
  onHand?: number;
  /** Current price per unit (placeholder in search results, actual value from details query) */
  price?: number;
}

/**
 * Full item details fetched from backend /api/inventory/{id} endpoint.
 * Contains complete item information including actual current values.
 * 
 * @interface ItemDetails
 * @property {string} id - Unique item identifier
 * @property {string} name - Item display name
 * @property {number} onHand - Actual current quantity on hand (from backend)
 * @property {number} price - Actual current price per unit (from backend)
 * @property {string | null} code - Item code/SKU (nullable)
 * @property {string | number | null} supplierId - Associated supplier identifier (nullable)
 * 
 * @remarks
 * This interface represents the complete item data fetched after user selects an item.
 * Use this for displaying actual current values and pre-filling forms.
 * 
 * @example
 * ```typescript
 * const itemDetails: ItemDetails = {
 *   id: "item-456",
 *   name: "Widget A",
 *   onHand: 150,      // Actual quantity from backend
 *   price: 29.99,     // Actual price from backend
 *   code: "WGT-A-001",
 *   supplierId: "supplier-123"
 * };
 * ```
 */
export interface ItemDetails {
  /** Unique item identifier */
  id: string;
  /** Item display name */
  name: string;
  /** Actual current quantity on hand (from backend) */
  onHand: number;
  /** Actual current price per unit (from backend) */
  price: number;
  /** Item code/SKU (nullable) */
  code: string | null;
  /** Associated supplier identifier (nullable) */
  supplierId: string | number | null;
}
