/**
 * @file navConfig.ts
 * @module app/layout/navConfig
 *
 * @summary
 * Navigation configuration metadata for the application sidebar.
 * Defines routes, labels, icons, and contextual properties for all navigation items.
 *
 * @enterprise
 * - Centralized single source of truth for navigation structure
 * - Supports optional disabled state and tooltips for feature flags
 * - Enables dynamic nav generation and help topic routing
 * - Type-safe with strict enum patterns for route consistency
 */

import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InsightsIcon from '@mui/icons-material/Insights';

/**
 * Supported navigation routes in the application.
 * Each route maps to an authenticated page within AppShell.
 */
export const AppRoutes = {
  Dashboard: '/dashboard',
  Inventory: '/inventory',
  Suppliers: '/suppliers',
  Analytics: '/analytics/overview',
} as const;

export type AppRoutesType = (typeof AppRoutes)[keyof typeof AppRoutes];

/**
 * Help topic IDs for context-sensitive help system.
 * Maps routes to their corresponding help documentation topics.
 */
export const HelpTopics = {
  Main: 'app.main',
  Dashboard: 'app.main',
  Inventory: 'inventory.overview',
  Suppliers: 'suppliers.manage',
  Analytics: 'analytics.overview',
} as const;

export type HelpTopicsType = (typeof HelpTopics)[keyof typeof HelpTopics];

/**
 * Navigation item configuration.
 *
 * @property route - Target route path
 * @property label - i18n key for navigation label
 * @property icon - MUI Icon component
 * @property disabled - Optional feature flag to disable navigation
 * @property tooltip - Optional tooltip message when disabled
 * @property helpTopic - Help documentation topic ID for this route
 */
export interface NavItemConfig {
  route: AppRoutesType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  tooltip?: string;
  helpTopic: HelpTopicsType;
}

/**
 * Navigation items array defining the left sidebar menu structure.
 *
 * Order matters: items appear top-to-bottom in the sidebar.
 * Disabled items remain visible but non-interactive with tooltip explanation.
 *
 * @const
 */
export const NAV_ITEMS: NavItemConfig[] = [
  {
    route: AppRoutes.Dashboard,
    label: 'nav.dashboard',
    icon: DashboardIcon,
    helpTopic: HelpTopics.Dashboard,
  },
  {
    route: AppRoutes.Inventory,
    label: 'nav.inventory',
    icon: InventoryIcon,
    helpTopic: HelpTopics.Inventory,
  },
  {
    route: AppRoutes.Suppliers,
    label: 'nav.suppliers',
    icon: LocalShippingIcon,
    helpTopic: HelpTopics.Suppliers,
  },
  {
    route: AppRoutes.Analytics,
    label: 'nav.analytics',
    icon: InsightsIcon,
    helpTopic: HelpTopics.Analytics,
  },
];

/**
 * Get help topic ID based on current route pathname.
 *
 * Matches the current location pathname against known routes
 * and returns the corresponding help topic.
 *
 * @param pathname - Current route pathname from useLocation()
 * @returns HelpTopics enum value for context-sensitive help
 */
export function getHelpTopicForRoute(pathname: string): HelpTopicsType {
  if (pathname.startsWith(AppRoutes.Inventory)) return HelpTopics.Inventory;
  if (pathname.startsWith(AppRoutes.Analytics)) return HelpTopics.Analytics;
  if (pathname.startsWith(AppRoutes.Suppliers)) return HelpTopics.Suppliers;
  if (pathname.startsWith(AppRoutes.Dashboard)) return HelpTopics.Dashboard;
  return HelpTopics.Main;
}
