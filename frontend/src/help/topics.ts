/**
 * @file topics.ts
 * @description
 * Central registry of all help topics with metadata.
 * Each topic maps to i18n keys for title and body content.
 *
 * @enterprise
 * - Single source of truth for topic definitions
 * - Type-safe topic IDs
 * - Easy to add/remove topics
 * - Categories for future organization
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

/**
 * Registry of all help topics
 * Add new topics here and they'll automatically be available system-wide
 */
export const HELP_TOPICS: Record<string, HelpTopic> = {
  'app.main': {
    id: 'app.main',
    titleKey: 'help:app.main.title',
    bodyKey: 'help:app.main.body',
    linkKey: 'help:app.main.link',
    category: 'general',
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

/**
 * Get a help topic by ID
 * @param id - Topic ID
 * @returns Help topic or undefined if not found
 * @example
 * const topic = getHelpTopic('app.main')
 */
export function getHelpTopic(id: string): HelpTopic | undefined {
  return HELP_TOPICS[id];
}

/**
 * Get all help topics by category
 * @param category - Category to filter by
 * @returns Array of topics in that category
 */
export function getTopicsByCategory(category: HelpTopic['category']): HelpTopic[] {
  return Object.values(HELP_TOPICS).filter((topic) => topic.category === category);
}

/**
 * Get all unique categories
 * @returns Array of category names
 */
export function getAllCategories(): HelpTopic['category'][] {
  const categories = new Set(Object.values(HELP_TOPICS).map((topic) => topic.category));
  return Array.from(categories).sort();
}
