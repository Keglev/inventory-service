/**
 * @file MenuSectionsRenderer.tsx
 * @module app/HamburgerMenu/MenuContent/MenuSectionsRenderer
 *
 * @summary
 * User menu body: profile, Settings and About entries, help links; this is the
 * only place the order is defined.
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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';
import ProfileMenuSection from '../ProfileMenuSection';
import HelpDocsMenuSection from '../HelpDocsMenuSection';

interface MenuSectionsRendererProps {
  /** Opens the settings dialog */
  onSettingsOpen: () => void;

  /** Opens the About dialog (version, build, environment, backend) */
  onAboutOpen: () => void;

  /** Closes the popover Menu; shared across all section wrappers */
  onClose: () => void;
}

export default function MenuSectionsRenderer({ onSettingsOpen, onAboutOpen, onClose }: MenuSectionsRendererProps) {
  const { t } = useTranslation(['common']);

  // WHY: close the menu first so focus returns to the trigger before the dialog takes it.
  const openAfterClose = (open: () => void) => () => {
    onClose();
    open();
  };

  return (
    <>
      <Box onClick={onClose}>
        <ProfileMenuSection />
      </Box>

      <Divider />

      <MenuItem onClick={openAfterClose(onSettingsOpen)}>
        <ListItemIcon>
          <SettingsIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t('menu.settings')} />
      </MenuItem>

      <MenuItem onClick={openAfterClose(onAboutOpen)}>
        <ListItemIcon>
          <InfoOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t('menu.about')} />
      </MenuItem>

      <Divider />

      <Box onClick={onClose}>
        <HelpDocsMenuSection />
      </Box>


      <Divider />
    </>
  );
}
