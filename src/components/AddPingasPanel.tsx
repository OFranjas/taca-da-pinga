import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { DRINK_CATALOGUE, type ConfiguredDrink, type DrinkIconName } from '../config/drinks';
import { observeTeamsOrderedByName } from '../services/teams';
import { addDrinkPingas } from '../services/leaderboard';
import { auth } from '../firebase';
import {
  IconBeer,
  IconBottle,
  IconGlassCocktail,
  IconGlassGin,
  IconRulerMeasure,
  type TablerIcon,
} from '@tabler/icons-react';
import { toast } from 'react-toastify';
import styles from './AddPingasPanel.module.css';

const MIN_PINGAS = 1;
const MAX_PINGAS = 50;
const INVALID_AMOUNT_MESSAGE = `A quantidade tem de estar entre ${MIN_PINGAS} e ${MAX_PINGAS} pingas.`;
const TEAM_LISTBOX_ID = 'team-suggestions';

const DRINK_ICONS: Record<DrinkIconName, TablerIcon> = {
  beer: IconBeer,
  bottle: IconBottle,
  sangria: IconGlassCocktail,
  spirit: IconGlassGin,
  metro: IconRulerMeasure,
};

type TeamOption = {
  id: string;
  name: string;
  pingas: number;
};

type DrinkQuantities = Record<string, number>;

const activeDrinks = [...DRINK_CATALOGUE]
  .filter((drink) => drink.active)
  .sort((first, second) => first.order - second.order);

const getInitialQuantities = (): DrinkQuantities =>
  Object.fromEntries(activeDrinks.map((drink) => [drink.id, 0]));

const getSubmitErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  const lowerMessage = message.toLowerCase();

  if (
    message === 'Drink total must be an integer between 1 and 50' ||
    message === 'At least one drink is required'
  ) {
    return INVALID_AMOUNT_MESSAGE;
  }

  if (
    lowerMessage.includes('missing or insufficient permissions') ||
    lowerMessage.includes('permission-denied')
  ) {
    return 'Sem permissões para adicionar estas bebidas. Confirma que a sessão de admin está ativa.';
  }

  return message || 'Não foi possível adicionar pingas';
};

const formatDrinkSummary = (items: Array<{ drink: ConfiguredDrink; quantity: number }>) =>
  items.map(({ drink, quantity }) => `${quantity}× ${drink.name}`).join(' + ');

const formatCount = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`;

export default function AddPingasPanel() {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<TeamOption[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  const [quantities, setQuantities] = useState<DrinkQuantities>(getInitialQuantities);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const submissionLockRef = useRef(false);

  useEffect(() => {
    const unsubscribe = observeTeamsOrderedByName((nextTeams: TeamOption[]) => {
      setTeams(nextTeams);
      setIsLoaded(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!search.trim() || (selectedTeam && selectedTeam.name === search)) {
      setFiltered([]);
      return;
    }
    setFiltered(teams.filter((team) => team.name.toLowerCase().includes(search.toLowerCase())));
  }, [search, teams, selectedTeam]);

  const visibleTeams = filtered.slice(0, 6);

  useEffect(() => {
    setActiveSuggestionIndex(visibleTeams.length > 0 ? 0 : -1);
  }, [search, selectedTeam, visibleTeams.length]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setFiltered([]);
        setActiveSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedItems = useMemo(
    () =>
      activeDrinks
        .map((drink) => ({ drink, quantity: quantities[drink.id] ?? 0 }))
        .filter((item) => item.quantity > 0),
    [quantities]
  );
  const drinkCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const derivedTotal = selectedItems.reduce(
    (total, item) => total + item.quantity * item.drink.pingaValue,
    0
  );
  const isOverLimit = derivedTotal > MAX_PINGAS;
  const canSubmit =
    Boolean(selectedTeam) && derivedTotal >= MIN_PINGAS && !isOverLimit && !isSubmitting;

  const selectTeam = (team: TeamOption) => {
    setSelectedTeam(team);
    setSearch(team.name);
    setFiltered([]);
    setActiveSuggestionIndex(-1);
    setSubmitError(null);
  };

  const handleTeamKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && visibleTeams.length > 0) {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % visibleTeams.length);
    } else if (event.key === 'ArrowUp' && visibleTeams.length > 0) {
      event.preventDefault();
      setActiveSuggestionIndex(
        (current) => (current - 1 + visibleTeams.length) % visibleTeams.length
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (visibleTeams.length > 0 && activeSuggestionIndex >= 0) {
        selectTeam(visibleTeams[activeSuggestionIndex]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setFiltered([]);
      setActiveSuggestionIndex(-1);
    }
  };

  const updateQuantity = (drink: ConfiguredDrink, nextQuantity: number) => {
    const safeQuantity = Number.isInteger(nextQuantity) && nextQuantity >= 0 ? nextQuantity : 0;
    setSubmitError(null);
    setQuantities((current) => ({ ...current, [drink.id]: safeQuantity }));
  };

  const clearQuantities = () => {
    if (isSubmitting) return;
    setSubmitError(null);
    setQuantities(getInitialQuantities());
  };

  const handleAdd = async () => {
    if (submissionLockRef.current) return;

    if (!selectedTeam) {
      const message = 'Seleciona uma equipa.';
      setSubmitError(message);
      toast.error(message);
      return;
    }

    if (derivedTotal < MIN_PINGAS || derivedTotal > MAX_PINGAS) {
      setSubmitError(INVALID_AMOUNT_MESSAGE);
      toast.error(INVALID_AMOUNT_MESSAGE);
      return;
    }

    setSubmitError(null);
    submissionLockRef.current = true;
    setIsSubmitting(true);
    try {
      await addDrinkPingas({
        teamId: selectedTeam.id,
        items: selectedItems.map(({ drink, quantity }) => ({ drinkId: drink.id, quantity })),
        actorUid: auth.currentUser?.uid,
      });
      toast.success(
        `Registado: ${formatDrinkSummary(selectedItems)} para ${selectedTeam.name} (+${derivedTotal} ${derivedTotal === 1 ? 'pinga' : 'pingas'})`
      );
      setSearch('');
      setSelectedTeam(null);
      setQuantities(getInitialQuantities());
    } catch (error) {
      const message = getSubmitErrorMessage(error);
      setSubmitError(message);
      toast.error(message);
    } finally {
      submissionLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className={styles.panel}
      onSubmit={(event) => {
        event.preventDefault();
        void handleAdd();
      }}
    >
      <div className={styles.searchWrapper} ref={wrapperRef}>
        <label htmlFor="team-search" className={styles.label}>
          Equipa
        </label>
        <input
          id="team-search"
          type="text"
          placeholder={isLoaded ? 'Procurar equipa' : 'A carregar equipas...'}
          aria-label="Procurar equipa"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={visibleTeams.length > 0}
          aria-controls={TEAM_LISTBOX_ID}
          aria-activedescendant={
            activeSuggestionIndex >= 0 && activeSuggestionIndex < visibleTeams.length
              ? `team-option-${visibleTeams[activeSuggestionIndex].id}`
              : undefined
          }
          autoComplete="off"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSelectedTeam(null);
            setSubmitError(null);
          }}
          onKeyDown={handleTeamKeyDown}
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
        {visibleTeams.length > 0 && (
          <div
            className={styles.suggestions}
            id={TEAM_LISTBOX_ID}
            role="listbox"
            aria-label="Equipas encontradas"
          >
            {visibleTeams.map((team, index) => (
              <button
                type="button"
                key={team.id}
                id={`team-option-${team.id}`}
                className={styles.suggestion}
                role="option"
                aria-selected={index === activeSuggestionIndex}
                onClick={() => selectTeam(team)}
              >
                {team.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <fieldset className={styles.drinksFieldset} disabled={isSubmitting}>
        <legend className={styles.sectionLegend}>Bebidas</legend>
        <div className={styles.drinkList}>
          {activeDrinks.map((drink) => {
            const quantity = quantities[drink.id] ?? 0;
            const imageFailed = failedImages[drink.id];
            const DrinkIcon = DRINK_ICONS[drink.icon];
            return (
              <div className={styles.drinkRow} key={drink.id}>
                {drink.imageSrc && !imageFailed ? (
                  <img
                    className={styles.drinkImage}
                    src={drink.imageSrc}
                    alt=""
                    onError={() => setFailedImages((current) => ({ ...current, [drink.id]: true }))}
                  />
                ) : (
                  <span
                    className={styles.drinkFallback}
                    data-testid={`drink-fallback-${drink.id}`}
                    aria-hidden="true"
                  >
                    <DrinkIcon size={24} stroke={1.8} />
                  </span>
                )}
                <div className={styles.drinkInfo}>
                  <span className={styles.drinkName}>{drink.name}</span>
                  <span className={styles.drinkUnit}>
                    {formatCount(drink.pingaValue, 'pinga', 'pingas')}/un.
                  </span>
                </div>
                <div className={styles.quantityPicker}>
                  <button
                    type="button"
                    className={styles.stepperButton}
                    onClick={() => updateQuantity(drink, quantity - 1)}
                    aria-label={`Diminuir quantidade de ${drink.name}`}
                    disabled={quantity === 0}
                  >
                    −
                  </button>
                  <label className={styles.visuallyHidden} htmlFor={`drink-${drink.id}`}>
                    Quantidade de {drink.name}
                  </label>
                  <input
                    id={`drink-${drink.id}`}
                    className={styles.quantityInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(event) => updateQuantity(drink, Number(event.target.value))}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        updateQuantity(drink, quantity + 1);
                      }
                      if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        updateQuantity(drink, quantity - 1);
                      }
                    }}
                    aria-describedby={`drink-${drink.id}-subtotal`}
                  />
                  <button
                    type="button"
                    className={styles.stepperButton}
                    onClick={() => updateQuantity(drink, quantity + 1)}
                    aria-label={`Aumentar quantidade de ${drink.name}`}
                  >
                    +
                  </button>
                </div>
                <span className={styles.lineSubtotal} id={`drink-${drink.id}-subtotal`}>
                  +{formatCount(quantity * drink.pingaValue, 'pinga', 'pingas')}
                </span>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className={styles.summaryRow}>
        <div>
          <span className={styles.summaryLabel}>Resumo</span>
          <strong aria-live="polite" aria-atomic="true">
            {formatCount(drinkCount, 'bebida', 'bebidas')} · +
            {formatCount(derivedTotal, 'pinga', 'pingas')}
          </strong>
        </div>
        <button
          type="button"
          className={styles.clearButton}
          onClick={clearQuantities}
          disabled={isSubmitting}
        >
          Limpar
        </button>
      </div>

      {isOverLimit ? (
        <p className={styles.limitMessage} role="alert">
          O máximo por adição é de {MAX_PINGAS} pingas. Reduz as quantidades para continuar.
        </p>
      ) : null}
      {submitError ? (
        <p className={styles.errorMessage} role="alert">
          {submitError}
        </p>
      ) : null}

      <button type="submit" className={styles.addButton} disabled={!canSubmit}>
        {isSubmitting ? 'A guardar...' : 'Adicionar'}
      </button>
    </form>
  );
}
