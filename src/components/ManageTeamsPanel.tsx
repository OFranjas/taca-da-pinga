import { useEffect, useMemo, useState } from 'react';
import { observeTeamsOrderedByName, createTeamIfNotExists, deleteTeam } from '../services/teams';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import styles from './ManageTeamsPanel.module.css';

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

  useEffect(() => {
    const unsubscribe = observeTeamsOrderedByName((nextTeams: Team[]) => {
      setTeams(nextTeams);
    });

    return unsubscribe;
  }, []);

  const createTeam = async () => {
    const nameTrim = newName.trim();
    if (!nameTrim) {
      toast.error('Nome não pode estar vazio');
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
      throw error;
    }
    toast.success('Equipa criada');
    setNewName('');
  };

  const confirmDelete = async () => {
    if (!toDelete) {
      return;
    }
    await deleteTeam(toDelete.id);
    toast.info(`"${toDelete.name}" deleted`);
    setToDelete(null);
  };

  const visible = useMemo(
    () => teams.filter((team) => team.name.toLowerCase().includes(filter.toLowerCase())),
    [filter, teams]
  );

  return (
    <div className={styles.panel}>
      <div className={styles.top}>
        <Input
          type="text"
          placeholder="Nova equipa..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className={styles.input}
        />
        <Button type="button" onClick={createTeam} className={styles.createBtn}>
          Criar
        </Button>
      </div>
      <div className={styles.filterWrapper}>
        <Input
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
              <Badge variant="outline" className={styles.countPill}>
                {team.pingas}
              </Badge>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setToDelete(team)}
                className={styles.deleteBtn}
                aria-label={`Delete ${team.name}`}
              >
                Eliminar
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className={styles.confirmContent}>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Equipa?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete
                ? `Tem a certeza de que deseja eliminar "${toDelete.name}"?`
                : 'Tem a certeza de que deseja eliminar esta equipa?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
