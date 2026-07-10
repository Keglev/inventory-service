import { pickString, pickNumber, pickStringFromList } from '../shared/fieldPickers';

/** Required identity. Tries id / itemId / item_id; undefined when none present. */
export function extractId(raw: Record<string, unknown>): string | undefined {
  return (
    pickString(raw, 'id') ??
    pickString(raw, 'itemId') ??
    pickString(raw, 'item_id')
  );
}

/** Display name; em-dash placeholder when absent. */
export function extractName(raw: Record<string, unknown>): string {
  return (
    pickString(raw, 'name') ??
    pickString(raw, 'itemName') ??
    pickString(raw, 'title') ??
    '—'
  );
}

/** Item code / SKU; null when absent. */
export function extractCode(raw: Record<string, unknown>): string | null {
  return (
    pickString(raw, 'code') ??
    pickString(raw, 'sku') ??
    pickString(raw, 'itemCode') ??
    null
  );
}

/** Supplier id (string or numeric) and name. */
export function extractSupplier(raw: Record<string, unknown>): {
  supplierId: string | number | null;
  supplierName: string | null;
} {
  const supplierIdRaw =
    pickString(raw, 'supplierId') ??
    pickString(raw, 'supplier_id');
  const supplierIdNum = pickNumber(raw, 'supplierId');
  const supplierId: string | number | null =
    supplierIdRaw ?? (typeof supplierIdNum === 'number' ? supplierIdNum : null);

  const supplierName =
    pickString(raw, 'supplierName') ??
    pickString(raw, 'supplier') ??
    null;

  return { supplierId, supplierName };
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

/** Creation timestamp for the grid's "Created" column. The backend (InventoryItemDTO) sends `createdAt`; the alias list tolerates alternate creation-key spellings from non-canonical producers. The backend model has no update timestamp. */
export function extractCreatedAt(raw: Record<string, unknown>): string | null {
  return pickStringFromList(raw, [
    'createdAt',
    'created_at',
    'createdDate',
    'created_date',
    'created',
  ]) ?? null;
}
