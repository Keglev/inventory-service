/**
 * @file SettingsSectionCard.test.tsx
 * @module __tests__/app/settings/SettingsSectionCard
 * @what_is_under_test SettingsSectionCard
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
