import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const observeTeamsOrderedByNameMock = vi.fn();
const createTeamIfNotExistsMock = vi.fn();
const deleteTeamMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastInfoMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('../../services/teams', () => ({
  observeTeamsOrderedByName: (...args: unknown[]) => observeTeamsOrderedByNameMock(...args),
  createTeamIfNotExists: (...args: unknown[]) => createTeamIfNotExistsMock(...args),
  deleteTeam: (...args: unknown[]) => deleteTeamMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    info: (...args: unknown[]) => toastInfoMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const { default: ManageTeamsPanel } = await import('../ManageTeamsPanel');

const teams = [
  { id: 'alpha', name: 'Alpha Squad', pingas: 12 },
  { id: 'beta', name: 'Beta Rockets', pingas: 4 },
];

describe('ManageTeamsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    observeTeamsOrderedByNameMock.mockImplementation((callback: (items: typeof teams) => void) => {
      callback(teams);
      return vi.fn();
    });
    createTeamIfNotExistsMock.mockResolvedValue(undefined);
    deleteTeamMock.mockResolvedValue(undefined);
  });

  it('confirms destructive deletion through an alert dialog', async () => {
    const api = userEvent as typeof userEvent & { setup?: () => typeof userEvent };
    const user = api.setup ? api.setup() : api;

    render(<ManageTeamsPanel />);

    await user.click(screen.getByRole('button', { name: /Delete Alpha Squad/i }));

    expect(screen.getByRole('alertdialog', { name: /Eliminar Equipa/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Confirmar/i }));

    await waitFor(() => {
      expect(deleteTeamMock).toHaveBeenCalledWith('alpha');
    });
    expect(toastInfoMock).toHaveBeenCalledWith('"Alpha Squad" deleted');
  });
});
