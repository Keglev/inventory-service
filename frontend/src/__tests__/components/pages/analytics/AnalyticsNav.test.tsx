/**
 * @file AnalyticsNav.test.tsx
 * @module __tests__/pages/analytics/AnalyticsNav
 * 
 * @summary
 * Tests for AnalyticsNav component.
 * Tests tab rendering, navigation, and active section highlighting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const AnalyticsNav = (await import('../../../../pages/analytics/components/AnalyticsNav')).default;

describe('AnalyticsNav', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderNav = (section: 'overview' | 'pricing' | 'inventory' | 'finance' = 'overview') => {
    return render(
      <MemoryRouter>
        <AnalyticsNav section={section} />
      </MemoryRouter>
    );
  };

  it('renders all four tabs', () => {
    renderNav();
    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pricing/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /inventory/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /finance/i })).toBeInTheDocument();
  });

  it('highlights overview tab when section is overview', () => {
    renderNav('overview');
    const overviewTab = screen.getByRole('tab', { name: /overview/i });
    expect(overviewTab).toHaveAttribute('aria-selected', 'true');
  });

  it('highlights pricing tab when section is pricing', () => {
    renderNav('pricing');
    const pricingTab = screen.getByRole('tab', { name: /pricing/i });
    expect(pricingTab).toHaveAttribute('aria-selected', 'true');
  });

  it('highlights inventory tab when section is inventory', () => {
    renderNav('inventory');
    const inventoryTab = screen.getByRole('tab', { name: /inventory/i });
    expect(inventoryTab).toHaveAttribute('aria-selected', 'true');
  });

  it('highlights finance tab when section is finance', () => {
    renderNav('finance');
    const financeTab = screen.getByRole('tab', { name: /finance/i });
    expect(financeTab).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates to /analytics/pricing when pricing tab is clicked', async () => {
    const user = userEvent.setup();
    renderNav('overview');
    
    const pricingTab = screen.getByRole('tab', { name: /pricing/i });
    await user.click(pricingTab);
    
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/pricing');
  });

  it('navigates to /analytics/inventory when inventory tab is clicked', async () => {
    const user = userEvent.setup();
    renderNav('overview');
    
    const inventoryTab = screen.getByRole('tab', { name: /inventory/i });
    await user.click(inventoryTab);
    
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/inventory');
  });

  it('navigates to /analytics/finance when finance tab is clicked', async () => {
    const user = userEvent.setup();
    renderNav('overview');
    
    const financeTab = screen.getByRole('tab', { name: /finance/i });
    await user.click(financeTab);
    
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/finance');
  });

  it('navigates to /analytics/overview when overview tab is clicked', async () => {
    const user = userEvent.setup();
    renderNav('pricing');
    
    const overviewTab = screen.getByRole('tab', { name: /overview/i });
    await user.click(overviewTab);
    
    expect(mockNavigate).toHaveBeenCalledWith('/analytics/overview');
  });
});
