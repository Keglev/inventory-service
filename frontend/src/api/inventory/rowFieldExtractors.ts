import { pickString, pickNumber } from '../shared/fieldPickers';

/** Required identity: InventoryItemDTO's `id`; undefined when absent. */
export function extractId(raw: Record<string, unknown>): string | undefined {
  return pickString(raw, 'id');
}

/** Display name: InventoryItemDTO's `name`; em-dash placeholder when absent. */
export function extractName(raw: Record<string, unknown>): string {
  return pickString(raw, 'name') ?? '—';
}

/** Item code: InventoryItemDTO's `sku`; null when absent. */
export function extractCode(raw: Record<string, unknown>): string | null {
  return pickString(raw, 'sku') ?? null;
}

/** Supplier id and name: InventoryItemDTO's `supplierId` (a UUID string) and `supplierName`. */
export function extractSupplier(raw: Record<string, unknown>): {
  supplierId: string | number | null;
  supplierName: string | null;
} {
  return {
    supplierId: pickString(raw, 'supplierId') ?? null,
    supplierName: pickString(raw, 'supplierName') ?? null,
  };
}

/** On-hand stock from backend `quantity` (defaults 0) and `minimumQuantity` (nullable). */
export function extractQuantities(raw: Record<string, unknown>): {
  onHand: number;
  minQty: number | null;
} {
  const onHand = pickNumber(raw, 'quantity') ?? 0;

  const minQty = pickNumber(raw, 'minimumQuantity') ?? null;

  return { onHand, minQty };
}

/** Creation timestamp: InventoryItemDTO's `createdAt`. The backend model has no update timestamp. */
export function extractCreatedAt(raw: Record<string, unknown>): string | null {
  return pickString(raw, 'createdAt') ?? null;
}
