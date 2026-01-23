/**
 * @file SystemInfoMenuSection.test.tsx
 * @module __tests__/app/HamburgerMenu
 *
 * @description
 * Unit tests for <SystemInfoMenuSection /> — displays system/environment metadata
 * and exposes a “copy backend URL” action.
 *
 * Test strategy:
 * - Mock health hook (online/offline) to keep tests deterministic.
 * - Mock clipboard API to validate copy behavior without a real browser clipboard.
 * - Verify key labels/values and that user interaction updates tooltip text.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('SystemInfoMenuSection', () => {
  const arrange = (props?: Parameters<typeof SystemInfoMenuSection>[0]) => render(<SystemInfoMenuSection {...props} />);

  const setHealth = (status: 'online' | 'offline') => {
    mockUseHealthCheck.mockReturnValue({ health: { status } });
  };
  
  const createClipboardStub = () => vi.fn().mockResolvedValue(undefined);

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

  it('renders backend URL', () => {
    arrange();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('/api')).toBeInTheDocument();
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

    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText(/Version.*1\.0\.0/)).toBeInTheDocument();
    expect(screen.getByText(/Build.*4a9c12f/)).toBeInTheDocument();
  });

  it('renders a copy button for the backend URL', () => {
    arrange();

    // StrictMode double render creates duplicate buttons, so we assert presence via array length.
    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });

  it('copies the backend URL to the clipboard when the copy button is clicked', async () => {
    const user = userEvent.setup();
    const clipboardWriteTextSpy = createClipboardStub();
    arrange({ clipboard: { writeText: clipboardWriteTextSpy } });

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    for (const button of copyButtons) {
      await user.click(button);
      if (clipboardWriteTextSpy.mock.calls.length > 0) {
        break;
      }
    }

    // Primary behavior: the component should attempt to copy the backend URL.
    await waitFor(() => {
      expect(clipboardWriteTextSpy).toHaveBeenCalledTimes(1);
      expect(clipboardWriteTextSpy).toHaveBeenCalledWith('/api');
    });

    // Secondary behavior: user feedback should confirm success.
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('shows "Copy" tooltip on hover and "Copied!" after clicking', async () => {
    const user = userEvent.setup();
    const clipboardWriteTextSpy = createClipboardStub();
    arrange({ clipboard: { writeText: clipboardWriteTextSpy } });

    const [copyButton] = screen.getAllByRole('button', { name: /copy/i });
    expect(copyButton).toBeDefined();

    await user.hover(copyButton!);
    await waitFor(() => {
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    await user.click(copyButton!);
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('renders a copy icon', () => {
    const { container } = arrange();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses translated labels when provided by i18n', () => {
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

    arrange();

    expect(screen.getByText('Systeminfo')).toBeInTheDocument();
    expect(screen.getByText('Umgebung')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('Frontend')).toBeInTheDocument();
  });
});
