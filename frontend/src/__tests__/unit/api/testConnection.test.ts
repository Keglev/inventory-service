/**
 * Unit tests for testConnection.ts
 * Tests health check and session validation functions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testConnection, checkSession, type AppUserProfile } from '@/api/testConnection';
import httpClient from '@/api/httpClient';

vi.mock('@/api/httpClient');

describe('testConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('testConnection()', () => {
    it('should return true when health check succeeds', async () => {
      vi.mocked(httpClient.get).mockResolvedValue({ status: 200, data: {} });
      const result = await testConnection();
      expect(result).toBe(true);
      expect(httpClient.get).toHaveBeenCalledWith('/api/health/db');
    });

    it('should return false when health check fails', async () => {
      vi.mocked(httpClient.get).mockRejectedValue(new Error('Network error'));
      const result = await testConnection();
      expect(result).toBe(false);
    });

    it('should return false on non-200 status', async () => {
      vi.mocked(httpClient.get).mockRejectedValue({ response: { status: 500 } });
      const result = await testConnection();
      expect(result).toBe(false);
    });
  });

  describe('checkSession()', () => {
    const mockUser: AppUserProfile = {
      id: '123',
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'USER',
    };

    it('should return user profile when session is valid', async () => {
      vi.mocked(httpClient.get).mockResolvedValue({ data: mockUser, status: 200 });
      const result = await checkSession();
      expect(result).toEqual(mockUser);
      expect(httpClient.get).toHaveBeenCalledWith('/api/me');
    });

    it('should return null when session is invalid (401)', async () => {
      vi.mocked(httpClient.get).mockRejectedValue({ response: { status: 401 } });
      const result = await checkSession();
      expect(result).toBeNull();
    });

    it('should return null on network error', async () => {
      vi.mocked(httpClient.get).mockRejectedValue(new Error('Network error'));
      const result = await checkSession();
      expect(result).toBeNull();
    });
  });
});
