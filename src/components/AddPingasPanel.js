import React, { useState, useEffect, useRef } from 'react';
import { observeTeamsOrderedByName } from '../services/teams';
import { addPinga } from '../services/leaderboard';
import { toast } from 'react-toastify';
import styles from './AddPingasPanel.module.css';

export default function AddPingasPanel() {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [amount, setAmount] = useState(1);
  const wrapperRef = useRef(null);

  // Load teams
  useEffect(() => observeTeamsOrderedByName(setTeams), []);

  // Filter suggestions
  useEffect(() => {
    if (!search.trim() || (selectedTeam && selectedTeam.name === search)) {
      setFiltered([]);
      return;
    }
    setFiltered(teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, teams, selectedTeam]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
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
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Handle amount input + arrow keys
  const handleAmountChange = (e) => {
    const v = parseInt(e.target.value, 10);
    setAmount(isNaN(v) || v < 1 ? 1 : v);
  };
  const handleAmountKey = (e) => {
    if (e.key === 'ArrowUp') setAmount((a) => a + 1);
    if (e.key === 'ArrowDown') setAmount((a) => Math.max(1, a - 1));
    if (e.key === 'Enter') handleAdd();
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
