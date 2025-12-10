/**
 * @file PriceTrendCard.types.ts
 * @description
 * Type definitions for price trend card functionality.
 */

/**
 * Props for the PriceTrendCard component
 */
export interface PriceTrendCardProps {
  /** Optional ISO date (YYYY-MM-DD) for lower bound */
  from?: string;
  /** Optional ISO date (YYYY-MM-DD) for upper bound */
  to?: string;
  /** Optional supplier ID to restrict item search */
  supplierId?: string | null;
}
