/**
 * @file NavItem.tsx
 * @module app/layout/sidebar/NavItem
 *
 * @summary
 * Individual navigation list item with route matching and disabled state support.
 * Highlights current route and supports feature flag-based disabling.
 *
 * @enterprise
 * - Active state uses `startsWith` (not exact match) so nested routes like `/inventory/123` correctly highlight the parent nav item.
 * - Disabled items remain visible and non-interactive; tooltip explains the feature-flag reason, preventing silent dead links.
 * - onClick guard prevents default on disabled items rather than relying solely on the `disabled` attribute, which can be bypassed programmatically.
 */

import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

interface NavItemProps {
  /** Route path to navigate to */
  to: string;

  /** MUI Icon component to display */
  icon: React.ElementType;

  /** Navigation label (translated) */
  label: string | undefined;

  /** Whether navigation item is disabled */
  disabled?: boolean;

  /** Tooltip text when disabled */
  tooltip?: string;
}

/**
 * Navigation item component with route matching and disabled state support.
 *
 * Highlights when current route matches navigation item's route.
 * Shows tooltip when disabled via feature flag.
 *
 * @param props - Navigation item configuration
 * @returns JSX element rendering navigation item or wrapped tooltip
 *
 * @example
 * ```tsx
 * <NavItem
 *   to="/dashboard"
 *   icon={DashboardIcon}
 *   label="Dashboard"
 *   disabled={false}
 * />
 * ```
 */
export default function NavItem({
  to,
  icon: Icon,
  label,
  disabled,
  tooltip,
}: NavItemProps) {
  const location = useLocation();
  // startsWith is intentional: activates the nav item for any nested route under `to`.
  const selected = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Let React Router's <Link> handle the navigation.
  };

  const button = (
    <ListItemButton
      component={Link}
      to={to}
      onClick={handleClick}
      selected={selected}
      sx={{ borderRadius: 1, mx: 1 }}
      disabled={disabled}
    >
      <ListItemIcon sx={{ minWidth: 36 }}>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={label} />
    </ListItemButton>
  );

  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
}
