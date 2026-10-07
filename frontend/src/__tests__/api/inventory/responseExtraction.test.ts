/**
 * @file responseExtraction.test.ts
 * @module tests/unit/api/inventory/responseExtraction
 * @description Contract tests for extractPageTotal.
 *
 * Contract under test:
 * - Guarantees safe response-shape extraction contracts used by
 *   the paged fetchers: the helper must tolerate unknown inputs, never
 *   throw, and return deterministic empty fallbacks when data is absent.
 *
 * Out of scope:
 * - Downstream normalization behavior (handled by row/DTO normalizer
 *   unit tests).
 */

import { describe, expect, it } from 'vitest';

import { extractPageTotal } from '@/api/shared/responseExtraction';

describe('extractPageTotal', () => {
  it('reads the total nested under page (Spring Data PagedModel)', () => {
    expect(extractPageTotal({ content: [], page: { size: 10, number: 2, totalElements: 21, totalPages: 3 } })).toBe(21);
  });

  it('ignores a top-level total (the retired PageImpl shape)', () => {
    expect(extractPageTotal({ content: [], totalElements: 21, number: 2 })).toBeUndefined();
    expect(extractPageTotal({ page: { size: 10 }, totalElements: 9 })).toBeUndefined();
    expect(extractPageTotal({ page: 3, totalElements: 9 })).toBeUndefined();
  });

  it('returns undefined when the page carries no number', () => {
    expect(extractPageTotal({ content: [] })).toBeUndefined();
    expect(extractPageTotal({ page: { totalElements: 'many' } })).toBeUndefined();
    expect(extractPageTotal(null)).toBeUndefined();
  });
});
