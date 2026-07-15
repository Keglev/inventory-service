/**
 * @file SidebarNavList.tsx
 * @module app/layout/sidebar/SidebarNavList
 *
 * @summary
 * Navigation items list extracted from sidebar footer.
 * Renders all navigation items from centralized navConfig with route matching.
 *
 * @enterprise
 * - Iterates NAV_ITEMS from navConfig rather than inlining route definitions — nav structure is owned by navConfig, rendering is owned here.
 * - NAV_ITEMS labels are typed i18n keys, so t(item.label) is key-checked at compile time; a renamed or removed key fails the build instead of silently returning the raw key at runtime.
 * - Logout button lives in this list rather than in the sidebar footer actions, keeping all navigation-style actions (go somewhere / leave) visually grouped.
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
            const translatedLabel = t(item.label);
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
