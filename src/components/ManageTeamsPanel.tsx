import { useEffect, useMemo, useState } from 'react';
import {
  observeTeamsOrderedByName,
  createTeamIfNotExists,
  deleteTeam,
  TEAM_NAME_MAX_LENGTH,
  updateTeamName,
} from '../services/teams';
import { toast } from 'react-toastify';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { AdminActionButton } from '../ui/components/AdminActionButton';
import styles from './ManageTeamsPanel.module.css';
import ConfirmModal from './ConfirmModal';

type Team = {
  id: string;
  name: string;
  pingas: number;
};

export default function ManageTeamsPanel() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newName, setNewName] = useState('');
  const [filter, setFilter] = useState('');
  const [toDelete, setToDelete] = useState<Team | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = observeTeamsOrderedByName((nextTeams: Team[]) => {
      setTeams(nextTeams);
      setIsLoaded(true);
    });

    return unsubscribe;
  }, []);

  const createTeam = async () => {
    const nameTrim = newName.trim();
    if (!nameTrim) {
      toast.error('Nome não pode estar vazio');
      return;
    }
    if (nameTrim.length > TEAM_NAME_MAX_LENGTH) {
      toast.error(`O nome não pode ter mais de ${TEAM_NAME_MAX_LENGTH} caracteres`);
      return;
    }
    try {
      await createTeamIfNotExists(nameTrim);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const { code } = error as { code?: string };
        if (code === 'already-exists') {
          toast.error('Equipa já existe');
          return;
        }
      }

      const message = error instanceof Error ? error.message : 'Não foi possível criar a equipa';
      toast.error(message);
      return;
    }
    toast.success('Equipa criada');
    setNewName('');
  };

  const confirmDelete = async () => {
    if (!toDelete) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteTeam(toDelete.id);
      toast.info(`"${toDelete.name}" eliminada`);
      setToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível eliminar a equipa';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditingTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditName(team.name);
  };

  const cancelEditingTeam = () => {
    setEditingTeamId(null);
    setEditName('');
  };

  const saveTeamName = async (team: Team) => {
    const name = editName.trim();
    if (!name) {
      toast.error('Nome não pode estar vazio');
      return;
    }
    if (name.length > TEAM_NAME_MAX_LENGTH) {
      toast.error(`O nome não pode ter mais de ${TEAM_NAME_MAX_LENGTH} caracteres`);
      return;
    }

    setBusyTeamId(team.id);
    try {
      await updateTeamName(team.id, name);
      toast.success('Equipa atualizada');
      cancelEditingTeam();
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const { code } = error as { code?: string };
        if (code === 'already-exists') {
          toast.error('Equipa já existe');
          return;
        }
      }

      const message =
        error instanceof Error ? error.message : 'Não foi possível atualizar a equipa';
      toast.error(message);
    } finally {
      setBusyTeamId(null);
    }
  };

  const visible = useMemo(
    () => teams.filter((team) => team.name.toLowerCase().includes(filter.toLowerCase())),
    [filter, teams]
  );

  return (
    <div className={styles.panel}>
      <div className={styles.top}>
        <input
          id="new-team-name"
          type="text"
          placeholder="Nova equipa..."
          aria-label="Nova equipa"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={styles.input}
        />
        <button
          type="button"
          onClick={createTeam}
          className={styles.createBtn}
          disabled={Boolean(editingTeamId) || Boolean(busyTeamId)}
        >
          Criar
        </button>
      </div>
      <div className={styles.filterWrapper}>
        <input
          id="team-filter"
          type="text"
          placeholder="Filtrar equipas..."
          aria-label="Filtrar equipas"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.input}
        />
      </div>

      {!isLoaded ? (
        <div className={styles.skeletonList} role="status" aria-label="A carregar equipas">
          <span className={styles.visuallyHidden}>A carregar equipas...</span>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className={styles.skeletonItem}>
              <span className={styles.skeletonDot} />
              <span className={styles.skeletonName} />
              <span className={styles.skeletonPill} />
            </div>
          ))}
        </div>
      ) : (
        <ul className={styles.list}>
          {visible.map((team) => (
            <li key={team.id} className={styles.item}>
              <div className={styles.left}>
                <span className={styles.dot} aria-hidden />
                {editingTeamId === team.id ? (
                  <form
                    className={styles.editForm}
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveTeamName(team);
                    }}
                  >
                    <label className={styles.editField}>
                      <span>Nome da equipa</span>
                      <input
                        type="text"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        disabled={busyTeamId === team.id}
                        autoFocus
                      />
                    </label>
                    <div className={styles.editActions}>
                      <button
                        type="submit"
                        className={styles.saveBtn}
                        disabled={busyTeamId === team.id}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={cancelEditingTeam}
                        disabled={busyTeamId === team.id}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <span className={styles.teamName}>{team.name}</span>
                )}
              </div>
              <div className={styles.right}>
                <span className={styles.countPill}>{team.pingas}</span>
                {editingTeamId === team.id ? null : (
                  <div className={styles.actionGroup}>
                    <AdminActionButton
                      icon={IconPencil}
                      onClick={() => startEditingTeam(team)}
                      disabled={Boolean(editingTeamId) || busyTeamId === team.id}
                    >
                      <span className={styles.actionLabel}>Editar</span>
                    </AdminActionButton>
                    <AdminActionButton
                      icon={IconTrash}
                      tone="danger"
                      onClick={() => setToDelete(team)}
                      disabled={Boolean(editingTeamId) || busyTeamId === team.id}
                    >
                      <span className={styles.actionLabel}>Eliminar</span>
                    </AdminActionButton>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!toDelete}
        title="Eliminar Equipa?"
        message={`Tem a certeza de que deseja eliminar "${toDelete?.name}"?`}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        confirmLabel={isDeleting ? 'A eliminar...' : 'Eliminar'}
      />
    </div>
  );
}
