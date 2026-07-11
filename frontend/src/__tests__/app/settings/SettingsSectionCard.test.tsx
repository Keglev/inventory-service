/**
 * @file SettingsSectionCard.test.tsx
 * @module __tests__/app/settings/SettingsSectionCard
 * @description Contract tests for SettingsSectionCard.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsSectionCard } from '../../../app/settings/SettingsSectionCard';

describe('SettingsSectionCard', () => {
  it('renders the title and children', () => {
    render(
      <SettingsSectionCard title="User Preferences">
        <div>section body</div>
      </SettingsSectionCard>
    );
    expect(screen.getByText('User Preferences')).toBeInTheDocument();
    expect(screen.getByText('section body')).toBeInTheDocument();
  });
});
