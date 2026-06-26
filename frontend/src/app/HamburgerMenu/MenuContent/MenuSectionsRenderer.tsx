/**
 * @file MenuSectionsRenderer.tsx
 * @module app/HamburgerMenu/MenuContent/MenuSectionsRenderer
 *
 * @summary
 * Composes the six section coordinators with Dividers between them; this is
 * the only place section ordering is defined.
 *
 * @enterprise
 * Each section is wrapped in <Box onClick={onClose}> so any click inside a
 * section dismisses the popover Menu — onClose is threaded here as a sibling
 * concern rather than owned by individual sections. Mounted exclusively by
 * the root HamburgerMenu.tsx via the MenuContent barrel.
 */

import { Box, Divider } from '@mui/material';
import ProfileMenuSection from '../ProfileMenuSection';
import AppearanceMenuSection from '../AppearanceMenuSection';
import LanguageRegionMenuSection from '../LanguageRegionMenuSection';
import NotificationsMenuSection from '../NotificationsMenuSection';
import HelpDocsMenuSection from '../HelpDocsMenuSection';
import SystemInfoMenuSection from '../SystemInfoMenuSection';
import type { SupportedLocale } from '../../../theme';

interface MenuSectionsRendererProps {
  /** Current theme mode (light or dark) */
  themeMode: 'light' | 'dark';

  /** Callback when theme mode changes */
  onThemeModeChange: (mode: 'light' | 'dark') => void;

  /** Current locale setting */
  locale: SupportedLocale;

  /** Callback when locale changes */
  onLocaleChange: (locale: SupportedLocale) => void;

  /** Closes the popover Menu; shared across all section wrappers */
  onClose: () => void;
}

export default function MenuSectionsRenderer({
  themeMode,
  onThemeModeChange,
  locale,
  onLocaleChange,
  onClose,
}: MenuSectionsRendererProps) {
  return (
    <>
      <Box onClick={onClose}>
        <ProfileMenuSection />
      </Box>

      <Divider />

      <Box onClick={onClose}>
        <AppearanceMenuSection themeMode={themeMode} onThemeModeChange={onThemeModeChange} />
      </Box>

      <Divider />

      <Box onClick={onClose}>
        <LanguageRegionMenuSection locale={locale} onLocaleChange={onLocaleChange} />
      </Box>

      <Divider />

      <Box onClick={onClose}>
        <NotificationsMenuSection />
      </Box>

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
