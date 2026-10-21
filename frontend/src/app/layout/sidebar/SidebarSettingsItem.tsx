/**
 * @file SidebarSettingsItem.tsx
 * @module app/layout/sidebar/SidebarSettingsItem
 *
 * @summary
 * The sidebar's settings entry, under the navigation: opens the settings dialog.
 *
 * @enterprise
 * - Settings moved here from the removed hamburger menu (FW6 UX-1, Carlos
 *   2026-10-09), where the avatar menu would otherwise have held both identity
 *   and preferences. It stays the only way into the settings dialog (ADR-0015:
 *   one editor per preference).
 * - A button, not a link: settings is a dialog over the current page, so no
 *   route changes and the entry never shows as selected.
 */
import { ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useTranslation } from 'react-i18next';
import type { SidebarVariant } from './sidebarVariant';
import { railItemSx } from './sidebarVariant';

export interface SidebarSettingsItemProps {
  /** Opens the settings dialog */
  onOpen: () => void;

  /** List row (default) or rail tile */
  variant?: SidebarVariant;
}

/**
 * Settings entry for the sidebar.
 *
 * @param props - open callback and variant
 * @returns a list button in the shape of the surrounding navigation entries
 */
export default function SidebarSettingsItem({ onOpen, variant = 'list' }: SidebarSettingsItemProps) {
  const { t } = useTranslation(['common']);
  const label = t('nav.settings');

  if (variant === 'rail') {
    return (
      <ListItemButton onClick={onOpen} sx={railItemSx}>
        <SettingsOutlinedIcon data-testid="SettingsOutlinedIcon" />
        <Typography variant="caption" sx={{ lineHeight: 1.2, textAlign: 'center' }}>
          {label}
        </Typography>
      </ListItemButton>
    );
  }

  return (
    <ListItemButton onClick={onOpen} sx={{ flexGrow: 0, borderRadius: 1, mx: 1 }}>
      <ListItemIcon sx={{ minWidth: 36 }}>
        <SettingsOutlinedIcon data-testid="SettingsOutlinedIcon" />
      </ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );
}
