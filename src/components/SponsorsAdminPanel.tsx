import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  createSponsor,
  deleteSponsor,
  observeSponsors,
  reorderSponsors,
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

const ChevronUpIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M7 14.5 12 9l5 5.5" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m7 9.5 5 5.5 5-5.5" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M4.5 19.5h4.25L18.5 9.75a2.2 2.2 0 0 0-3.1-3.1L5.65 16.4 4.5 19.5Z" />
    <path d="m13.75 8.25 2 2" />
  </svg>
);

export default function SponsorsAdminPanel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [form, setForm] = useState<SponsorFormState>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [busySponsorId, setBusySponsorId] = useState<string | null>(null);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | null>(null);
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = observeSponsors(
      (nextSponsors) => {
        setSponsors(nextSponsors);
        setIsLoaded(true);
      },
      {},
      () => {
        setIsLoaded(true);
        toast.error('Não foi possível carregar patrocinadores');
      }
    );

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
    const formElement = event.currentTarget;
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
      formElement.reset();
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

  const startEditingSponsor = (sponsor: Sponsor) => {
    setEditingSponsorId(sponsor.id);
    setEditName(sponsor.name);
    setEditImageFile(null);
  };

  const cancelEditingSponsor = () => {
    setEditingSponsorId(null);
    setEditName('');
    setEditImageFile(null);
  };

  const saveSponsorEdit = async (sponsor: Sponsor) => {
    const name = editName.trim();
    if (!name) {
      toast.error('Indica o nome do patrocinador');
      return;
    }

    setBusySponsorId(sponsor.id);
    try {
      await updateSponsor(sponsor.id, {
        name,
        imageFile: editImageFile,
      });
      toast.success('Patrocinador atualizado');
      cancelEditingSponsor();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Não foi possível atualizar patrocinador';
      toast.error(message);
    } finally {
      setBusySponsorId(null);
    }
  };

  const saveSponsorOrder = async (reorderedSponsors: Sponsor[], movedSponsor: Sponsor) => {
    setBusySponsorId(movedSponsor.id);

    try {
      await reorderSponsors(reorderedSponsors.map((sponsor) => sponsor.id));
      toast.success('Ordem atualizada');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível atualizar a ordem';
      toast.error(message);
    } finally {
      setBusySponsorId(null);
    }
  };

  const moveSponsor = async (sponsorIndex: number, direction: -1 | 1) => {
    const nextIndex = sponsorIndex + direction;
    if (nextIndex < 0 || nextIndex >= sponsors.length) {
      return;
    }

    const reorderedSponsors = [...sponsors];
    const [movedSponsor] = reorderedSponsors.splice(sponsorIndex, 1);
    reorderedSponsors.splice(nextIndex, 0, movedSponsor);
    await saveSponsorOrder(reorderedSponsors, movedSponsor);
  };

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

      {isLoaded ? (
        <div className={styles.summary} aria-live="polite">
          <strong>{activeSponsors.length}</strong> visíveis de {sponsors.length}
        </div>
      ) : null}

      {!isLoaded ? (
        <div className={styles.skeletonList} role="status" aria-label="A carregar patrocinadores">
          <span className={styles.visuallyHidden}>A carregar patrocinadores...</span>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={styles.skeletonItem}>
              <span className={styles.skeletonLogo} />
              <span className={styles.skeletonCopy} />
              <span className={styles.skeletonActions} />
            </div>
          ))}
        </div>
      ) : (
        <ul className={styles.list}>
          {sponsors.map((sponsor, index) => {
            const isBusy = busySponsorId === sponsor.id;
            const isEditing = editingSponsorId === sponsor.id;
            return (
              <li key={sponsor.id} className={styles.item}>
                <div className={styles.logoFrame}>
                  <img src={sponsor.imageDataUrl} alt={sponsor.name} className={styles.logo} />
                </div>
                {isEditing ? (
                  <div className={styles.editFields}>
                    <label>
                      <span>Nome</span>
                      <input
                        type="text"
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        disabled={isBusy}
                      />
                    </label>
                    <label className={styles.replaceLogoButton}>
                      <span>{editImageFile ? editImageFile.name : 'Substituir logotipo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setEditImageFile(event.target.files?.[0] ?? null)}
                        disabled={isBusy}
                      />
                    </label>
                  </div>
                ) : (
                  <div className={styles.itemCopy}>
                    <strong>{sponsor.name}</strong>
                    <span>{sponsor.active ? 'Visível no site' : 'Oculto'}</span>
                  </div>
                )}
                <div className={`${styles.actions} ${isEditing ? styles.editActions : ''}`}>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          void saveSponsorEdit(sponsor);
                        }}
                        disabled={isBusy}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        className={styles.neutralButton}
                        onClick={cancelEditingSponsor}
                        disabled={isBusy}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={styles.iconActionGroup}>
                        <button
                          type="button"
                          className={`${styles.orderButton} ${styles.iconButton}`}
                          onClick={() => {
                            void moveSponsor(index, -1);
                          }}
                          disabled={isBusy || index === 0}
                          aria-label={`Mover ${sponsor.name} para cima`}
                        >
                          <ChevronUpIcon />
                        </button>
                        <button
                          type="button"
                          className={`${styles.orderButton} ${styles.iconButton}`}
                          onClick={() => {
                            void moveSponsor(index, 1);
                          }}
                          disabled={isBusy || index === sponsors.length - 1}
                          aria-label={`Mover ${sponsor.name} para baixo`}
                        >
                          <ChevronDownIcon />
                        </button>
                        <button
                          type="button"
                          className={`${styles.neutralButton} ${styles.iconButton}`}
                          onClick={() => startEditingSponsor(sponsor)}
                          disabled={isBusy}
                          aria-label={`Editar ${sponsor.name}`}
                          title="Editar"
                        >
                          <EditIcon />
                        </button>
                      </div>
                      <div className={styles.siteActionGroup}>
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
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

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
