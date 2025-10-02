/**
 * @file enhancedItemSearch.ts
 * @module pa    // Extract detailed item infor      return (fallbackData as Array<Record<string, unknown>>).map((item): DisplayableItem => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? item.itemName ?? ''),
        supplierId: String(supplierId),
        onHand: undefined,
        currentPrice: undefined,
      })).filter((item) => item.id && item.name);
    return (data as Array<Record<string, unknown>>).map((item): DisplayableItem => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? item.itemName ?? ''),
      supplierId: String(supplierId),
      onHand: typeof item.onHand === 'number' ? item.onHand : 
              typeof item.quantity === 'number' ? item.quantity :
              typeof item.currentQuantity === 'number' ? item.currentQuantity : undefined,
      currentPrice: typeof item.price === 'number' ? item.price :
                   typeof item.currentPrice === 'number' ? item.currentPrice :
                   typeof item.unitPrice === 'number' ? item.unitPrice : undefined,
    })).filter((item) => item.id && item.name);y/api/enhancedItemSearch
 *
 * @summary
 * Enhanced item search that returns detailed item information including
 * quantity and price data for better autocomplete display.
 */

import http from '../../../api/httpClient';
import type { DisplayableItem } from '../components/ItemAutocompleteOption';

/**
 * Raw item data shape from backend API
 */
interface RawItemData {
  id?: string | number;
  name?: string;
  itemName?: string;
  onHand?: number;
  quantity?: number;
  currentQuantity?: number;
  price?: number;
  currentPrice?: number;
  unitPrice?: number;
}

/**
 * Enhanced search for items that returns detailed information.
 * Combines data from multiple endpoints to provide rich autocomplete display.
 */
export async function searchItemsWithDetails(
  supplierId: string,
  query: string,
  limit: number = 50
): Promise<DisplayableItem[]> {
  if (!supplierId || !query.trim()) return [];

  try {
    // Search using the inventory endpoint which has more detailed information
    const params: Record<string, string | number> = {
      supplierId,
      q: query.trim(),
      limit,
    };

    const { data } = await http.get<unknown>('/api/inventory', { params });
    
    if (!Array.isArray(data)) return [];

    // Extract detailed item information
    return (data as RawItemData[]).map((item): DisplayableItem => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? item.itemName ?? ''),
      supplierId: String(supplierId),
      onHand: typeof item.onHand === 'number' ? item.onHand : 
              typeof item.quantity === 'number' ? item.quantity :
              typeof item.currentQuantity === 'number' ? item.currentQuantity : undefined,
      currentPrice: typeof item.price === 'number' ? item.price :
                   typeof item.currentPrice === 'number' ? item.currentPrice :
                   typeof item.unitPrice === 'number' ? item.unitPrice : undefined,
    })).filter((item) => item.id && item.name);

  } catch (error) {
    console.warn('Enhanced item search failed, falling back to basic search:', error);
    
    // Fallback to basic search without detailed information
    try {
      const fallbackParams = { supplierId, search: query.trim(), limit };
      const { data: fallbackData } = await http.get<unknown>('/api/inventory', { params: fallbackParams });
      
      if (!Array.isArray(fallbackData)) return [];
      
      return (fallbackData as RawItemData[]).map((item): DisplayableItem => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? item.itemName ?? ''),
        supplierId: String(supplierId),
        onHand: undefined,
        currentPrice: undefined,
      })).filter((item) => item.id && item.name);
      
    } catch {
      return [];
    }
  }
}