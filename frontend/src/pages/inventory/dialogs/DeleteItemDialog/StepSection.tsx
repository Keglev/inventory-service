/**
 * @file StepSection.tsx
 * @module pages/inventory/dialogs/DeleteItemDialog/StepSection
 *
 * @summary
 * Presentational step wrapper for the delete flow: a numbered badge with a
 * title, plus indented content. Extracted from DeleteFormView (ST-APP13).
 */

import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function StepSection({
  title,
  number,
  children,
}: {
  title: string;
  number: number;
  children: ReactNode;
}) {
  return (
    <Box>
      {/* Step header: numbered badge + title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {number}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      {/* Step content: indented to show hierarchy */}
      <Box sx={{ pl: 4 }}>{children}</Box>
    </Box>
  );
}
