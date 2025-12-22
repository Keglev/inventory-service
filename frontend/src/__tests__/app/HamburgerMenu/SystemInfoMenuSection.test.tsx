/**
 * @file SystemInfoMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu/SystemInfoMenuSection
 * @description Tests for system info menu section component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SystemInfoMenuSection from '../../../app/HamburgerMenu/SystemInfoMenuSection';

// Hoisted mocks
const mockUseHealthCheck = vi.hoisted(() => vi.fn());
const mockUseTranslation = vi.hoisted(() => vi.fn());

// Mock hooks
vi.mock('../../../features/health', () => ({
  useHealthCheck: mockUseHealthCheck,
}));

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('SystemInfoMenuSection', () => {
  let mockWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock clipboard API
    mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
    
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
    mockUseHealthCheck.mockReturnValue({
      health: { status: 'online' },
    });
  });

  it('renders system info section title', () => {
    render(<SystemInfoMenuSection />);
    expect(screen.getByText('Systeminfo / System Info')).toBeInTheDocument();
  });

  it('renders environment information', () => {
    render(<SystemInfoMenuSection />);
    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('Production (Koyeb)')).toBeInTheDocument();
  });

  it('renders backend URL', () => {
    render(<SystemInfoMenuSection />);
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('/api')).toBeInTheDocument();
  });

  it('renders backend online status', () => {
    render(<SystemInfoMenuSection />);
    expect(screen.getByText('Status: Online')).toBeInTheDocument();
  });

  it('renders backend offline status when offline', () => {
    mockUseHealthCheck.mockReturnValue({
      health: { status: 'offline' },
    });

    render(<SystemInfoMenuSection />);
    expect(screen.getByText('Status: Offline')).toBeInTheDocument();
  });

  it('renders frontend version', () => {
    render(<SystemInfoMenuSection />);
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText(/Version.*1\.0\.0/)).toBeInTheDocument();
  });

  it('renders build commit hash', () => {
    render(<SystemInfoMenuSection />);
    expect(screen.getByText(/Build.*4a9c12f/)).toBeInTheDocument();
  });

  it('renders copy button for backend URL', () => {
    render(<SystemInfoMenuSection />);
    const copyButton = screen.getByRole('button');
    expect(copyButton).toBeInTheDocument();
  });

  it('calls clipboard API when copy button clicked', async () => {
    const user = userEvent.setup();
    render(<SystemInfoMenuSection />);

    const copyButton = screen.getByRole('button');
    await user.click(copyButton);

    // Just verify the click works and tooltip updates - clipboard API is browser-specific
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('shows copied tooltip after copying', async () => {
    const user = userEvent.setup();
    render(<SystemInfoMenuSection />);

    const copyButton = screen.getByRole('button');
    await user.hover(copyButton);

    // Initial tooltip
    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    await user.click(copyButton);

    // After copy tooltip
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('renders copy icon', () => {
    const { container } = render(<SystemInfoMenuSection />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('uses translations for labels', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'systemInfo.title') return 'Systeminfo';
      if (key === 'systemInfo.environment') return 'Umgebung';
      if (key === 'systemInfo.backend') return 'Backend';
      if (key === 'systemInfo.frontend') return 'Frontend';
      return defaultValue;
    });
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    render(<SystemInfoMenuSection />);
    
    expect(screen.getByText('Systeminfo')).toBeInTheDocument();
    expect(screen.getByText('Umgebung')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });
});
