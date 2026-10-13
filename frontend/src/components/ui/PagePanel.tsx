/**
 * @file PagePanel.tsx
 * @module components/ui/PagePanel
 * @summary The flat full-height panel a board page (inventory, suppliers) lays its
 *   header, filters and grid on, with an optional slot for its dialogs.
 *
 * @enterprise
 * - Both boards repeated the same column box and flat Paper (jscpd, G-L7); one
 *   component keeps them identical, including the square corner next to the rail
 *   (theme/pagePanel.ts explains why the panel has no radius or shadow).
 * - `overlays` render after the panel, outside it, as the boards did: dialogs
 *   portal to the body, so they take no room in the column either way, and the
 *   DOM order stays the one the boards had before the extraction.
 */
import type { PropsWithChildren, ReactNode } from 'react';
import { Box, Paper } from '@mui/material';
import { pagePanelSx } from '../../theme/pagePanel';

/** Props accepted by {@link PagePanel}. */
export type PagePanelProps = PropsWithChildren<{
  /** Rendered after the panel, e.g. the page's dialogs. */
  overlays?: ReactNode;
}>;

/**
 * Renders the board panel.
 *
 * @param props - {@link PagePanelProps}
 */
export function PagePanel({ children, overlays }: PagePanelProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 2 }}>
      <Paper
        elevation={0}
        sx={{
          ...pagePanelSx,
          p: 0,
          bgcolor: 'background.paper',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Paper>
      {overlays}
    </Box>
  );
}
