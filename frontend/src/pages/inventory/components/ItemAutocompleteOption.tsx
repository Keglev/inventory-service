/**
 * @file ItemAutocompleteOption.tsx
 * @module pages/inventory/components/ItemAutocompleteOption
 *
 * @summary
 * Reusable component for displaying item options in autocomplete dropdowns.
 * Shows item name, current price, and current quantity for better UX.
 */

import * as React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Extended item type with additional display properties.
 * Combines ItemRef with inventory data for rich autocomplete display.
 */
export interface DisplayableItem {
  /** Unique item identifier */
  id: string;
  /** Item name */
  name: string;
  /** Supplier ID (optional) */
  supplierId?: string | null;
  /** Current quantity on hand */
  onHand?: number;
  /** Current price (optional) */
  currentPrice?: number;
}

export interface ItemAutocompleteOptionProps {
  /** Item data to display */
  item: DisplayableItem;
  /** Additional props to spread to the root component */
  rootProps?: React.HTMLAttributes<HTMLLIElement>;
}

/**
 * Component for rendering item options in autocomplete dropdowns.
 * Displays item name, price, and quantity in a structured format.
 */
export function ItemAutocompleteOption({ item, rootProps }: ItemAutocompleteOptionProps) {
  const { t } = useTranslation(['inventory']);

  return (
    <Box component="li" {...rootProps}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="body2" fontWeight="medium" noWrap>
          {item.name}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {item.currentPrice !== undefined ? (
              t('inventory:price', 'Price: {{price}}', {
                price: new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(item.currentPrice),
              })
            ) : (
              t('inventory:priceNotAvailable', 'Price: N/A')
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {item.onHand !== undefined ? (
              t('inventory:qty', 'Qty: {{quantity}}', { quantity: item.onHand })
            ) : (
              t('inventory:qtyNotAvailable', 'Qty: N/A')
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}