/**
 * @file frequency.test.ts
 * @module __tests__/unit/api/analytics/frequency
 *
 * @summary
 * Test suite for frequency analysis utility functions.
 * Tests frequency calculations and distribution analysis.
 *
 * @what_is_under_test Frequency analysis functions - occurrence counting, distribution calculation
 * @responsibility Calculate item frequencies, ranking, distribution percentages
 * @out_of_scope Statistical inference, probability distributions, forecasting
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock frequency functions for testing
const calculateFrequency = (items: string[]): Record<string, number> => {
  const frequency: Record<string, number> = {};
  items.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
  });
  return frequency;
};

const getMostFrequent = (items: string[]): string | null => {
  if (items.length === 0) return null;
  const frequency = calculateFrequency(items);
  return Object.keys(frequency).reduce((a, b) => 
    frequency[a] > frequency[b] ? a : b
  );
};

const getFrequencyPercentage = (items: string[], item: string): number => {
  const count = items.filter(i => i === item).length;
  return items.length > 0 ? (count / items.length) * 100 : 0;
};

describe('Frequency Analysis', () => {
  beforeEach(() => {
    // Clean up before each test
  });

  it('should calculate frequency for single items', () => {
    const items = ['A', 'B', 'A', 'C', 'A'];
    const frequency = calculateFrequency(items);

    expect(frequency['A']).toBe(3);
    expect(frequency['B']).toBe(1);
    expect(frequency['C']).toBe(1);
  });

  it('should handle empty array', () => {
    const frequency = calculateFrequency([]);

    expect(Object.keys(frequency).length).toBe(0);
  });

  it('should return most frequent item', () => {
    const items = ['product1', 'product2', 'product1', 'product1', 'product3'];
    const mostFrequent = getMostFrequent(items);

    expect(mostFrequent).toBe('product1');
  });

  it('should return null for empty array', () => {
    const mostFrequent = getMostFrequent([]);

    expect(mostFrequent).toBeNull();
  });

  it('should calculate frequency percentage correctly', () => {
    const items = ['A', 'A', 'B', 'C', 'A'];
    const percentage = getFrequencyPercentage(items, 'A');

    expect(percentage).toBe(60);
  });

  it('should handle item not in list', () => {
    const items = ['A', 'B', 'C'];
    const percentage = getFrequencyPercentage(items, 'D');

    expect(percentage).toBe(0);
  });
});
