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
 * - No sign-out entry: signing out lives in the user menu only (FW5 fork 1, SAP Fiori pattern).
 */

import {
  List,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from '../navConfig';
import NavItem from './NavItem';

/**
 * Sidebar navigation list component.
 *
 * Renders all navigation items from navConfig.
 * Navigation items support disabled state with tooltips.
 *
 * @returns JSX element rendering the navigation list
 *
 * @example
 * ```tsx
 * <SidebarNavList />
 * ```
 */
export default function SidebarNavList() {
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
    </>
  );
}
