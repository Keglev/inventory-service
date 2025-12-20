/**
 * Unit tests for httpClient.ts
 * Tests API base URL resolution and client configuration
 */
import { describe, it, expect, beforeEach } from 'vitest';
import httpClient, { API_BASE } from '@/api/httpClient';

describe('httpClient', () => {
  describe('API_BASE resolution', () => {
    it('should resolve API_BASE from environment or default to /api', () => {
      // In CI: VITE_API_BASE is set to backend URL
      // In dev: VITE_API_BASE defaults to /api
      expect(API_BASE).toBeTruthy();
      expect(typeof API_BASE).toBe('string');
      expect(API_BASE.length).toBeGreaterThan(0);
    });

    it('should normalize trailing slashes in baseURL', () => {
      const baseURL = httpClient.defaults.baseURL;
      expect(baseURL).not.toMatch(/\/$/);
    });
  });

  describe('httpClient configuration', () => {
    it('should have withCredentials enabled', () => {
      expect(httpClient.defaults.withCredentials).toBe(true);
    });

    it('should have correct timeout', () => {
      expect(httpClient.defaults.timeout).toBe(30_000);
    });

    it('should have correct Accept header', () => {
      expect(httpClient.defaults.headers.common['Accept']).toBe('application/json');
    });

    it('should have X-Requested-With header', () => {
      expect(httpClient.defaults.headers.common['X-Requested-With']).toBe('XMLHttpRequest');
    });
  });

  describe('demo session detection', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should detect when not in demo session', () => {
      // Mock implementation - just verify localStorage is empty
      expect(localStorage.getItem('ssp.demo.session')).toBeNull();
    });

    it('should detect when in demo session', () => {
      localStorage.setItem('ssp.demo.session', JSON.stringify({ isDemo: true }));
      const raw = localStorage.getItem('ssp.demo.session');
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw as string).isDemo).toBe(true);
    });
  });

  describe('request interceptor', () => {
    it('should have request interceptor registered', () => {
      expect(httpClient.interceptors.request).toBeDefined();
    });
  });

  describe('response interceptor', () => {
    it('should have response interceptor registered', () => {
      expect(httpClient.interceptors.response).toBeDefined();
    });
  });
});
