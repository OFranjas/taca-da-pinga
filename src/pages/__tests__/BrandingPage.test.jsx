import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../firebase', () => ({
  auth: {
    onAuthStateChanged: vi.fn(),
  },
}));

const signInMock = vi.fn();
const signOutMock = vi.fn();
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args) => signInMock(...args),
  signOut: (...args) => signOutMock(...args),
}));

const getBrandingMock = vi.fn();
const updateBrandingMock = vi.fn();
vi.mock('../../services/branding.service', () => ({
  getBranding: (...args) => getBrandingMock(...args),
  updateBranding: (...args) => updateBrandingMock(...args),
}));

const { auth } = await import('../../firebase');
const { default: BrandingPage } = await import('../Branding');

const renderWithRouter = () =>
  render(
    <MemoryRouter initialEntries={['/admin/branding']}>
      <BrandingPage />
    </MemoryRouter>
  );

describe('Branding admin page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = vi.fn();
  });

  test('displays existing branding previews', async () => {
    auth.onAuthStateChanged.mockImplementation((cb) => {
      cb({ uid: 'admin' });
      return vi.fn();
    });
    getBrandingMock.mockResolvedValue({
      mainLogoDataUrl: 'data:image/png;base64,main',
      iconDataUrl: 'data:image/png;base64,icon',
    });
    updateBrandingMock.mockResolvedValue(undefined);

    renderWithRouter();

    expect(await screen.findByAltText('Main logo preview')).toBeInTheDocument();
    expect(screen.getByAltText('Icon preview')).toHaveAttribute(
      'src',
      'data:image/png;base64,icon'
    );
  });

  test('uploads files and saves branding successfully', async () => {
    const user = userEvent.setup ? userEvent.setup() : userEvent;
    auth.onAuthStateChanged.mockImplementation((cb) => {
      cb({ uid: 'admin' });
      return vi.fn();
    });
    getBrandingMock.mockResolvedValue({});
    updateBrandingMock.mockResolvedValue(undefined);

    renderWithRouter();

    const mainInput = await screen.findByLabelText(/Main logo/i, { selector: 'input' });
    const iconInput = screen.getByLabelText(/Icon/i, { selector: 'input' });

    const mainFile = new File(['main'], 'main.png', { type: 'image/png' });
    const iconFile = new File(['icon'], 'icon.png', { type: 'image/png' });

    await user.upload(mainInput, mainFile);
    await user.upload(iconInput, iconFile);

    await user.click(screen.getByRole('button', { name: /Save branding/i }));

    await waitFor(() => {
      expect(updateBrandingMock).toHaveBeenCalledWith({
        mainLogoFile: mainFile,
        iconFile: iconFile,
        removeMainLogo: false,
        removeIcon: false,
      });
    });

    expect(screen.getByRole('status')).toHaveTextContent('Branding saved successfully.');
  });

  test('shows inline error when compression fails', async () => {
    const user = userEvent.setup ? userEvent.setup() : userEvent;
    auth.onAuthStateChanged.mockImplementation((cb) => {
      cb({ uid: 'admin' });
      return vi.fn();
    });
    getBrandingMock.mockResolvedValue({});
    updateBrandingMock.mockRejectedValue(
      new Error('Unable to compress image below 180k characters')
    );

    renderWithRouter();

    const mainInput = await screen.findByLabelText(/Main logo/i, { selector: 'input' });
    const file = new File(['main'], 'main.png', { type: 'image/png' });
    await user.upload(mainInput, file);

    await user.click(screen.getByRole('button', { name: /Save branding/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to compress image below 180k characters'
    );
  });

  test('allows removing existing branding assets', async () => {
    const user = userEvent.setup ? userEvent.setup() : userEvent;
    auth.onAuthStateChanged.mockImplementation((cb) => {
      cb({ uid: 'admin' });
      return vi.fn();
    });
    getBrandingMock.mockResolvedValue({
      mainLogoDataUrl: 'data:image/png;base64,main',
      iconDataUrl: 'data:image/png;base64,icon',
    });
    updateBrandingMock.mockResolvedValue(undefined);

    renderWithRouter();

    const [removeMain] = await screen.findAllByRole('button', { name: /Remove/i });
    await user.click(removeMain);
    const removeIcon = await screen.findByRole('button', { name: /Remove/i });
    await user.click(removeIcon);

    await user.click(screen.getByRole('button', { name: /Save branding/i }));

    await waitFor(() => {
      expect(updateBrandingMock).toHaveBeenCalledWith({
        mainLogoFile: undefined,
        iconFile: undefined,
        removeMainLogo: true,
        removeIcon: true,
      });
    });
  });
});
