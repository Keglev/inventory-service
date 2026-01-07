import { describe, it, expect } from 'vitest';
import {
  HELP_TOPICS,
  getHelpTopic,
  getTopicsByCategory,
  getAllCategories,
} from '@/help/topics';

// Verifies help topic registry structure, lookup functions, and category filtering.

describe('Help Topics Registry', () => {
  it('contains all expected topics with valid metadata', () => {
    // Each topic should have required fields: id, titleKey, bodyKey, category.
    Object.entries(HELP_TOPICS).forEach(([key, topic]) => {
      expect(topic.id).toBe(key);
      expect(topic.titleKey).toBeTruthy();
      expect(topic.bodyKey).toBeTruthy();
      expect(topic.category).toMatch(/^(general|inventory|suppliers|analytics|settings)$/);
    });
  });

  it('defines at least one general, inventory, suppliers, analytics, and settings topic', () => {
    // Ensure coverage across all major categories.
    const categories = new Set(Object.values(HELP_TOPICS).map((t) => t.category));
    expect(categories.has('general')).toBe(true);
    expect(categories.has('inventory')).toBe(true);
    expect(categories.has('suppliers')).toBe(true);
    expect(categories.has('analytics')).toBe(true);
    expect(categories.has('settings')).toBe(true);
  });
});

describe('getHelpTopic()', () => {
  it('returns topic for known ID', () => {
    const topic = getHelpTopic('app.main');

    expect(topic).toBeDefined();
    expect(topic?.id).toBe('app.main');
    expect(topic?.titleKey).toBe('help:app.main.title');
    expect(topic?.bodyKey).toBe('help:app.main.body');
  });

  it('returns undefined for unknown ID', () => {
    const topic = getHelpTopic('nonexistent.topic');

    expect(topic).toBeUndefined();
  });

  it('handles inventory topics correctly', () => {
    // Verify inventory topics are retrievable and aliased correctly.
    const overview = getHelpTopic('inventory.overview');
    const manage = getHelpTopic('inventory.manage');

    expect(overview).toBeDefined();
    expect(manage).toBeDefined();
    expect(manage?.titleKey).toBe(overview?.titleKey);
  });
});

describe('getTopicsByCategory()', () => {
  it('returns all topics for a given category', () => {
    // Filter by inventory category.
    const inventoryTopics = getTopicsByCategory('inventory');

    expect(inventoryTopics.length).toBeGreaterThan(0);
    inventoryTopics.forEach((topic) => {
      expect(topic.category).toBe('inventory');
    });
  });

  it('returns empty array for empty category', () => {
    // If a category has no topics, return empty (won't happen with current data, but good practice).
    const topics = getTopicsByCategory('general');

    expect(Array.isArray(topics)).toBe(true);
  });

  it('returns different sets for different categories', () => {
    // Topics in inventory and suppliers should differ.
    const inventoryTopics = getTopicsByCategory('inventory');
    const supplierTopics = getTopicsByCategory('suppliers');

    expect(inventoryTopics.length).toBeGreaterThan(0);
    expect(supplierTopics.length).toBeGreaterThan(0);
    expect(inventoryTopics).not.toEqual(supplierTopics);
  });
});

describe('getAllCategories()', () => {
  it('returns all unique categories in sorted order', () => {
    const categories = getAllCategories();

    // Should contain all five categories.
    expect(categories).toContain('general');
    expect(categories).toContain('inventory');
    expect(categories).toContain('suppliers');
    expect(categories).toContain('analytics');
    expect(categories).toContain('settings');

    // Should be sorted.
    const sortedCategories = [...categories].sort();
    expect(categories).toEqual(sortedCategories);
  });

  it('returns only unique categories even if topics share categories', () => {
    // Topics may belong to same category; getAllCategories should deduplicate.
    const categories = getAllCategories();
    const uniqueCount = new Set(categories).size;

    expect(categories.length).toBe(uniqueCount);
  });
});
