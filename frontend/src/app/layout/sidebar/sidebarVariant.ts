/**
 * @file sidebarVariant.ts
 * @module app/layout/sidebar/sidebarVariant
 *
 * @summary
 * The two shapes of a sidebar entry and the tile style the rail shares.
 *
 * @enterprise
 * - Desktop shows an 88 px rail, icon above label; the phone drawer shows full
 *   rows (FW6 UX-1, option A). Navigation and settings entries take the same
 *   variant from SidebarDrawerContent, so one prop decides the whole column.
 */
import type { SxProps, Theme } from '@mui/material';

/** List row (phone drawer) or rail tile (desktop). */
export type SidebarVariant = 'list' | 'rail';

/** Rail tile: icon above a caption, centred, with room for the selected highlight. */
export const railItemSx: SxProps<Theme> = {
  flexGrow: 0,
  flexDirection: 'column',
  alignItems: 'center',
  gap: 0.5,
  borderRadius: 2,
  mx: 1,
  my: 0.5,
  py: 1,
  px: 0.5,
};
