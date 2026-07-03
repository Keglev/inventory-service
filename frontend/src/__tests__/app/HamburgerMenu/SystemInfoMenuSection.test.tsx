/**
 * @file SystemInfoMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu
 *
 * @description
 * Unit tests for <SystemInfoMenuSection /> — displays system/environment
 * metadata and backend health status.
 *
 * Test strategy:
 * - Mock health hook (online/offline) to keep tests deterministic.
 * - Verify key labels/values; the former copy-backend-URL action was removed
 *   with the '/api' row (CB-APP80).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SystemInfoMenuSection from '../../../app/HamburgerMenu/SystemInfoMenuSection';

// -----------------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------------
const mockUseHealthCheck = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('../../../features/health', () => ({
  useHealthCheck: mockUseHealthCheck,
}));

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

vi.mock('@/config/appMeta', () => ({
  APP_VERSION: '1.0.0',
  BUILD_ID: '4a9c12f',
  APP_ENVIRONMENT: 'Production (Koyeb)',
}));

describe('SystemInfoMenuSection', () => {
  const arrange = () => render(<SystemInfoMenuSection />);

  const setHealth = (status: 'online' | 'offline') => {
    mockUseHealthCheck.mockReturnValue({ health: { status } });
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });

    setHealth('online');
  });

  it('renders section title', () => {
    arrange();
    expect(screen.getByText('Systeminfo / System Info')).toBeInTheDocument();
  });

  it('renders environment information', () => {
    arrange();
    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('Production (Koyeb)')).toBeInTheDocument();
  });

  it('renders backend status as online', () => {
    arrange();
    expect(screen.getByText('Status: Online')).toBeInTheDocument();
  });

  it('renders backend status as offline when health is offline', () => {
    setHealth('offline');
    arrange();
    expect(screen.getByText('Status: Offline')).toBeInTheDocument();
  });

  it('renders frontend version and build metadata', () => {
    arrange();
    expect(screen.getByText('Version: 1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Build: 4a9c12f')).toBeInTheDocument();
  });

  // -----------------------------
  // Removed behavior (CB-APP80)
  // -----------------------------
  it('renders no backend URL row and no copy button', () => {
    arrange();
    expect(screen.queryByText('/api')).toBeNull();
    expect(screen.queryByRole('button', { name: /copy/i })).toBeNull();
  });
});
