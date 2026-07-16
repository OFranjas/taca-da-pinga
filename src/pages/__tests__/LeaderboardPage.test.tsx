import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import type { MockInstance } from 'vitest';
import type { Sponsor } from '../../services/sponsors.service';

vi.mock('../../services/leaderboard', () => ({
  observeLeaderboard: vi.fn(),
}));

vi.mock('../../services/sponsors.service', () => ({
  observeSponsors: vi.fn((_callback) => vi.fn()),
}));

vi.mock('../../services/branding.service', () => ({
  observeBranding: vi.fn((callback) => {
    callback({});
    return vi.fn();
  }),
}));

const { observeLeaderboard } = await import('../../services/leaderboard');
const { observeSponsors } = await import('../../services/sponsors.service');
const {
  default: LeaderboardPage,
  MAX_RENDERED_ROWS,
  getRowsetHeight,
  getVirtualRowMetrics,
  splitSponsorsBalanced,
} = await import('../Leaderboard');

type ServiceTeam = {
  id: string;
  name?: string | null;
  pingas?: number | null;
};

type ObserveLeaderboardFn = (callback: (teams: ServiceTeam[]) => void) => () => void;

const observeLeaderboardMock = observeLeaderboard as unknown as MockInstance<ObserveLeaderboardFn>;
type ObserveSponsorsFn = (
  callback: (sponsors: Sponsor[]) => void,
  options?: { activeOnly?: boolean },
  onError?: (error: unknown) => void
) => () => void;

const observeSponsorsMock = observeSponsors as unknown as MockInstance<ObserveSponsorsFn>;

const renderLeaderboard = () =>
  render(
    <MemoryRouter initialEntries={['/leaderboard']}>
      <LeaderboardPage />
    </MemoryRouter>
  );

describe('Leaderboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    observeLeaderboardMock.mockReset();
    observeSponsorsMock.mockImplementation(() => vi.fn());
  });

  it('splits sponsors across rails with at most one item difference', () => {
    const sponsors = Array.from({ length: 7 }, (_, index) => ({
      id: `sponsor-${index}`,
      name: `Sponsor ${index}`,
      imageDataUrl: `data:image/png;base64,${index}`,
      active: true,
      order: index,
    }));

    const [left, right] = splitSponsorsBalanced(sponsors);

    expect(left).toHaveLength(4);
    expect(right).toHaveLength(3);
    expect([...left, ...right].map((sponsor) => sponsor.id).sort()).toEqual(
      sponsors.map((sponsor) => sponsor.id).sort()
    );
  });

  it('keeps virtual row measurements in sync with compact laptop rows', () => {
    expect(getVirtualRowMetrics(false)).toEqual({ height: 80, gap: 12 });
    expect(getVirtualRowMetrics(true)).toEqual({ height: 42, gap: 3 });
    expect(getRowsetHeight(120, 42, 3)).toBe(5397);
  });

  it('orders teams by pingas (desc) and then name (asc)', async () => {
    observeLeaderboardMock.mockImplementation((callback) => {
      callback([
        { id: 'b', name: 'Beta Rockets', pingas: 20 },
        { id: 'a', name: 'Alpha Squad', pingas: 20 },
        { id: 'c', name: 'Charlie Crew', pingas: 15 },
        { id: 'd', name: 'Delta Crew', pingas: 1 },
      ]);
      return vi.fn();
    });

    renderLeaderboard();

    const rows = await screen.findAllByTestId('leaderboard-row');

    expect(rows).toHaveLength(4);
    expect(rows[0]).toHaveTextContent('Alpha Squad');
    expect(rows[1]).toHaveTextContent('Beta Rockets');
    expect(rows[2]).toHaveTextContent('Charlie Crew');
    expect(rows[3]).toHaveTextContent('Delta Crew');
    expect(rows[0]).toHaveStyle('--row-meter-start: #d97706');
    expect(rows[1]).toHaveStyle('--row-meter-start: #64748b');
    expect(rows[2]).toHaveStyle('--row-meter-start: #c2410c');
    expect(rows[3]).toHaveStyle('--row-meter-start: #047857');
    const meters = screen.getAllByRole('meter');
    expect(meters).toHaveLength(4);
    expect(meters.map((meter) => meter.getAttribute('aria-valuenow'))).toEqual([
      '100',
      '100',
      '75',
      '5',
    ]);
    expect(meters.every((meter) => meter.getAttribute('aria-valuemax') === '100')).toBe(true);
    expect(meters.map((meter) => meter.getAttribute('aria-valuetext'))).toEqual([
      'Alpha Squad está no valor de referência',
      'Beta Rockets está no valor de referência',
      'Charlie Crew está a 75% do valor da equipa líder',
      'Delta Crew está a 5% do valor da equipa líder',
    ]);
    expect(screen.queryByTestId('score-beer-icon')).not.toBeInTheDocument();
    expect(screen.queryByText('Total de Pingas')).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Pingas' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Comparação' })).not.toBeInTheDocument();
    expect(screen.queryByText('pts')).not.toBeInTheDocument();
    expect(rows[0]).not.toHaveTextContent(/\b20\b/);
    expect(rows[2]).not.toHaveTextContent(/\b15\b/);
    expect(rows[3]).not.toHaveTextContent(/\b1\b/);
    expect(screen.queryByText('56')).not.toBeInTheDocument();
  });

  it('renders empty comparison meters without exposing a score', async () => {
    observeLeaderboardMock.mockImplementation((callback) => {
      callback([
        { id: 'a', name: 'Alpha Squad', pingas: 0 },
        { id: 'b', name: 'Beta Rockets', pingas: 0 },
      ]);
      return vi.fn();
    });

    renderLeaderboard();

    const meters = await screen.findAllByRole('meter');
    expect(meters).toHaveLength(2);
    expect(meters.map((meter) => meter.getAttribute('aria-valuenow'))).toEqual(['0', '0']);
    expect(meters.map((meter) => meter.getAttribute('aria-valuetext'))).toEqual([
      'Alpha Squad ainda não tem valor registado',
      'Beta Rockets ainda não tem valor registado',
    ]);
    expect(screen.queryByText('Total de Pingas')).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no teams', async () => {
    observeLeaderboardMock.mockImplementation((callback) => {
      callback([]);
      return vi.fn();
    });

    renderLeaderboard();

    expect(await screen.findByText(/Ainda não há equipas inscritas/i)).toBeInTheDocument();
  });

  it('shows sponsor skeletons instead of bundled fallback sponsors while loading', async () => {
    observeLeaderboardMock.mockImplementation((callback) => {
      callback([]);
      return vi.fn();
    });

    renderLeaderboard();

    expect(screen.getAllByRole('status', { name: 'A carregar patrocinadores' })).toHaveLength(3);
    expect(screen.queryByText('Patrocinador 1')).not.toBeInTheDocument();
  });

  it('does not show bundled sponsors after an active sponsor query returns empty', async () => {
    observeLeaderboardMock.mockImplementation((callback) => {
      callback([{ id: 'team-1', name: 'Equipa 1', pingas: 10 }]);
      return vi.fn();
    });
    observeSponsorsMock.mockImplementation((callback) => {
      callback([]);
      return vi.fn();
    });

    renderLeaderboard();

    expect(await screen.findByText('Equipa 1')).toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Patrocinadores em destaque' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Mais patrocinadores' })).not.toBeInTheDocument();
  });

  it('limits the amount of DOM rows when the dataset is large', async () => {
    const manyTeams = Array.from({ length: 120 }, (_, index) => ({
      id: `team-${index}`,
      name: `Equipa ${index}`,
      pingas: 120 - index,
    }));

    observeLeaderboardMock.mockImplementation((callback) => {
      callback(manyTeams);
      return vi.fn();
    });

    renderLeaderboard();

    const renderedRows = await screen.findAllByTestId('leaderboard-row');
    expect(renderedRows[0]).toHaveTextContent('Equipa 0');
    expect(renderedRows.length).toBeLessThanOrEqual(MAX_RENDERED_ROWS);
  });

  it('keeps all rows in the DOM on compact viewports so CSS and virtualization cannot drift', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });

    const manyTeams = Array.from({ length: 120 }, (_, index) => ({
      id: `team-${index}`,
      name: `Equipa ${index}`,
      pingas: 120 - index,
    }));

    observeLeaderboardMock.mockImplementation((callback) => {
      callback(manyTeams);
      return vi.fn();
    });

    renderLeaderboard();

    expect((await screen.findAllByTestId('leaderboard-row')).length).toBe(120);
  });
});
