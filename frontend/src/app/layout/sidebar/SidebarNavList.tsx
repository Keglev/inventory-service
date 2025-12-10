/**
 * @file SidebarNavList.tsx
 * @module app/layout/sidebar/SidebarNavList
 *
 * @summary
 * Navigation items list extracted from sidebar footer.
 * Renders all navigation items from centralized navConfig with route matching.
 *
 * @enterprise
 * - Centralized navigation from navConfig module
 * - i18n translation with type casting for dynamic keys
 * - Route matching for active state highlighting
 * - Support for disabled navigation items via feature flags
 * - Full TypeDoc coverage for navigation rendering logic
 */

import {
  List,
  Box,
  Divider,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from '../navConfig';
import NavItem from './NavItem';

interface SidebarNavListProps {
  /** Callback for logout action */
  onLogout: () => void;
}

/**
 * Sidebar navigation list component.
 *
 * Renders all navigation items from navConfig and logout button.
 * Navigation items support disabled state with tooltips.
 *
 * @param props - Component props
 * @returns JSX element rendering navigation list with logout button
 *
 * @example
 * ```tsx
 * <SidebarNavList onLogout={handleLogout} />
 * ```
 */
export default function SidebarNavList({ onLogout }: SidebarNavListProps) {
  const { t } = useTranslation(['common']);

  return (
    <>
      {/* Navigation Items */}
      <Box sx={{ py: 0.25 }}>
        <List>
          {NAV_ITEMS.map((item) => {
            // Cast label key to bypass strict type checking for dynamic i18n keys
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const translatedLabel = t(item.label as any);
            return (
              <NavItem
                key={item.route}
                to={item.route}
                icon={item.icon}
                label={translatedLabel}
                disabled={item.disabled}
                tooltip={item.tooltip}
              />
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* Logout Button */}
      <Box sx={{ p: 1 }}>
        <ListItemButton onClick={onLogout} sx={{ borderRadius: 1 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary={t('nav.logout')} />
        </ListItemButton>
      </Box>
    </>
  );
}
