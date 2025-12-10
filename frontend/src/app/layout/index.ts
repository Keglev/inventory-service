/**
 * @file index.ts
 * @module app/layout
 *
 * @summary
 * Barrel export for layout components and utilities.
 * Provides centralized access to AppShell orchestrator and navigation configuration.
 */

export { default as AppShell } from './AppShell';
export { NAV_ITEMS, AppRoutes, HelpTopics, getHelpTopicForRoute } from './navConfig';
export type { NavItemConfig } from './navConfig';
