/**
 * @file HealthBadge.test.tsx
 *
 * @what_is_under_test HealthBadge component
 * @responsibility Displays real-time system health status (backend and database) with color-coded badges
 * @out_of_scope Health check API implementation, health polling logic, tooltip click actions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HealthBadge from '../../../app/layout/header/HealthBadge';

// Mock useHealthCheck hook
const mockHealthCheck = vi.fn();

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

// Mock health check feature
vi.mock('../../../features/health', () => ({
  useHealthCheck: () => mockHealthCheck(),
}));

describe('HealthBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('System online state', () => {
    it('renders "System OK" when backend and database are online', () => {
      mockHealthCheck.mockReturnValue({
        health: { status: 'online', database: 'online', responseTime: 45 },
      });

      render(<HealthBadge />);
      expect(screen.getByText('System OK')).toBeInTheDocument();
    });

    it('renders success color when all systems online', () => {
      mockHealthCheck.mockReturnValue({
        health: { status: 'online', database: 'online', responseTime: 45 },
      });

      const { container } = render(<HealthBadge />);
      const chip = container.querySelector('.MuiChip-colorSuccess');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Degraded state', () => {
    // Business rule: Backend is online but database connectivity has issues
    it('renders "Degraded" when backend is online but database is offline', () => {
      mockHealthCheck.mockReturnValue({
        health: { status: 'online', database: 'offline', responseTime: 120 },
      });

      render(<HealthBadge />);
      expect(screen.getByText('Degraded')).toBeInTheDocument();
    });

    it('renders warning color when system is degraded', () => {
      mockHealthCheck.mockReturnValue({
        health: { status: 'online', database: 'offline', responseTime: 120 },
      });

      const { container } = render(<HealthBadge />);
      const chip = container.querySelector('.MuiChip-colorWarning');
      expect(chip).toBeInTheDocument();
    });
  });

  describe('Offline state', () => {
    it('renders "Offline" when backend is offline', () => {
      mockHealthCheck.mockReturnValue({
        health: { status: 'offline', database: 'offline', responseTime: 0 },
      });

      render(<HealthBadge />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });

    it('renders error color when backend is offline', () => {
      mockHealthCheck.mockReturnValue({
        health: { status: 'offline', database: 'offline', responseTime: 0 },
      });

      const { container } = render(<HealthBadge />);
      const chip = container.querySelector('.MuiChip-colorError');
      expect(chip).toBeInTheDocument();
    });

    it('renders "Offline" even if database status is unknown', () => {
      mockHealthCheck.mockReturnValue({
        health: { status: 'offline', database: 'online', responseTime: 0 },
      });

      render(<HealthBadge />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('uses app.health.okLabel translation key', () => {
      mockHealthCheck.mockReturnValue({
        health: { status: 'online', database: 'online', responseTime: 45 },
      });

      render(<HealthBadge />);
      expect(screen.getByText('System OK')).toBeInTheDocument();
    });

    it('uses app.health.degradedLabel translation key', () => {
      mockHealthCheck.mockReturnValue({
        health: { status: 'online', database: 'offline', responseTime: 120 },
      });

      render(<HealthBadge />);
      expect(screen.getByText('Degraded')).toBeInTheDocument();
    });

    it('uses app.health.downLabel translation key', () => {
      mockHealthCheck.mockReturnValue({
        health: { status: 'offline', database: 'offline', responseTime: 0 },
      });

      render(<HealthBadge />);
      expect(screen.getByText('Offline')).toBeInTheDocument();
    });
  });

  describe('Health status combinations', () => {
    // Testing all possible backend/database combinations
    const testCases = [
      { backend: 'online', db: 'online', expected: 'System OK', color: 'success' },
      { backend: 'online', db: 'offline', expected: 'Degraded', color: 'warning' },
      { backend: 'offline', db: 'online', expected: 'Offline', color: 'error' },
      { backend: 'offline', db: 'offline', expected: 'Offline', color: 'error' },
    ];

    testCases.forEach(({ backend, db, expected, color }) => {
      it(`renders "${expected}" with ${color} color when backend is ${backend} and db is ${db}`, () => {
        mockHealthCheck.mockReturnValue({
          health: { status: backend, database: db, responseTime: backend === 'online' ? 50 : 0 },
        });

        const { container } = render(<HealthBadge />);
        expect(screen.getByText(expected)).toBeInTheDocument();
        
        const colorClass = color.charAt(0).toUpperCase() + color.slice(1);
        const chip = container.querySelector(`.MuiChip-color${colorClass}`);
        expect(chip).toBeInTheDocument();
      });
    });
  });
});
