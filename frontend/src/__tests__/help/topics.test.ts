/**
 * @file topics.test.ts
 * @module __tests__/help/topics
 * @description Contract tests for the help topics registry and public helpers.
 *
 * Contract under test:
 * - `HELP_TOPICS` entries are internally consistent (key === topic.id) and contain valid i18n keys.
 * - `getHelpTopic(id)` returns the registry entry for known IDs and `undefined` otherwise.
 * - Backward-compat alias: `inventory.manage` intentionally maps to the same i18n keys as `inventory.overview`.
 *
 * Out of scope:
 * - i18n resource presence (translation files).
 * - UI rendering of help content.
 *
 * Test strategy:
 * - Treat this as a data + pure-function contract.
 * - Use table-driven assertions and only pin IDs that are explicit compatibility contracts.
 */

import { describe, expect, it } from 'vitest';
import { HELP_TOPICS, getHelpTopic } from '@/help/topics';

// Categories are treated as stable navigation buckets.
const CATEGORIES = ['analytics', 'general', 'inventory', 'settings', 'suppliers'] as const;

describe('help topic registry', () => {
  it('keeps registry keys and topic metadata consistent', () => {
    // This protects against accidental drift when adding/removing topics.
    for (const [key, topic] of Object.entries(HELP_TOPICS)) {
      expect(topic.id).toBe(key);
      expect(topic.titleKey).toMatch(/^help:/);
      expect(topic.bodyKey).toMatch(/^help:/);
      expect(CATEGORIES).toContain(topic.category);
    }
  });
});

describe('getHelpTopic(id)', () => {
  it('returns the registry entry for known IDs (by reference)', () => {
    const topic = getHelpTopic('app.main');
    expect(topic).toBe(HELP_TOPICS['app.main']);
  });

  it('returns undefined for unknown IDs', () => {
    expect(getHelpTopic('nonexistent.topic')).toBeUndefined();
  });

  it('preserves the inventory alias compatibility contract', () => {
    // `inventory.manage` is an alias to keep older deep-links and references working.
    const overview = getHelpTopic('inventory.overview');
    const manage = getHelpTopic('inventory.manage');

    expect(overview).toBeDefined();
    expect(manage).toBeDefined();
    expect(manage?.titleKey).toBe(overview?.titleKey);
    expect(manage?.bodyKey).toBe(overview?.bodyKey);
  });
});
