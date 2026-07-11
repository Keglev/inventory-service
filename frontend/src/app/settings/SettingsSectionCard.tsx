/**
 * @file SettingsSectionCard.tsx
 * @module app/settings/SettingsSectionCard
 *
 * @summary
 * Section wrapper for the settings form: an uppercase section title above an
 * outlined content card. Extracted from AppSettingsForm where the identical
 * Box/Typography/Paper block was repeated three times.
 */

import { Box, Typography, Paper } from '@mui/material';
import type { ReactNode } from 'react';

export function SettingsSectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          mb: 1.5,
          color: 'primary.main',
          textTransform: 'uppercase',
          fontSize: '0.875rem',
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          bgcolor: 'background.default',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {children}
      </Paper>
    </Box>
  );
}
