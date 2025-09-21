import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import type { MockInstance } from 'vitest';

vi.mock('../../services/leaderboard', () => ({
  observeLeaderboard: vi.fn(),
}));

const { observeLeaderboard } = await import('../../services/leaderboard');
const { default: LeaderboardPage, MAX_RENDERED_ROWS } = await import('../Leaderboard');

type ServiceTeam = {
  id: string;
  name?: string | null;
  pingas?: number | null;
};

type ObserveLeaderboardFn = (callback: (teams: ServiceTeam[]) => void) => () => void;

const observeLeaderboardMock = observeLeaderboard as unknown as MockInstance<ObserveLeaderboardFn>;

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
  });

  it('orders teams by pingas (desc) and then name (asc)', async () => {
    observeLeaderboardMock.mockImplementation((callback) => {
      callback([
        { id: 'b', name: 'Beta Rockets', pingas: 20 },
        { id: 'a', name: 'Alpha Squad', pingas: 20 },
        { id: 'c', name: 'Charlie Crew', pingas: 15 },
      ]);
      return vi.fn();
    });

    renderLeaderboard();

    const rows = await screen.findAllByTestId('leaderboard-row');

    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Alpha Squad');
    expect(rows[1]).toHaveTextContent('Beta Rockets');
    expect(rows[2]).toHaveTextContent('Charlie Crew');
  });

  it('shows the empty state when there are no teams', async () => {
    observeLeaderboardMock.mockImplementation((callback) => {
      callback([]);
      return vi.fn();
    });

    renderLeaderboard();

    expect(await screen.findByText(/Nenhuma equipe cadastrada ainda/i)).toBeInTheDocument();
  });

  it('limits the amount of DOM rows when the dataset is large', async () => {
    const manyTeams = Array.from({ length: 120 }, (_, index) => ({
      id: `team-${index}`,
      name: `Equipe ${index}`,
      pingas: 120 - index,
    }));

    observeLeaderboardMock.mockImplementation((callback) => {
      callback(manyTeams);
      return vi.fn();
    });

    renderLeaderboard();

    const renderedRows = await screen.findAllByTestId('leaderboard-row');
    expect(renderedRows[0]).toHaveTextContent('Equipe 0');
    expect(renderedRows.length).toBeLessThanOrEqual(MAX_RENDERED_ROWS);
  });
});
