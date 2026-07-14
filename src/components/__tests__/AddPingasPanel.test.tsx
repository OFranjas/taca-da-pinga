import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AddPingasPanel from '../AddPingasPanel';
import { observeTeamsOrderedByName } from '../../services/teams';
import { addDrinkPingas } from '../../services/leaderboard';
import { toast } from 'react-toastify';

vi.mock('../../services/teams', () => ({
  observeTeamsOrderedByName: vi.fn(),
}));

vi.mock('../../services/leaderboard', () => ({
  addDrinkPingas: vi.fn(),
}));

vi.mock('../../firebase', () => ({
  auth: { currentUser: { uid: 'admin-1' } },
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const observeTeamsMock = vi.mocked(observeTeamsOrderedByName);
const addDrinkPingasMock = vi.mocked(addDrinkPingas);
const toastMock = vi.mocked(toast);
const unsubscribe = vi.fn();

const teams = [
  { id: 'team-1', name: 'Equipa Alfa', pingas: 12 },
  { id: 'team-2', name: 'Equipa Beta', pingas: 4 },
];

const renderPanel = () => {
  observeTeamsMock.mockImplementation((callback) => {
    callback(teams);
    return unsubscribe;
  });
  return render(<AddPingasPanel />);
};

const selectTeam = async (user: typeof userEvent) => {
  const search = screen.getByRole('combobox', { name: 'Procurar equipa' });
  await user.type(search, 'Alfa');
  await user.click(screen.getByRole('option', { name: 'Equipa Alfa' }));
};

describe('AddPingasPanel drinks workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    addDrinkPingasMock.mockResolvedValue(undefined);
  });

  test('renders all active drinks with stable fallback and starts with submit disabled', () => {
    renderPanel();

    expect(screen.getByText('Cerveja')).toBeInTheDocument();
    expect(screen.getByText('Cidra')).toBeInTheDocument();
    expect(screen.getByText('Sangria')).toBeInTheDocument();
    expect(screen.getByText('Bebida branca')).toBeInTheDocument();
    expect(screen.getByText('Metro')).toBeInTheDocument();
    expect(document.querySelectorAll('fieldset img')).toHaveLength(5);
    expect(screen.getByText('5 pingas/un.')).toBeInTheDocument();
    expect(screen.getByText('11 pingas/un.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled();
    expect(screen.getByText('0 bebidas · +0 pingas')).toBeInTheDocument();
  });

  test('derives a mixed-drink total and enables submit only after selecting a team', async () => {
    const user = userEvent;
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Cerveja' }));
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Cerveja' }));
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Bebida branca' }));

    expect(screen.getByText('3 bebidas · +7 pingas')).toBeInTheDocument();
    expect(screen.getByText('+2 pingas')).toBeInTheDocument();
    expect(screen.getByText('+5 pingas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled();

    await selectTeam(user);
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeEnabled();
  });

  test('supports keyboard-only team selection without submitting the form', async () => {
    const user = userEvent;
    renderPanel();
    const search = screen.getByRole('combobox', { name: 'Procurar equipa' });

    await user.type(search, 'Equipa');
    expect(search).toHaveAttribute('aria-expanded', 'true');
    expect(search).toHaveAttribute('aria-controls', 'team-suggestions');
    await user.keyboard('{ArrowDown}');
    expect(search).toHaveAttribute('aria-activedescendant', 'team-option-team-2');
    expect(screen.getByRole('option', { name: 'Equipa Beta' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await user.keyboard('{Enter}');

    expect(search).toHaveValue('Equipa Beta');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(addDrinkPingasMock).not.toHaveBeenCalled();
  });

  test('prevents duplicate submissions while the request is pending', async () => {
    const user = userEvent;
    let resolveSubmission: () => void = () => {};
    addDrinkPingasMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmission = resolve;
        })
    );
    renderPanel();
    await selectTeam(user);
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Cerveja' }));

    const submit = screen.getByRole('button', { name: 'Adicionar' });
    await user.click(submit);
    expect(submit).toBeDisabled();
    await user.click(submit);
    expect(addDrinkPingasMock).toHaveBeenCalledTimes(1);

    resolveSubmission();
    await waitFor(() => expect(submit).toBeDisabled());
  });

  test('dismisses team suggestions with Escape', async () => {
    const user = userEvent;
    renderPanel();
    const search = screen.getByRole('combobox', { name: 'Procurar equipa' });

    await user.type(search, 'Equipa');
    expect(screen.getByRole('listbox', { name: 'Equipas encontradas' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    expect(search).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('uses singular Portuguese wording for one drink and one pinga', async () => {
    const user = userEvent;
    renderPanel();
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Cerveja' }));

    expect(screen.getByText('1 bebida · +1 pinga')).toBeInTheDocument();
  });

  test('renders the Tabler fallback icon when a configured image fails', () => {
    const { container } = renderPanel();
    const image = container.querySelector('img');
    expect(image).toBeInTheDocument();

    fireEvent.error(image!);

    const fallback = screen.getByTestId('drink-fallback-beer');
    expect(fallback).toHaveAttribute('aria-hidden', 'true');
    expect(fallback.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(4);
  });

  test('sends only positive selections and resets after a successful submission', async () => {
    const user = userEvent;
    renderPanel();
    await selectTeam(user);
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Cerveja' }));
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Cidra' }));

    await act(async () => {
      user.click(screen.getByRole('button', { name: 'Adicionar' }));
    });

    await waitFor(() => {
      expect(addDrinkPingasMock).toHaveBeenCalledWith({
        teamId: 'team-1',
        actorUid: 'admin-1',
        items: [
          { drinkId: 'beer', quantity: 1 },
          { drinkId: 'cider', quantity: 1 },
        ],
      });
    });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled());
    expect(toastMock.success).toHaveBeenCalledWith(
      'Registado: 1× Cerveja + 1× Cidra para Equipa Alfa (+2 pingas)'
    );
    expect(screen.getByRole('combobox', { name: 'Procurar equipa' })).toHaveValue('');
    expect(screen.getByLabelText('Quantidade de Cidra')).toHaveValue(0);
    expect(screen.getByText('0 bebidas · +0 pingas')).toBeInTheDocument();
  });

  test('clears quantities without clearing the selected team', async () => {
    const user = userEvent;
    renderPanel();
    await selectTeam(user);
    await user.click(screen.getByRole('button', { name: 'Aumentar quantidade de Cerveja' }));
    await user.click(screen.getByRole('button', { name: 'Limpar' }));

    expect(screen.getByRole('combobox', { name: 'Procurar equipa' })).toHaveValue('Equipa Alfa');
    expect(screen.getByLabelText('Quantidade de Cerveja')).toHaveValue(0);
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled();
  });

  test('shows and enforces the 50-pinga submission limit', async () => {
    const user = userEvent;
    renderPanel();
    await selectTeam(user);
    fireEvent.change(screen.getByLabelText('Quantidade de Metro'), { target: { value: '5' } });

    expect(screen.getByText('5 bebidas · +55 pingas')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('O máximo por adição é de 50 pingas');
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeDisabled();
    expect(addDrinkPingasMock).not.toHaveBeenCalled();
  });

  test('supports keyboard quantity changes and renders service errors', async () => {
    const user = userEvent;
    renderPanel();
    const beerQuantity = screen.getByLabelText('Quantidade de Cerveja');
    beerQuantity.focus();
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowDown}');
    expect(beerQuantity).toHaveValue(1);

    await selectTeam(user);
    addDrinkPingasMock.mockRejectedValueOnce(new Error('Falha de rede'));
    await act(async () => {
      user.click(screen.getByRole('button', { name: 'Adicionar' }));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha de rede');
    expect(toastMock.error).toHaveBeenCalledWith('Falha de rede');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Adicionar' })).toBeEnabled());
  });
});
