import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';

vi.mock('../../services/branding.service', () => ({
  getBranding: vi.fn(),
  observeBranding: vi.fn(),
}));

type BrandingModule = typeof import('../../services/branding.service');
type HeaderModule = typeof import('../Header');

let getBrandingMock: MockedFunction<BrandingModule['getBranding']>;
let observeBrandingMock: MockedFunction<BrandingModule['observeBranding']>;
let HeaderComponent: HeaderModule['Header'];

const renderHeader = (initialEntries: string[] = ['/']) => {
  if (!HeaderComponent) {
    throw new Error('Header component not loaded');
  }

  return render(<HeaderComponent />, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
  });
};

describe('Header', () => {
  beforeAll(async () => {
    const branding = await import('../../services/branding.service');
    getBrandingMock = vi.mocked(branding.getBranding);
    observeBrandingMock = vi.mocked(branding.observeBranding);
    ({ Header: HeaderComponent } = await import('../Header'));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    getBrandingMock.mockResolvedValue({});
    observeBrandingMock.mockImplementation((cb) => {
      cb({});
      return vi.fn();
    });
  });

  it('uses the fallback branding assets when service returns empty payload', async () => {
    renderHeader();

    await waitFor(() => {
      expect(observeBrandingMock).toHaveBeenCalledTimes(1);
    });

    const logo = screen.getByAltText('Taça da Pinga');
    expect(logo).toBeInTheDocument();
  });

  it('marks the active navigation item based on the current route', async () => {
    renderHeader(['/admin/settings']);

    await waitFor(() => {
      expect(observeBrandingMock).toHaveBeenCalledTimes(1);
    });

    const adminLink = screen.getByRole('link', { name: 'Admin' });
    expect(adminLink).toHaveAttribute('aria-current', 'page');
  });

  it('applies focus-visible data attribute when navigating with keyboard', async () => {
    const api = userEvent as typeof userEvent & { setup?: () => typeof userEvent };
    const user = api.setup ? api.setup() : api;
    renderHeader(['/leaderboard']);

    await waitFor(() => {
      expect(observeBrandingMock).toHaveBeenCalledTimes(1);
    });

    await user.tab(); // focus brand link
    await user.tab(); // focus first nav item

    const leaderboardLink = screen.getByRole('link', { name: 'Leaderboard' });
    expect(leaderboardLink).toHaveAttribute('data-focus-visible', 'true');
  });
});
