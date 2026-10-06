/**
 * @file ItemSearchField.tsx
 * @module pages/inventory/components/ItemSearchField
 *
 * @summary
 * The item picker of the four inventory dialogs (quantity, price, edit,
 * delete). A thin setting of the shared ListSearchField.
 *
 * @enterprise
 * - Picker mode: the picked item stays in the field; clearing the text
 *   clears the pick.
 * - Results come from useItemSearchQuery: the chosen supplier's items,
 *   matched by name or SKU in the browser (frontend ADR-0014). The SKU is
 *   the second line of a result.
 * - Disabled only while no supplier is chosen, never while items load.
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { ItemOption } from '../../../api/analytics/types';
import { ListSearchField } from '../../../components/search/ListSearchField';

export interface ItemSearchFieldProps {
  /** Text typed in the field. */
  query: string;
  /** Called with the new text on every edit. */
  onQueryChange: (query: string) => void;
  /** Items matching the query (useItemSearchQuery). */
  results: ItemOption[];
  /** Whether the supplier's items are still loading. */
  loading: boolean;
  /** The picked item, or null. */
  value: ItemOption | null;
  /** Called with the picked item, or null when the field is cleared. */
  onSelect: (item: ItemOption | null) => void;
  /** True while no supplier is chosen. */
  disabled?: boolean;
}

export const ItemSearchField: React.FC<ItemSearchFieldProps> = ({ disabled = false, ...props }) => {
  const { t } = useTranslation(['inventory']);

  return (
    <ListSearchField<ItemOption>
      {...props}
      disabled={disabled}
      getLabel={(item) => item.name}
      getKey={(item) => item.id}
      getDetail={(item) => item.sku ?? ''}
      label={t('inventory:item')}
      placeholder={t(disabled ? 'inventory:search.selectSupplierFirst' : 'inventory:search.typeToSearchItems')}
      noResultsText={t('inventory:search.noItemsFound')}
      hintText={t('inventory:search.typeToSearch')}
    />
  );
};
