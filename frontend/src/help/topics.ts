/**
 * @file topics.ts
 * @module help/topics
 * @summary Static registry mapping help-topic keys to i18n metadata. Text bodies are
 *   NOT stored here — they are resolved by i18next at render time via bodyKey/titleKey.
 *
 * @enterprise
 * - Keys in this registry are stable identifiers; renaming a key breaks any caller
 *   that passes it by string literal (including HelpContext route mappings).
 * - Production consumer: HelpPanel.tsx (components/help/HelpPanel.tsx) looks up a
 *   topic via getHelpTopic(id) and passes the metadata to the renderer.
 * - Route-to-topic mapping lives in navConfig.ts (getHelpTopicForRoute); this file
 *   is route-agnostic.
 * - Import direction: leaf — no React, MUI, context, or feature-code imports.
 */

/**
 * Help topic metadata
 */
export interface HelpTopic {
  /** Unique topic identifier */
  id: string;
  /** i18n key for topic title (e.g., "help:app.main.title") */
  titleKey: string;
  /** i18n key for topic body text (e.g., "help:app.main.body") */
  bodyKey: string;
  /** Optional i18n key for documentation link label */
  linkKey?: string;
  /** Topic category for organization */
  category: 'general' | 'inventory' | 'suppliers' | 'analytics' | 'settings';
}

export const HELP_TOPICS: Record<string, HelpTopic> = {
  'app.main': {
    id: 'app.main',
    titleKey: 'help:app.main.title',
    bodyKey: 'help:app.main.body',
    linkKey: 'help:app.main.link',
    category: 'general',
  },
  'inventory.overview': {
    id: 'inventory.overview',
    titleKey: 'help:inventory.overview.title',
    bodyKey: 'help:inventory.overview.body',
    category: 'inventory',
  },
  // WHY: backward-compat alias; external deep-links may still reference this key.
  // BUCKET: no production caller found outside tests — verify and remove if dead (CB-APP16)
  'inventory.manage': {
    id: 'inventory.manage',
    titleKey: 'help:inventory.overview.title',
    bodyKey: 'help:inventory.overview.body',
    category: 'inventory',
  },
  'inventory.editItem': {
    id: 'inventory.editItem',
    titleKey: 'help:inventory.editItem.title',
    bodyKey: 'help:inventory.editItem.body',
    category: 'inventory',
  },
  'inventory.deleteItem': {
    id: 'inventory.deleteItem',
    titleKey: 'help:inventory.deleteItem.title',
    bodyKey: 'help:inventory.deleteItem.body',
    category: 'inventory',
  },
  'inventory.adjustQuantity': {
    id: 'inventory.adjustQuantity',
    titleKey: 'help:inventory.adjustQuantity.title',
    bodyKey: 'help:inventory.adjustQuantity.body',
    category: 'inventory',
  },
  'inventory.changePrice': {
    id: 'inventory.changePrice',
    titleKey: 'help:inventory.changePrice.title',
    bodyKey: 'help:inventory.changePrice.body',
    category: 'inventory',
  },
  'suppliers.manage': {
    id: 'suppliers.manage',
    titleKey: 'help:suppliers.manage.title',
    bodyKey: 'help:suppliers.manage.body',
    category: 'suppliers',
  },
  'suppliers.delete': {
    id: 'suppliers.delete',
    titleKey: 'help:suppliers.delete.title',
    bodyKey: 'help:suppliers.delete.body',
    category: 'suppliers',
  },
  'analytics.overview': {
    id: 'analytics.overview',
    titleKey: 'help:analytics.overview.title',
    bodyKey: 'help:analytics.overview.body',
    category: 'analytics',
  },
  'settings.preferences': {
    id: 'settings.preferences',
    titleKey: 'help:settings.preferences.title',
    bodyKey: 'help:settings.preferences.body',
    category: 'settings',
  },
};

export function getHelpTopic(id: string): HelpTopic | undefined {
  return HELP_TOPICS[id];
}
