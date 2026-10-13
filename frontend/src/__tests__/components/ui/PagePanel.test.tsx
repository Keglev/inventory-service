/**
 * @file PagePanel.test.tsx
 * @module __tests__/components/ui/PagePanel
 * @testing Unit tests for the board page panel.
 * @description
 * Contract under test:
 * - Children render inside the flat panel; overlays render after it, outside.
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PagePanel } from '@/components/ui/PagePanel';

describe('PagePanel', () => {
  it('renders children inside the panel and overlays after it', () => {
    render(
      <PagePanel overlays={<div data-testid="overlay" />}>
        <div data-testid="content" />
      </PagePanel>,
    );

    const panel = screen.getByTestId('content').closest('.MuiPaper-root');
    expect(panel).not.toBeNull();
    expect(panel?.contains(screen.getByTestId('overlay'))).toBe(false);
    expect(panel?.nextElementSibling).toBe(screen.getByTestId('overlay'));
  });

  it('renders without overlays', () => {
    render(
      <PagePanel>
        <div data-testid="content" />
      </PagePanel>,
    );

    expect(screen.getByTestId('content').closest('.MuiPaper-root')?.nextElementSibling).toBeNull();
  });
});
