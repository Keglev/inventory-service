/**
 * @file SidebarEnvironment.test.tsx
 *
 * @what_is_under_test SidebarEnvironment component
 * @responsibility Displays application environment and version metadata in sidebar footer
 * @out_of_scope Environment configuration, version management, build process
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SidebarEnvironment from '../../../app/layout/sidebar/SidebarEnvironment';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue: string) => {
      // Map specific keys to their values
      const translations: Record<string, string> = {
        'footer:meta.environment': 'Environment:',
        'footer:meta.version': 'Version:',
        'app.environment': 'Production (Koyeb)',
        'app.version': '1.0.0',
      };
      return translations[key] || defaultValue;
    },
  }),
}));

describe('SidebarEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Environment display', () => {
    it('renders environment label', () => {
      render(<SidebarEnvironment />);
      expect(screen.getByText('Environment:')).toBeInTheDocument();
    });

    it('renders environment value', () => {
      render(<SidebarEnvironment />);
      expect(screen.getByText('Production (Koyeb)')).toBeInTheDocument();
    });
  });

  describe('Version display', () => {
    it('renders version label', () => {
      render(<SidebarEnvironment />);
      expect(screen.getByText('Version:')).toBeInTheDocument();
    });

    it('renders version value', () => {
      render(<SidebarEnvironment />);
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });

  describe('Complete metadata display', () => {
    it('renders all environment metadata', () => {
      render(<SidebarEnvironment />);
      expect(screen.getByText('Environment:')).toBeInTheDocument();
      expect(screen.getByText('Production (Koyeb)')).toBeInTheDocument();
      expect(screen.getByText('Version:')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('uses footer:meta.environment translation key', () => {
      render(<SidebarEnvironment />);
      expect(screen.getByText('Environment:')).toBeInTheDocument();
    });

    it('uses footer:meta.version translation key', () => {
      render(<SidebarEnvironment />);
      expect(screen.getByText('Version:')).toBeInTheDocument();
    });

    it('uses app.environment translation key', () => {
      render(<SidebarEnvironment />);
      expect(screen.getByText('Production (Koyeb)')).toBeInTheDocument();
    });

    it('uses app.version translation key', () => {
      render(<SidebarEnvironment />);
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
    });
  });
});
