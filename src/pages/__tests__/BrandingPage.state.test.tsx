import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mockUseAdminAuth = vi.fn();
const mockGetBranding = vi.fn();
const mockUpdateBranding = vi.fn();

vi.mock('../../hooks/useAdminAuth', () => ({
  useAdminAuth: (...args: unknown[]) => mockUseAdminAuth(...args),
}));

vi.mock('../../components/Header', () => ({
  __esModule: true,
  default: () => <header data-testid="header" />,
}));

vi.mock('../../components/AdminLoginCard', () => ({
  AdminLoginCard: ({
    onSubmit,
    error,
  }: {
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    error?: string;
  }) => (
    <form onSubmit={onSubmit}>
      <button type="submit">submit-login</button>
      {error ? <div role="alert">{error}</div> : null}
    </form>
  ),
}));

vi.mock('../../components/BrandingForm', () => ({
  __esModule: true,
  default: ({
    initialBranding,
    onSave,
  }: {
    initialBranding: unknown;
    onSave: (payload: unknown) => void;
  }) => (
    <div>
      <div data-testid="branding-snapshot">{JSON.stringify(initialBranding)}</div>
      <button type="button" onClick={() => onSave({})}>
        trigger-save
      </button>
    </div>
  ),
}));

const observeBrandingMock = vi.fn();
vi.mock('../../services/branding.service', () => ({
  getBranding: (...args: unknown[]) => mockGetBranding(...args),
  updateBranding: (...args: unknown[]) => mockUpdateBranding(...args),
  observeBranding: (...args: unknown[]) => observeBrandingMock(...args),
}));

let Branding: (typeof import('../Branding'))['default'];

beforeEach(async () => {
  vi.resetModules();
  mockUseAdminAuth.mockReset();
  mockGetBranding.mockReset();
  mockUpdateBranding.mockReset();
  observeBrandingMock.mockReset();
  observeBrandingMock.mockImplementation((callback: (value: unknown) => void) => {
    callback({});
    return vi.fn();
  });
  ({ default: Branding } = await import('../Branding'));
});

const renderBranding = () =>
  render(
    <MemoryRouter initialEntries={['/admin/branding']}>
      <Branding />
    </MemoryRouter>
  );

describe('Branding administrative page state handling', () => {
  test('shows verifying state while auth is being checked', () => {
    mockUseAdminAuth.mockReturnValue({
      user: null,
      email: '',
      password: '',
      isCheckingAuth: true,
      setEmail: vi.fn(),
      setPassword: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });

    renderBranding();

    expect(screen.getByText(/Verificando sessão/i)).toBeInTheDocument();
  });

  test('renders login card and surfaces login errors', async () => {
    const loginMock = vi.fn().mockRejectedValue(new Error('bad credentials'));
    mockUseAdminAuth.mockReturnValue({
      user: null,
      email: '',
      password: '',
      isCheckingAuth: false,
      setEmail: vi.fn(),
      setPassword: vi.fn(),
      login: loginMock,
      logout: vi.fn(),
    });

    renderBranding();

    fireEvent.click(screen.getByText('submit-login'));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('bad credentials');
  });

  test('triggers save flow and refreshes branding data', async () => {
    const logoutMock = vi.fn();
    mockUseAdminAuth.mockReturnValue({
      user: { uid: 'admin' },
      email: '',
      password: '',
      isCheckingAuth: false,
      setEmail: vi.fn(),
      setPassword: vi.fn(),
      login: vi.fn(),
      logout: logoutMock,
    });

    mockGetBranding
      .mockResolvedValueOnce({ mainLogoDataUrl: 'initial-logo' })
      .mockResolvedValueOnce({ mainLogoDataUrl: 'updated-logo' });
    mockUpdateBranding.mockResolvedValue(undefined);

    renderBranding();

    await waitFor(() => {
      expect(screen.getByTestId('branding-snapshot')).toHaveTextContent('initial-logo');
    });

    fireEvent.click(screen.getByText('trigger-save'));

    await waitFor(() => {
      expect(mockUpdateBranding).toHaveBeenCalledTimes(1);
      expect(mockGetBranding).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('branding-snapshot')).toHaveTextContent('updated-logo');
    });

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
    expect(logoutMock).toHaveBeenCalledTimes(1);
  });

  test('shows load error when branding fetch fails', async () => {
    mockUseAdminAuth.mockReturnValue({
      user: { uid: 'admin' },
      email: '',
      password: '',
      isCheckingAuth: false,
      setEmail: vi.fn(),
      setPassword: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    });

    mockGetBranding.mockRejectedValueOnce(new Error('Failed to load branding'));

    renderBranding();

    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load branding');
  });
});
