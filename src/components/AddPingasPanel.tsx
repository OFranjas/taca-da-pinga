import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { observeTeamsOrderedByName } from '../services/teams';
import { addPinga } from '../services/leaderboard';
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import styles from './AddPingasPanel.module.css';

const MIN_PINGAS = 1;
const MAX_PINGAS = 50;

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Load teams
  useEffect(() => {
    const unsubscribe = observeTeamsOrderedByName((nextTeams: TeamOption[]) => {
      setTeams(nextTeams);
      setIsLoaded(true);
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
    if (!selectedTeam || amount < MIN_PINGAS || amount > MAX_PINGAS) {
      toast.error('Seleciona uma equipa e define um valor válido');
      return;
    }
    setIsSubmitting(true);
    try {
      await addPinga(selectedTeam.id, amount, auth.currentUser?.uid);
      toast.success(`Adicionados ${amount} a ${selectedTeam.name}`);
      setSearch('');
      setSelectedTeam(null);
      setAmount(1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível adicionar pingas';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle amount input + arrow keys
  const clampAmount = (value: number) => Math.min(MAX_PINGAS, Math.max(MIN_PINGAS, value));
  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(event.target.value, 10);
    setAmount(isNaN(v) ? MIN_PINGAS : clampAmount(v));
  };
  const handleAmountKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') setAmount((value) => clampAmount(value + 1));
    if (event.key === 'ArrowDown') setAmount((value) => clampAmount(value - 1));
    if (event.key === 'Enter') void handleAdd();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.searchRow}>
        <div className={styles.searchWrapper} ref={wrapperRef}>
          <label htmlFor="team-search" className={styles.label}>
            Equipa
          </label>
          <input
            id="team-search"
            type="text"
            placeholder={isLoaded ? 'Procurar equipa' : 'A carregar equipas...'}
            aria-label="Procurar equipa"
            autoComplete="off"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedTeam(null);
            }}
            className={styles.searchInput}
            disabled={!isLoaded || isSubmitting}
          />
          {!isLoaded ? (
            <div className={styles.searchSkeleton} role="status" aria-label="A carregar equipas">
              <span className={styles.visuallyHidden}>A carregar equipas...</span>
              <span />
              <span />
              <span />
            </div>
          ) : null}
          {filtered.length > 0 && (
            <div className={styles.suggestions}>
              {filtered.slice(0, 6).map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={styles.suggestion}
                  onClick={() => {
                    setSelectedTeam(t);
                    setSearch(t.name);
                    setFiltered([]);
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.amountGroup}>
          <label htmlFor="pinga-amount" className={styles.amountLabel}>
            Pingas
          </label>
          <div
            className={styles.amountPicker}
            tabIndex={0}
            onKeyDown={handleAmountKey}
            aria-label="Quantidade"
          >
            <button
              type="button"
              className={styles.minusBtn}
              onClick={() => setAmount((a) => clampAmount(a - 1))}
              aria-label="Diminuir"
              disabled={isSubmitting || amount <= MIN_PINGAS}
            >
              -
            </button>
            <input
              id="pinga-amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              aria-label="Quantidade de pingas"
              value={amount}
              onChange={handleAmountChange}
              onFocus={(event) => event.currentTarget.select()}
              className={styles.amountInput}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className={styles.plusBtn}
              onClick={() => setAmount((a) => clampAmount(a + 1))}
              aria-label="Aumentar"
              disabled={isSubmitting || amount >= MAX_PINGAS}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAdd}
        className={styles.addButton}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'A guardar...' : 'Registar'}
      </button>
    </div>
  );
}
