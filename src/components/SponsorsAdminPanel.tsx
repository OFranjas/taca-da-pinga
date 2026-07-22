import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconEye, IconEyeOff, IconGripVertical, IconPencil, IconTrash } from '@tabler/icons-react';
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
import { AdminActionButton } from '../ui/components/AdminActionButton';
import styles from './SponsorsAdminPanel.module.css';

type SponsorFormState = {
  name: string;
  link: string;
  imageFile: File | null;
};

const initialForm: SponsorFormState = {
  name: '',
  link: '',
  imageFile: null,
};

type DragHandleProps = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
};

type SortableSponsorItemProps = {
  disabled: boolean;
  id: UniqueIdentifier;
  children: (dragHandleProps: DragHandleProps) => ReactNode;
};

type SponsorDragPreviewProps = {
  sponsor: Sponsor;
};

export function reorderSponsorsById(
  sponsors: Sponsor[],
  activeId: UniqueIdentifier,
  overId: UniqueIdentifier | null
) {
  if (!overId || activeId === overId) {
    return sponsors;
  }

  const activeIndex = sponsors.findIndex((sponsor) => sponsor.id === activeId);
  const overIndex = sponsors.findIndex((sponsor) => sponsor.id === overId);

  if (activeIndex < 0 || overIndex < 0) {
    return sponsors;
  }

  return arrayMove(sponsors, activeIndex, overIndex);
}

function SortableSponsorItem({ disabled, id, children }: SortableSponsorItemProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      className={`${styles.item} ${isDragging ? styles.itemDragging : ''}`}
      style={style}
    >
      {children({ attributes, listeners, setActivatorNodeRef })}
    </li>
  );
}

function SponsorDragPreview({ sponsor }: SponsorDragPreviewProps) {
  return (
    <div className={styles.dragPreview} aria-hidden="true">
      <div className={styles.logoFrame}>
        <img src={sponsor.imageDataUrl} alt="" className={styles.logo} />
      </div>
      <div className={styles.itemCopy}>
        <strong>{sponsor.name}</strong>
        <span>{sponsor.active ? 'Visível no site' : 'Oculto'}</span>
      </div>
    </div>
  );
}

export default function SponsorsAdminPanel() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [form, setForm] = useState<SponsorFormState>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [busySponsorId, setBusySponsorId] = useState<string | null>(null);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | null>(null);
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [draggingSponsorId, setDraggingSponsorId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const handleTextChange = (field: 'name' | 'link') => (event: ChangeEvent<HTMLInputElement>) => {
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
        link: form.link,
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
    setEditLink(sponsor.link ?? '');
    setEditImageFile(null);
  };

  const cancelEditingSponsor = () => {
    setEditingSponsorId(null);
    setEditName('');
    setEditLink('');
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
      const originalLink = sponsor.link ?? '';
      const linkUpdate = editLink.trim() === originalLink.trim() ? {} : { link: editLink };
      await updateSponsor(sponsor.id, {
        name,
        ...linkUpdate,
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
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível atualizar a ordem';
      toast.error(message);
      return false;
    } finally {
      setBusySponsorId(null);
    }
  };

  const reorderSponsor = async (activeId: UniqueIdentifier, overId: UniqueIdentifier | null) => {
    if (busySponsorId || editingSponsorId) {
      return;
    }

    const reorderedSponsors = reorderSponsorsById(sponsors, activeId, overId);
    if (reorderedSponsors === sponsors) {
      return;
    }

    const movedSponsor = sponsors.find((sponsor) => sponsor.id === activeId);
    if (!movedSponsor) {
      return;
    }

    const previousSponsors = sponsors;
    setSponsors(reorderedSponsors);
    const wasSaved = await saveSponsorOrder(reorderedSponsors, movedSponsor);
    if (!wasSaved) {
      setSponsors(previousSponsors);
    }
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setDraggingSponsorId(String(active.id));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingSponsorId(null);
    void reorderSponsor(active.id, over?.id ?? null);
  };

  const draggingSponsor = sponsors.find((sponsor) => sponsor.id === draggingSponsorId) ?? null;
  const isOrderBusy = Boolean(busySponsorId || editingSponsorId);
  const getSponsorName = (id: UniqueIdentifier) =>
    sponsors.find((sponsor) => sponsor.id === id)?.name ?? 'patrocinador';
  const getSponsorPosition = (id: UniqueIdentifier) =>
    sponsors.findIndex((sponsor) => sponsor.id === id) + 1;

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
        <div className={styles.field}>
          <label htmlFor="sponsor-link">Site (opcional)</label>
          <input
            id="sponsor-link"
            type="url"
            value={form.link}
            onChange={handleTextChange('link')}
            placeholder="https://exemplo.pt"
            inputMode="url"
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
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDraggingSponsorId(null)}
          accessibility={{
            announcements: {
              onDragStart: ({ active }) => `A reordenar ${getSponsorName(active.id)}.`,
              onDragOver: ({ active, over }) => {
                if (!over) {
                  return `A mover ${getSponsorName(active.id)}.`;
                }

                return `${getSponsorName(active.id)} sobre ${getSponsorName(over.id)}, posição ${getSponsorPosition(over.id)}.`;
              },
              onDragEnd: ({ active, over }) =>
                over
                  ? `${getSponsorName(active.id)} movido para a posição ${getSponsorPosition(over.id)}.`
                  : `Reordenação de ${getSponsorName(active.id)} cancelada.`,
              onDragCancel: ({ active }) =>
                `Reordenação de ${getSponsorName(active.id)} cancelada.`,
            },
            screenReaderInstructions: {
              draggable:
                'Para alterar a ordem, prima Espaço ou Enter. Usa as setas para mover e prima Espaço ou Enter para confirmar.',
            },
          }}
        >
          <SortableContext
            items={sponsors.map((sponsor) => sponsor.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className={styles.list}>
              {sponsors.map((sponsor) => {
                const isBusy = busySponsorId === sponsor.id;
                const isEditing = editingSponsorId === sponsor.id;
                return (
                  <SortableSponsorItem
                    key={sponsor.id}
                    id={sponsor.id}
                    disabled={isOrderBusy || isEditing}
                  >
                    {({ attributes, listeners, setActivatorNodeRef }) => (
                      <>
                        {!isEditing ? (
                          <button
                            ref={setActivatorNodeRef}
                            type="button"
                            className={`${styles.dragHandle} ${styles.iconButton}`}
                            disabled={isOrderBusy}
                            aria-label={`Reordenar ${sponsor.name}`}
                            title="Arrastar para reordenar"
                            {...attributes}
                            {...listeners}
                          >
                            <IconGripVertical aria-hidden="true" />
                          </button>
                        ) : (
                          <span className={styles.dragHandleSpacer} aria-hidden="true" />
                        )}
                        <div className={styles.logoFrame}>
                          <img
                            src={sponsor.imageDataUrl}
                            alt={sponsor.name}
                            className={styles.logo}
                          />
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
                            <label>
                              <span>Site (opcional)</span>
                              <input
                                type="url"
                                value={editLink}
                                onChange={(event) => setEditLink(event.target.value)}
                                placeholder="https://exemplo.pt"
                                inputMode="url"
                                disabled={isBusy}
                              />
                            </label>
                            <label className={styles.replaceLogoButton}>
                              <span>
                                {editImageFile ? editImageFile.name : 'Substituir logotipo'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                  setEditImageFile(event.target.files?.[0] ?? null)
                                }
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
                              <AdminActionButton
                                className={styles.adminActionButton}
                                onClick={() => startEditingSponsor(sponsor)}
                                disabled={isBusy}
                                icon={IconPencil}
                              >
                                Editar
                              </AdminActionButton>
                              <div className={styles.siteActionGroup}>
                                <button
                                  type="button"
                                  className={`${styles.secondaryButton} ${styles.actionButton}`}
                                  onClick={() => {
                                    void toggleSponsor(sponsor);
                                  }}
                                  disabled={isBusy}
                                >
                                  {sponsor.active ? (
                                    <IconEyeOff aria-hidden="true" />
                                  ) : (
                                    <IconEye aria-hidden="true" />
                                  )}
                                  {sponsor.active ? 'Ocultar' : 'Mostrar'}
                                </button>
                                <AdminActionButton
                                  className={styles.adminActionButton}
                                  onClick={() => {
                                    setSponsorToDelete(sponsor);
                                  }}
                                  disabled={isBusy}
                                  icon={IconTrash}
                                  tone="danger"
                                >
                                  Eliminar
                                </AdminActionButton>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </SortableSponsorItem>
                );
              })}
            </ul>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {draggingSponsor ? <SponsorDragPreview sponsor={draggingSponsor} /> : null}
          </DragOverlay>
        </DndContext>
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
