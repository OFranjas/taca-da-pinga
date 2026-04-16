import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { observeTeamsOrderedByName } from '../services/teams';
import { addPinga } from '../services/leaderboard';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import styles from './AddPingasPanel.module.css';

type TeamOption = {
  id: string;
  name: string;
  pingas: number;
};

export default function AddPingasPanel() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<TeamOption[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  const [amount, setAmount] = useState(1);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Load teams
  useEffect(() => {
    const unsubscribe = observeTeamsOrderedByName((nextTeams: TeamOption[]) => {
      setTeams(nextTeams);
    });

    return unsubscribe;
  }, []);

  // Filter suggestions
  useEffect(() => {
    if (!search.trim() || (selectedTeam && selectedTeam.name === search)) {
      setFiltered([]);
      return;
    }
    setFiltered(teams.filter((team) => team.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, teams, selectedTeam]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setFiltered([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Add pingas
  const handleAdd = async () => {
    if (!selectedTeam || amount < 1) {
      toast.error('Seleciona uma equipa e define um valor válido');
      return;
    }
    try {
      await addPinga(selectedTeam.id, amount);
      toast.success(`Adicionados ${amount} a ${selectedTeam.name}`);
      setSearch('');
      setSelectedTeam(null);
      setAmount(1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível adicionar pingas';
      toast.error(message);
    }
  };

  // Handle amount input + arrow keys
  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(event.target.value, 10);
    setAmount(isNaN(v) || v < 1 ? 1 : v);
  };
  const handleAmountKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') setAmount((value) => value + 1);
    if (event.key === 'ArrowDown') setAmount((value) => Math.max(1, value - 1));
    if (event.key === 'Enter') void handleAdd();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper} ref={wrapperRef}>
          <Input
            type="text"
            placeholder="Procurar equipa..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedTeam(null);
            }}
            className={styles.searchInput}
          />
          {filtered.length > 0 && (
            <Command className={styles.suggestions}>
              <CommandList>
                <CommandEmpty>Nenhuma equipa encontrada.</CommandEmpty>
                <CommandGroup>
                  {filtered.slice(0, 6).map((team) => (
                    <CommandItem
                      key={team.id}
                      value={team.name}
                      className={styles.suggestion}
                      onSelect={() => {
                        setSelectedTeam(team);
                        setSearch(team.name);
                        setFiltered([]);
                      }}
                    >
                      {team.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </div>
        <div
          className={styles.amountPicker}
          tabIndex={0}
          onKeyDown={handleAmountKey}
          aria-label="Quantidade"
        >
          <Button
            type="button"
            variant="default"
            className={styles.minusBtn}
            onClick={() => setAmount((a) => Math.max(1, a - 1))}
            aria-label="Diminuir"
          >
            –
          </Button>
          <Input
            type="number"
            min="1"
            value={amount}
            onChange={handleAmountChange}
            className={styles.amountInput}
          />
          <Button
            type="button"
            variant="default"
            className={styles.plusBtn}
            onClick={() => setAmount((a) => a + 1)}
            aria-label="Aumentar"
          >
            +
          </Button>
        </div>
      </div>

      <Button type="button" onClick={handleAdd} className={styles.addButton}>
        Adicionar Pingas
      </Button>
    </div>
  );
}
