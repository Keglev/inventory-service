import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LogoutSuccess from '../../../../pages/auth/LogoutSuccess';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LogoutSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <LogoutSuccess />
      </MemoryRouter>
    );
  };

  it('renders success title', () => {
    renderComponent();
    expect(screen.getByText('logoutSuccessTitle')).toBeInTheDocument();
  });

  it('renders success message body', () => {
    renderComponent();
    expect(screen.getByText('logoutSuccessBody')).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderComponent();
    const button = screen.getByRole('button', { name: /signIn/i });
    expect(button).toBeInTheDocument();
  });

  it('navigates to login when sign in button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const button = screen.getByRole('button', { name: /signIn/i });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('button uses contained variant', () => {
    renderComponent();
    const button = screen.getByRole('button', { name: /signIn/i });
    expect(button).toHaveClass('MuiButton-contained');
  });

  it('displays centered layout', () => {
    renderComponent();
    const title = screen.getByText('logoutSuccessTitle');
    const container = title.closest('div');
    expect(container).toBeInTheDocument();
  });

  it('title uses h5 variant', () => {
    renderComponent();
    const title = screen.getByText('logoutSuccessTitle');
    expect(title.tagName).toBe('H5');
  });

  it('body text uses body1 typography', () => {
    renderComponent();
    const body = screen.getByText('logoutSuccessBody');
    expect(body).toHaveClass('MuiTypography-body1');
  });

  it('navigates with replace option', async () => {
    const user = userEvent.setup();
    renderComponent();

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ replace: true })
    );
  });
});
