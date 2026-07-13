/**
 * @file navConfig.test.ts
 * @module __tests__/app/layout/navConfig
 * @description Sidebar navigation configuration contract.
 *
 * Contract under test:
 * - NAV_ITEMS order, routes, i18n label keys, and help-topic wiring.
 * - getHelpTopicForRoute prefix matching for every known route plus the
 *   Main fallback for unknown paths.
 */
import { describe, it, expect } from 'vitest';

import {
  AppRoutes,
  HelpTopics,
  NAV_ITEMS,
  getHelpTopicForRoute,
} from '../../../app/layout/navConfig';

describe('app/layout/navConfig', () => {
  it('defines the four sidebar items in display order with route/label/help wiring', () => {
    expect(NAV_ITEMS.map((i) => i.route)).toEqual([
      AppRoutes.Dashboard,
      AppRoutes.Inventory,
      AppRoutes.Suppliers,
      AppRoutes.Analytics,
    ]);
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      'nav.dashboard',
      'nav.inventory',
      'nav.suppliers',
      'nav.analytics',
    ]);
    expect(NAV_ITEMS.map((i) => i.helpTopic)).toEqual([
      HelpTopics.Dashboard,
      HelpTopics.Inventory,
      HelpTopics.Suppliers,
      HelpTopics.Analytics,
    ]);
    // Every item carries a renderable icon component (MUI icons are
    // memo/forwardRef exotic components, so "defined" is the contract).
    for (const item of NAV_ITEMS) {
      expect(item.icon).toBeTruthy();
    }
  });

  it('reuses the Main help topic for the Dashboard by design', () => {
    expect(HelpTopics.Dashboard).toBe(HelpTopics.Main);
  });

  describe('getHelpTopicForRoute', () => {
    it('maps each known route prefix to its help topic', () => {
      expect(getHelpTopicForRoute('/inventory')).toBe(HelpTopics.Inventory);
      expect(getHelpTopicForRoute('/inventory/anything')).toBe(HelpTopics.Inventory);
      expect(getHelpTopicForRoute('/analytics/overview')).toBe(HelpTopics.Analytics);
      expect(getHelpTopicForRoute('/suppliers')).toBe(HelpTopics.Suppliers);
      expect(getHelpTopicForRoute('/dashboard')).toBe(HelpTopics.Dashboard);
    });

    it('falls back to the Main topic for unknown paths', () => {
      expect(getHelpTopicForRoute('/settings')).toBe(HelpTopics.Main);
      expect(getHelpTopicForRoute('/')).toBe(HelpTopics.Main);
    });
  });
});
