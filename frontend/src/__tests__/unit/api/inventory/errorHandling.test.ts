/**
 * Unit tests for errorHandling.ts
 * Tests error message extraction from API responses
 */
import { describe, it, expect } from 'vitest';
import { errorMessage } from '@/api/inventory/utils/errorHandling';

describe('errorHandling', () => {
  describe('errorMessage()', () => {
    it('should extract message from response.data.message', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Invalid item name' },
        },
      };
      expect(errorMessage(error)).toBe('Invalid item name');
    });

    it('should extract error from response.data.error', () => {
      const error = {
        response: {
          status: 500,
          data: { error: 'Server error occurred' },
        },
      };
      expect(errorMessage(error)).toBe('Server error occurred');
    });

    it('should prefer message over error when both exist', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Validation failed', error: 'Other error' },
        },
      };
      expect(errorMessage(error)).toBe('Validation failed');
    });

    it('should return status-specific message for 403', () => {
      const error = { response: { status: 403, data: {} } };
      expect(errorMessage(error)).toBe('Access denied - Admin permission required');
    });

    it('should return status-specific message for 401', () => {
      const error = { response: { status: 401, data: {} } };
      expect(errorMessage(error)).toBe('Not authenticated - Please log in');
    });

    it('should return status-specific message for 404', () => {
      const error = { response: { status: 404, data: {} } };
      expect(errorMessage(error)).toBe('Item not found');
    });

    it('should return status-specific message for 409', () => {
      const error = { response: { status: 409, data: {} } };
      expect(errorMessage(error)).toBe('Conflict - Name already exists');
    });

    it('should return status-specific message for 400', () => {
      const error = { response: { status: 400, data: {} } };
      expect(errorMessage(error)).toBe('Invalid input');
    });

    it('should handle Error instances', () => {
      const error = new Error('Network timeout');
      expect(errorMessage(error)).toBe('Network timeout');
    });

    it('should return generic message for unknown errors', () => {
      expect(errorMessage('random string')).toBe('Request failed');
      expect(errorMessage(null)).toBe('Request failed');
      expect(errorMessage(undefined)).toBe('Request failed');
      expect(errorMessage({})).toBe('Request failed');
    });

    it('should handle errors without response', () => {
      expect(errorMessage({ message: 'No response' })).toBe('Request failed');
    });
  });
});
