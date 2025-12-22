/**
 * @file urlState.test.ts
 * @module utils/urlState.test
 * 
 * Unit tests for URL query parameter utilities.
 * Tests readParams and writeParams functions for analytics filter state management.
 */

import { describe, it, expect } from 'vitest';
import { readParams, writeParams } from '@/utils/urlState';

describe('readParams', () => {
  it('should read single parameter', () => {
    const result = readParams('?from=2023-01-01', ['from']);
    expect(result).toEqual({ from: '2023-01-01' });
  });

  it('should read multiple parameters', () => {
    const result = readParams('?from=2023-01-01&to=2023-12-31&supplierId=S123', ['from', 'to', 'supplierId']);
    expect(result).toEqual({
      from: '2023-01-01',
      to: '2023-12-31',
      supplierId: 'S123',
    });
  });

  it('should handle missing parameters as undefined', () => {
    const result = readParams('?from=2023-01-01', ['from', 'to', 'supplierId']);
    expect(result).toEqual({
      from: '2023-01-01',
      to: undefined,
      supplierId: undefined,
    });
  });

  it('should strip quotes from supplierId', () => {
    const result = readParams('?supplierId=%22ABC123%22', ['supplierId']);
    expect(result).toEqual({ supplierId: 'ABC123' });
  });

  it('should handle legacy lowercase supplierid', () => {
    const result = readParams('?supplierid=LEG123', ['supplierId']);
    expect(result).toEqual({ supplierId: 'LEG123' });
  });

  it('should prefer supplierId over legacy supplierid', () => {
    const result = readParams('?supplierId=NEW123&supplierid=OLD123', ['supplierId']);
    expect(result).toEqual({ supplierId: 'NEW123' });
  });

  it('should handle search string with leading ?', () => {
    const result = readParams('?key=value', ['key']);
    expect(result).toEqual({ key: 'value' });
  });

  it('should handle search string without leading ?', () => {
    const result = readParams('key=value', ['key']);
    expect(result).toEqual({ key: 'value' });
  });

  it('should strip quotes only from supplierId', () => {
    const result = readParams('?from=%222023-01-01%22&supplierId=%22S123%22', ['from', 'supplierId']);
    expect(result).toEqual({
      from: '"2023-01-01"', // Not stripped for non-supplierId
      supplierId: 'S123',    // Stripped for supplierId
    });
  });

  it('should handle empty quoted supplierId as undefined', () => {
    const result = readParams('?supplierId=%22%22', ['supplierId']);
    expect(result).toEqual({ supplierId: undefined });
  });

  it('should handle URL-encoded values', () => {
    const result = readParams('?from=2023-01-01&name=Test%20Value', ['from', 'name']);
    expect(result).toEqual({
      from: '2023-01-01',
      name: 'Test Value',
    });
  });
});

describe('writeParams', () => {
  it('should add new parameter to empty search', () => {
    const result = writeParams('', { from: '2023-01-01' });
    expect(result).toBe('?from=2023-01-01');
  });

  it('should add multiple parameters', () => {
    const result = writeParams('', { from: '2023-01-01', to: '2023-12-31', supplierId: 'S123' });
    expect(result).toContain('from=2023-01-01');
    expect(result).toContain('to=2023-12-31');
    expect(result).toContain('supplierId=S123');
  });

  it('should update existing parameter', () => {
    const result = writeParams('?from=2023-01-01', { from: '2024-01-01' });
    expect(result).toBe('?from=2024-01-01');
  });

  it('should preserve unmodified parameters', () => {
    const result = writeParams('?from=2023-01-01&to=2023-12-31', { supplierId: 'S123' });
    expect(result).toContain('from=2023-01-01');
    expect(result).toContain('to=2023-12-31');
    expect(result).toContain('supplierId=S123');
  });

  it('should remove parameter when value is undefined', () => {
    const result = writeParams('?from=2023-01-01&to=2023-12-31', { to: undefined });
    expect(result).toBe('?from=2023-01-01');
  });

  it('should remove parameter when value is null', () => {
    const result = writeParams('?from=2023-01-01&to=2023-12-31', { to: null as unknown as string });
    expect(result).toBe('?from=2023-01-01');
  });

  it('should remove parameter when value is empty string', () => {
    const result = writeParams('?from=2023-01-01&to=2023-12-31', { to: '' });
    expect(result).toBe('?from=2023-01-01');
  });

  it('should return empty string when all params removed', () => {
    const result = writeParams('?from=2023-01-01', { from: undefined });
    expect(result).toBe('');
  });

  it('should trim whitespace from values', () => {
    const result = writeParams('', { from: '  2023-01-01  ' });
    expect(result).toBe('?from=2023-01-01');
  });

  it('should handle multiple updates and removals', () => {
    const result = writeParams('?from=2023-01-01&to=2023-12-31&supplierId=OLD', {
      from: '2024-01-01',
      to: undefined,
      supplierId: 'NEW',
      extra: 'value',
    });
    expect(result).toContain('from=2024-01-01');
    expect(result).not.toContain('to=');
    expect(result).toContain('supplierId=NEW');
    expect(result).toContain('extra=value');
  });
});
