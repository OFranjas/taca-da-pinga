import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { observeTeamsOrderedByName } from '../services/teams';
import { addPinga } from '../services/leaderboard';
import { toast } from 'react-toastify';
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
          <input
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
            <div className={styles.suggestions}>
              {filtered.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className={styles.suggestion}
                  onClick={() => {
                    setSelectedTeam(t);
                    setSearch(t.name);
                    setFiltered([]);
                  }}
                >
                  {t.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          className={styles.amountPicker}
          tabIndex={0}
          onKeyDown={handleAmountKey}
          aria-label="Quantidade"
        >
          <button
            className={styles.minusBtn}
            onClick={() => setAmount((a) => Math.max(1, a - 1))}
            aria-label="Diminuir"
          >
            –
          </button>
          <input
            type="number"
            min="1"
            value={amount}
            onChange={handleAmountChange}
            className={styles.amountInput}
          />
          <button
            className={styles.plusBtn}
            onClick={() => setAmount((a) => a + 1)}
            aria-label="Aumentar"
          >
            +
          </button>
        </div>
      </div>

      <button onClick={handleAdd} className={styles.addButton}>
        Adicionar Pingas
      </button>
    </div>
  );
}
