import React, { useState, useEffect } from 'react';
import { observeTeamsOrderedByName, createTeamIfNotExists, deleteTeam } from '../services/teams';
import { toast } from 'react-toastify';
import styles from './ManageTeamsPanel.module.css';
import ConfirmModal from './ConfirmModal';

export default function ManageTeamsPanel() {
  const [teams, setTeams] = useState([]);
  const [newName, setNewName] = useState('');
  const [filter, setFilter] = useState('');
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => observeTeamsOrderedByName(setTeams), []);

  const createTeam = async () => {
    const nameTrim = newName.trim();
    if (!nameTrim) {
      toast.error('Nome não pode estar vazio');
      return;
    }
    try {
      await createTeamIfNotExists(nameTrim);
    } catch (e) {
      if (e?.code === 'already-exists') {
        toast.error('Equipa já existe');
        return;
      }
      throw e;
    }
    toast.success('Equipa criada');
    setNewName('');
  };

  const confirmDelete = async () => {
    await deleteTeam(toDelete.id);
    toast.info(`"${toDelete.name}" deleted`);
    setToDelete(null);
  };

  const visible = teams.filter((t) => t.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className={styles.panel}>
      <div className={styles.top}>
        <input
          type="text"
          placeholder="Nova equipa..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={styles.input}
        />
        <button onClick={createTeam} className={styles.createBtn}>
          Criar
        </button>
      </div>
      <div className={styles.filterWrapper}>
        <input
          type="text"
          placeholder="Filtrar equipas..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.input}
        />
      </div>

      <ul className={styles.list}>
        {visible.map((team) => (
          <li key={team.id} className={styles.item}>
            <div className={styles.left}>
              <span className={styles.dot} aria-hidden />
              <span className={styles.teamName}>{team.name}</span>
            </div>
            <div className={styles.right}>
              <span className={styles.countPill}>{team.pingas}</span>
              <button
                onClick={() => setToDelete(team)}
                className={styles.deleteBtn}
                aria-label={`Delete ${team.name}`}
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmModal
        isOpen={!!toDelete}
        title="Eliminar Equipa?"
        message={`Tem a certeza de que deseja eliminar "${toDelete?.name}"?`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
