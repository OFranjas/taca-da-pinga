import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  createSponsor,
  deleteSponsor,
  observeSponsors,
  updateSponsor,
  type Sponsor,
} from '../services/sponsors.service';
import ConfirmModal from './ConfirmModal';
import { toast } from 'react-toastify';
import styles from './SponsorsAdminPanel.module.css';

type SponsorFormState = {
  name: string;
  imageFile: File | null;
};

const initialForm: SponsorFormState = {
  name: '',
  imageFile: null,
};

export default function SponsorsAdminPanel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [form, setForm] = useState<SponsorFormState>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [busySponsorId, setBusySponsorId] = useState<string | null>(null);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | null>(null);

  useEffect(() => {
    const unsubscribe = observeSponsors(setSponsors, {}, () => {
      toast.error('Não foi possível carregar patrocinadores');
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const activeSponsors = useMemo(() => sponsors.filter((sponsor) => sponsor.active), [sponsors]);

  const handleTextChange = (field: 'name') => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, imageFile: event.target.files?.[0] ?? null }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast.error('Indica o nome do patrocinador');
      return;
    }
    if (!form.imageFile) {
      toast.error('Escolhe um logotipo');
      return;
    }

    setIsSaving(true);
    try {
      await createSponsor({
        name,
        imageFile: form.imageFile,
      });
      toast.success('Patrocinador criado');
      setForm(initialForm);
      event.currentTarget.reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível criar patrocinador';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSponsor = useCallback(async (sponsor: Sponsor) => {
    setBusySponsorId(sponsor.id);
    try {
      await updateSponsor(sponsor.id, { active: !sponsor.active });
      toast.success(sponsor.active ? 'Patrocinador ocultado' : 'Patrocinador visível');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível atualizar patrocinador';
      toast.error(message);
    } finally {
      setBusySponsorId(null);
    }
  }, []);

  const removeSponsor = useCallback(async () => {
    if (!sponsorToDelete) {
      return;
    }

    setBusySponsorId(sponsorToDelete.id);
    try {
      await deleteSponsor(sponsorToDelete.id);
      toast.info('Patrocinador eliminado');
      setSponsorToDelete(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível eliminar patrocinador';
      toast.error(message);
    } finally {
      setBusySponsorId(null);
    }
  }, [sponsorToDelete]);

  return (
    <div className={styles.panel}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="sponsor-name">Nome</label>
          <input
            id="sponsor-name"
            type="text"
            value={form.name}
            onChange={handleTextChange('name')}
            placeholder="Nome do patrocinador"
            autoComplete="organization"
          />
        </div>
        <div className={`${styles.field} ${styles.logoField}`}>
          <label htmlFor="sponsor-logo">Logotipo</label>
          <input
            id="sponsor-logo"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          <label htmlFor="sponsor-logo" className={styles.uploadButton}>
            <span>{form.imageFile ? form.imageFile.name : 'Escolher logotipo'}</span>
          </label>
        </div>
        <button type="submit" className={styles.primaryButton} disabled={isSaving}>
          {isSaving ? 'A guardar...' : 'Adicionar patrocinador'}
        </button>
      </form>

      <div className={styles.summary} aria-live="polite">
        <strong>{activeSponsors.length}</strong> visíveis de {sponsors.length}
      </div>

      <ul className={styles.list}>
        {sponsors.map((sponsor) => {
          const isBusy = busySponsorId === sponsor.id;
          return (
            <li key={sponsor.id} className={styles.item}>
              <div className={styles.logoFrame}>
                <img src={sponsor.imageDataUrl} alt={sponsor.name} className={styles.logo} />
              </div>
              <div className={styles.itemCopy}>
                <strong>{sponsor.name}</strong>
                <span>{sponsor.active ? 'Visível no site' : 'Oculto'}</span>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => {
                    void toggleSponsor(sponsor);
                  }}
                  disabled={isBusy}
                >
                  {sponsor.active ? 'Ocultar' : 'Mostrar'}
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => {
                    setSponsorToDelete(sponsor);
                  }}
                  disabled={isBusy}
                >
                  Eliminar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmModal
        isOpen={Boolean(sponsorToDelete)}
        title="Eliminar patrocinador?"
        message={
          sponsorToDelete ? `Vais remover ${sponsorToDelete.name} da lista de patrocinadores.` : ''
        }
        confirmLabel="Eliminar"
        onCancel={() => setSponsorToDelete(null)}
        onConfirm={() => {
          void removeSponsor();
        }}
      />
    </div>
  );
}
