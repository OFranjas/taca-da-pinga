import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import type { Sponsor } from '../../services/sponsors.service';

type ListSponsors = (typeof import('../../services/sponsors.service'))['listSponsors'];

const listSponsorsMock = vi.fn<ListSponsors>();
type ObserveBranding = (typeof import('../../services/branding.service'))['observeBranding'];
const observeBrandingMock = vi.fn<ObserveBranding>();

vi.mock('../../services/sponsors.service', () => ({
  listSponsors: listSponsorsMock,
}));

vi.mock('../../services/branding.service', () => ({
  observeBranding: observeBrandingMock,
}));

const { default: HomePage } = await import('../Home');

const renderHome = () => {
  const router = createMemoryRouter(
    [
      { path: '/', element: <HomePage /> },
      { path: '/leaderboard', element: <div>Leaderboard</div> },
      { path: '/admin', element: <div>Admin</div> },
    ],
    { initialEntries: ['/'] }
  );

  render(<RouterProvider router={router} />);
  return router;
};

describe('Home page', () => {
  beforeEach(() => {
    listSponsorsMock.mockReset();
    observeBrandingMock.mockReset();
    observeBrandingMock.mockImplementation((callback) => {
      callback({});
      return vi.fn();
    });
  });

  test('shows loading skeleton while sponsors load', async () => {
    let resolveSponsors!: (value: Awaited<ReturnType<ListSponsors>>) => void;
    listSponsorsMock.mockImplementation(
      () =>
        new Promise<Awaited<ReturnType<ListSponsors>>>((resolve) => {
          resolveSponsors = resolve;
        })
    );

    renderHome();

    const skeleton = screen.getByTestId('home-sponsors-loading');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.querySelectorAll('article')).toHaveLength(4);

    await act(async () => {
      resolveSponsors([]);
    });
    await waitFor(() => {
      expect(screen.queryByTestId('home-sponsors-loading')).not.toBeInTheDocument();
    });
  });

  test('renders empty state when there are no sponsors', async () => {
    listSponsorsMock.mockImplementation(async () => [] as Awaited<ReturnType<ListSponsors>>);

    renderHome();

    expect(await screen.findByText(/Nenhum patrocinador ainda/i)).toBeInTheDocument();
  });

  test('uses branding logo when available', async () => {
    const remoteLogo = 'data:image/png;base64,REMOTE';
    observeBrandingMock.mockImplementation((callback) => {
      callback({ mainLogoDataUrl: remoteLogo });
      return vi.fn();
    });
    listSponsorsMock.mockResolvedValue([] as Awaited<ReturnType<ListSponsors>>);

    renderHome();

    const heroLogo = await screen.findByAltText('Logo Taça da Pinga');
    expect(heroLogo).toHaveAttribute('src', remoteLogo);
  });

  test('allows retrying after sponsor load failure', async () => {
    const sponsors: Sponsor[] = [
      {
        id: 'sp-1',
        name: 'ACME',
        link: 'https://example.com',
        imageDataUrl: 'data:image/png;base64,AAA',
        active: true,
        order: 0,
      },
    ];

    listSponsorsMock
      .mockImplementationOnce(async () => {
        throw new Error('Firestore offline');
      })
      .mockImplementationOnce(async () => sponsors);

    renderHome();

    const retryButton = await screen.findByRole('button', { name: /Tentar novamente/i });
    expect(screen.getByRole('alert')).toHaveTextContent('Firestore offline');

    await act(async () => {
      await userEvent.click(retryButton);
    });

    await waitFor(() => {
      expect(listSponsorsMock).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByRole('img', { name: sponsors[0].name })).toBeInTheDocument();
  });

  test('navigates to the leaderboard when the primary CTA is clicked', async () => {
    listSponsorsMock.mockImplementation(async () => [] as Awaited<ReturnType<ListSponsors>>);

    const router = renderHome();

    const leaderboardButton = await screen.findByRole('button', { name: /Ver leaderboard/i });
    await act(async () => {
      await userEvent.click(leaderboardButton);
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/leaderboard');
    });
  });

  test('navigates to the admin panel when the secondary CTA is clicked', async () => {
    listSponsorsMock.mockImplementation(async () => [] as Awaited<ReturnType<ListSponsors>>);

    const router = renderHome();

    const adminButton = await screen.findByRole('button', { name: /Painel admin/i });
    await act(async () => {
      await userEvent.click(adminButton);
    });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/admin');
    });
  });
});
