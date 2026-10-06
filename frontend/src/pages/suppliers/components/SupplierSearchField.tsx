/**
 * @file SupplierSearchField.tsx
 * @module pages/suppliers/components/SupplierSearchField
 *
 * @summary
 * The supplier search: the suppliers board and the edit and delete dialogs
 * all use it. A thin setting of the shared ListSearchField.
 *
 * @enterprise
 * - Search mode: the field keeps no value; the caller shows the pick.
 * - The second line of a result names the contact and an email or phone,
 *   when the supplier has them; nothing is shown otherwise.
 */

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import type { SupplierRow } from '../../../api/suppliers/types';
import { ListSearchField } from '../../../components/search/ListSearchField';

export interface SupplierSearchFieldProps {
  /** Text typed in the field. */
  query: string;
  /** Called with the new text on every edit. */
  onQueryChange: (query: string) => void;
  /** Suppliers matching the query (matchSuppliers). */
  results: SupplierRow[];
  /** Whether the supplier list is still loading. */
  loading: boolean;
  /** Called with the supplier the user picks. */
  onSelect: (supplier: SupplierRow) => void;
  /** Hides the result list, e.g. while a picked supplier is shown. */
  suppressResults?: boolean;
}

const supplierDetail = (supplier: SupplierRow) =>
  [supplier.contactName, supplier.email || supplier.phone].filter(Boolean).join(' · ');

export const SupplierSearchField: React.FC<SupplierSearchFieldProps> = ({ onSelect, ...props }) => {
  const { t } = useTranslation(['suppliers']);

  return (
    <ListSearchField<SupplierRow>
      {...props}
      // A search field keeps no value, so a pick is never null.
      onSelect={(supplier) => {
        if (supplier) onSelect(supplier);
      }}
      getLabel={(supplier) => supplier.name}
      getKey={(supplier) => supplier.id}
      getDetail={supplierDetail}
      placeholder={t('suppliers:search.placeholder')}
      noResultsText={t('suppliers:search.noResults')}
      hintText={t('suppliers:search.typeToSearch')}
    />
  );
};
