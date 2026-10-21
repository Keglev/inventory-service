/**
 * @file ReadOnlyField.tsx
 * @module components/ui/ReadOnlyField
 * @summary Shaded panel that shows a value the user sees but does not edit in a
 *   form step: a label, the value in bold, and an optional hint below.
 *
 * @enterprise
 * - Consumers: the item name step of EditItemForm and both steps of the supplier
 *   edit dialog (EditSupplierInfoStep, EditSupplierConfirmation). The three held
 *   the same markup until FO5; one copy keeps the panel identical across dialogs.
 * - Caller-side i18n: label and hint arrive translated; the component reads no
 *   namespace, so inventory and supplier dialogs share it.
 * - Not an input: no role or label association, because nothing here is
 *   focusable. The value is the text a screen reader reads after the label.
 */
import * as React from 'react';
import { Box, Typography } from '@mui/material';

export interface ReadOnlyFieldProps {
  /** Translated label above the value. */
  label: React.ReactNode;
  /** The value shown in bold. */
  value: React.ReactNode;
  /** Optional translated note below the value, e.g. why it cannot change. */
  hint?: React.ReactNode;
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value, hint }) => (
  <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, mb: 2 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
      {value}
    </Typography>
    {hint && (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        {hint}
      </Typography>
    )}
  </Box>
);

export default ReadOnlyField;
