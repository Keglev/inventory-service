/**
 * @file HealthStatusDisplay.test.tsx
 * @module __tests__/app/footer/HealthStatusDisplay
 * @description Tests for system health status display component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HealthStatusDisplay from '../../../app/footer/HealthStatusDisplay';

// Hoisted mock
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('HealthStatusDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders backend status label', () => {
    render(
      <HealthStatusDisplay
        health={{ status: 'online', responseTime: 125, database: 'online' }}
      />
    );
    expect(screen.getByText('Backend')).toBeInTheDocument();
  });

  it('renders database status label', () => {
    render(
      <HealthStatusDisplay
        health={{ status: 'online', responseTime: 125, database: 'online' }}
      />
    );
    expect(screen.getByText('Database')).toBeInTheDocument();
  });

  it('renders backend online status', () => {
    render(
      <HealthStatusDisplay
        health={{ status: 'online', responseTime: 125, database: 'online' }}
      />
    );
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders backend offline status', () => {
    render(
      <HealthStatusDisplay
        health={{ status: 'offline', responseTime: 0, database: 'online' }}
      />
    );
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders response time when online', () => {
    render(
      <HealthStatusDisplay
        health={{ status: 'online', responseTime: 125, database: 'online' }}
      />
    );
    expect(screen.getByText('125ms')).toBeInTheDocument();
  });

  it('does not render response time when zero', () => {
    render(
      <HealthStatusDisplay
        health={{ status: 'offline', responseTime: 0, database: 'online' }}
      />
    );
    expect(screen.queryByText(/ms/)).not.toBeInTheDocument();
  });

  it('renders database online status', () => {
    render(
      <HealthStatusDisplay
        health={{ status: 'online', responseTime: 125, database: 'online' }}
      />
    );
    expect(screen.getByText('Oracle ADB')).toBeInTheDocument();
  });

  it('renders database offline status', () => {
    render(
      <HealthStatusDisplay
        health={{ status: 'online', responseTime: 125, database: 'offline' }}
      />
    );
    const offlineElements = screen.getAllByText('Offline');
    expect(offlineElements.length).toBeGreaterThan(0);
  });

  it('renders different response times', () => {
    const { rerender } = render(
      <HealthStatusDisplay
        health={{ status: 'online', responseTime: 50, database: 'online' }}
      />
    );
    expect(screen.getByText('50ms')).toBeInTheDocument();

    rerender(
      <HealthStatusDisplay
        health={{ status: 'online', responseTime: 250, database: 'online' }}
      />
    );
    expect(screen.getByText('250ms')).toBeInTheDocument();
  });

  it('uses translations for labels', () => {
    const mockT = vi.fn((_key: string, defaultValue: string) => defaultValue);
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(
      <HealthStatusDisplay
        health={{ status: 'online', responseTime: 125, database: 'online' }}
      />
    );

    expect(mockT).toHaveBeenCalledWith('footer:health.backend', 'Backend');
    expect(mockT).toHaveBeenCalledWith('footer:health.database', 'Database');
  });
});
