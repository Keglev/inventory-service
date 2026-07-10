/**
 * @file SidebarEnvironment.test.tsx
 * @module __tests__/app/layout/sidebar/SidebarEnvironment
 * @description
 * Tests for SidebarEnvironment.
 *
 * Scope:
 * - Displays environment and version metadata in the sidebar footer.
 * - Uses i18n default values/keys without depending on external translation files.
 *
 * Out of scope:
 * - Build/version injection mechanisms
 * - Runtime environment configuration sources
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SidebarEnvironment from '../../../../app/layout/sidebar/SidebarEnvironment';
import { tEn } from '../../../test/i18nEn';

/**
 * i18n mock:
 * Provide deterministic strings for a small set of keys the component uses.
 * All other keys fall back to the defaultValue to keep the test resilient.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());
vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

vi.mock('@/config/appMeta', () => ({
  APP_VERSION: '1.0.0',
  BUILD_ID: '4a9c12f',
  APP_ENVIRONMENT: 'Production (Koyeb)',
}));

describe('SidebarEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
    });
  });

  it('renders complete environment metadata (labels + values)', () => {
    // Single high-value assertion: verifies the full metadata block as the user sees it.
    render(<SidebarEnvironment />);

    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('Production (Koyeb)')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });
});
