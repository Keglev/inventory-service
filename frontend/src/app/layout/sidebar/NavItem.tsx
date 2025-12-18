/**
 * @file NavItem.tsx
 * @module app/layout/sidebar/NavItem
 *
 * @summary
 * Individual navigation list item with route matching and disabled state support.
 * Highlights current route and supports feature flag-based disabling.
 *
 * @enterprise
 * - Route matching with active state highlighting
 * - Disabled state with tooltips for feature flags
 * - MUI ListItemButton integration with routing
 * - Full TypeDoc coverage for navigation state and user feedback
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
  const selected = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    try {
      if (localStorage.getItem('debugRouting') === '1') {
        // eslint-disable-next-line no-console
        console.debug('[nav] click -> navigate', to, '| from', window.location.pathname);
      }
    } catch {
      // ignore
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
