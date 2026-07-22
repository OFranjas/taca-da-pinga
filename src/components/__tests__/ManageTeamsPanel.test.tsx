import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ManageTeamsPanel from '../ManageTeamsPanel';
import { toast } from 'react-toastify';
import { observeTeamsOrderedByName, updateTeamName } from '../../services/teams';

vi.mock('../../services/teams', () => ({
  createTeamIfNotExists: vi.fn(),
  deleteTeam: vi.fn(),
  observeTeamsOrderedByName: vi.fn(),
  TEAM_NAME_MAX_LENGTH: 80,
  updateTeamName: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

const teams = [
  { id: 'team-1', name: 'Equipa Alfa', pingas: 12 },
  { id: 'team-2', name: 'Equipa Beta', pingas: 4 },
];

const observeTeamsMock = vi.mocked(observeTeamsOrderedByName);
const updateTeamNameMock = vi.mocked(updateTeamName);
const toastMock = vi.mocked(toast);

describe('ManageTeamsPanel editing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    observeTeamsMock.mockImplementation((callback) => {
      callback(teams);
      return vi.fn();
    });
    updateTeamNameMock.mockResolvedValue(undefined);
  });

  test('edits a team name and saves it from the inline form', async () => {
    render(<ManageTeamsPanel />);

    fireEvent.click(
      await screen.findAllByRole('button', { name: 'Editar' }).then((buttons) => buttons[0])
    );
    const input = screen.getByRole('textbox', { name: 'Nome da equipa' });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: 'Equipa Campeã' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(updateTeamNameMock).toHaveBeenCalledWith('team-1', 'Equipa Campeã');
    });
    expect(toastMock.success).toHaveBeenCalledWith('Equipa atualizada');
    expect(screen.queryByRole('textbox', { name: 'Nome da equipa' })).not.toBeInTheDocument();
  });

  test('cancels editing without saving', async () => {
    render(<ManageTeamsPanel />);

    fireEvent.click(
      await screen.findAllByRole('button', { name: 'Editar' }).then((buttons) => buttons[0])
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome da equipa' }), {
      target: { value: 'Nome temporário' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(updateTeamNameMock).not.toHaveBeenCalled();
    expect(screen.getByText('Equipa Alfa')).toBeInTheDocument();
  });

  test('keeps the editor open and reports duplicate and empty names', async () => {
    render(<ManageTeamsPanel />);
    fireEvent.click(
      await screen.findAllByRole('button', { name: 'Editar' }).then((buttons) => buttons[0])
    );
    const input = screen.getByRole('textbox', { name: 'Nome da equipa' });

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);
    expect(toastMock.error).toHaveBeenCalledWith('Nome não pode estar vazio');

    const duplicateError = Object.assign(new Error('Team already exists'), {
      code: 'already-exists',
    });
    updateTeamNameMock.mockRejectedValueOnce(duplicateError);
    fireEvent.change(input, { target: { value: 'Equipa Beta' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith('Equipa já existe');
    });
    expect(screen.getByRole('textbox', { name: 'Nome da equipa' })).toBeInTheDocument();
  });

  test('rejects overly long names before calling the team service', async () => {
    render(<ManageTeamsPanel />);

    const newTeamInput = screen.getByRole('textbox', { name: 'Nova equipa' });
    fireEvent.change(newTeamInput, { target: { value: 'A'.repeat(81) } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    expect(toastMock.error).toHaveBeenCalledWith('O nome não pode ter mais de 80 caracteres');
  });
});
