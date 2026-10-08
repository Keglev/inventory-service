/**
 * @file MenuSectionsRenderer.tsx
 * @module app/HamburgerMenu/MenuContent/MenuSectionsRenderer
 *
 * @summary
 * User menu body: profile, Settings entry, help links and system info; this is
 * the only place the order is defined.
 *
 * @enterprise
 * - Mirrors the SAP Fiori user menu (FW5 fork 1): identity first, then entry
 *   points. Preferences are edited only in the settings dialog, so the menu
 *   holds none of them.
 * - Each block is wrapped in <Box onClick={onClose}> (or calls onClose) so any
 *   click dismisses the popover; onClose is threaded here rather than owned by
 *   the sections. Mounted only by HamburgerMenu.tsx.
 */

import { Box, Divider, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTranslation } from 'react-i18next';
import ProfileMenuSection from '../ProfileMenuSection';
import HelpDocsMenuSection from '../HelpDocsMenuSection';
import SystemInfoMenuSection from '../SystemInfoMenuSection';

interface MenuSectionsRendererProps {
  /** Opens the settings dialog */
  onSettingsOpen: () => void;

  /** Closes the popover Menu; shared across all section wrappers */
  onClose: () => void;
}

export default function MenuSectionsRenderer({ onSettingsOpen, onClose }: MenuSectionsRendererProps) {
  const { t } = useTranslation(['common']);

  const handleSettings = () => {
    onClose();
    onSettingsOpen();
  };

  return (
    <>
      <Box onClick={onClose}>
        <ProfileMenuSection />
      </Box>

      <Divider />

      <MenuItem onClick={handleSettings}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t('menu.settings')} />
      </MenuItem>

      <Divider />

      <Box onClick={onClose}>
        <HelpDocsMenuSection />
      </Box>

      <Divider />

      <Box onClick={onClose}>
        <SystemInfoMenuSection />
      </Box>

      <Divider />
    </>
  );
}
