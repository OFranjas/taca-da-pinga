import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const observeTeamsOrderedByNameMock = vi.fn();
const addPingaMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('../../services/teams', () => ({
  observeTeamsOrderedByName: (...args: unknown[]) => observeTeamsOrderedByNameMock(...args),
}));

vi.mock('../../services/leaderboard', () => ({
  addPinga: (...args: unknown[]) => addPingaMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const { default: AddPingasPanel } = await import('../AddPingasPanel');

const teams = [
  { id: 'alpha', name: 'Alpha Squad', pingas: 12 },
  { id: 'beta', name: 'Beta Rockets', pingas: 4 },
];

describe('AddPingasPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    observeTeamsOrderedByNameMock.mockImplementation((callback: (items: typeof teams) => void) => {
      callback(teams);
      return vi.fn();
    });
    addPingaMock.mockResolvedValue(undefined);
  });

  it('selects a searched team through an accessible option and submits pingas', async () => {
    const api = userEvent as typeof userEvent & { setup?: () => typeof userEvent };
    const user = api.setup ? api.setup() : api;

    render(<AddPingasPanel />);

    await user.type(screen.getByPlaceholderText(/Procurar equipa/i), 'alpha');
    await user.click(await screen.findByRole('option', { name: /Alpha Squad/i }));
    await user.click(screen.getByRole('button', { name: /Aumentar/i }));
    await user.click(screen.getByRole('button', { name: /Adicionar Pingas/i }));

    await waitFor(() => {
      expect(addPingaMock).toHaveBeenCalledWith('alpha', 2);
    });
    expect(toastSuccessMock).toHaveBeenCalledWith('Adicionados 2 a Alpha Squad');
  });
});
