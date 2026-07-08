import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import Header from '../components/Header';
import SponsorsRail from '../components/SponsorsRail';
import { observeLeaderboard } from '../services/leaderboard';
import { observeSponsors, type Sponsor } from '../services/sponsors.service';
import { Card, Page, Section, Stack, Text } from '../ui';
import styles from './Leaderboard.module.css';

import s1 from '../assets/s1.png';
import s2 from '../assets/s2.jpeg';
import s3 from '../assets/s3.png';
import s4 from '../assets/s4.png';
import s5 from '../assets/s5.png';
import s6 from '../assets/s6.png';
import s7 from '../assets/s7.jpeg';
import s8 from '../assets/s8.jpeg';
import s9 from '../assets/s9.jpeg';
import s10 from '../assets/s10.jpeg';
import s11 from '../assets/s11.png';
import s12 from '../assets/s12.png';
import { LeaderboardRow } from '../components/LeaderboardRow';

const ROW_HEIGHT = 80;
const ROW_GAP = 12; // matches --ui-space-sm at the base font size
const ROW_STRIDE = ROW_HEIGHT + ROW_GAP;
const VIRTUALIZE_THRESHOLD = 50;
const VISIBLE_WINDOW = 18;
const BUFFER = 6;
const MAX_RENDERED_ROWS = VISIBLE_WINDOW + BUFFER * 2;
const DISPLAY_PINNED_ROWS = 5;
const DISPLAY_SCROLL_STEP = 112;
const DISPLAY_SCROLL_INTERVAL_MS = 2600;

const numberFormatter = new Intl.NumberFormat('pt-PT');

const sponsorLeft = [s1, s3, s5, s7, s10, s11];
const sponsorRight = [s2, s4, s6, s8, s9, s12];
const skeletonRows = Array.from({ length: 8 }, (_, index) => index);

type ServiceTeam = {
  id: string;
  name?: string | null;
  pingas?: number | null;
};

type LeaderboardTeam = {
  id: string;
  name: string;
  pingas: number;
};

type ObserveLeaderboard = (callback: (teams: ServiceTeam[]) => void) => () => void;

const observeLeaderboardTyped = observeLeaderboard as ObserveLeaderboard;

type LeaderboardProps = {
  displayMode?: boolean;
};

const sanitizeTeams = (incoming: ServiceTeam[]): LeaderboardTeam[] =>
  incoming
    .map((team) => {
      const safeName =
        typeof team.name === 'string' && team.name.trim().length > 0
          ? team.name.trim()
          : 'Equipa sem nome';
      const safePingas = Number(team.pingas ?? 0);
      return {
        id: team.id,
        name: safeName,
        pingas: Number.isFinite(safePingas) ? Math.max(0, Math.floor(safePingas)) : 0,
      };
    })
    .sort((a, b) => {
      if (b.pingas !== a.pingas) {
        return b.pingas - a.pingas;
      }

      return a.name.localeCompare(b.name, 'pt-PT', { sensitivity: 'base' });
    });

const getRowsetHeight = (length: number) => {
  if (length <= 0) {
    return 0;
  }

  return length * ROW_STRIDE - ROW_GAP;
};

export default function Leaderboard({ displayMode = false }: LeaderboardProps = {}) {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const displayScrollDirectionRef = useRef<1 | -1>(1);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const unsubscribe = observeLeaderboardTyped((snapshot) => {
      setTeams(sanitizeTeams(snapshot));
      setIsLoaded(true);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = observeSponsors(setSponsors, { activeOnly: true }, () => {
      setSponsors([]);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  const shouldVirtualize = !displayMode && teams.length > VIRTUALIZE_THRESHOLD;

  useEffect(() => {
    if (!shouldVirtualize && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [shouldVirtualize, teams.length]);

  useEffect(() => {
    if (!shouldVirtualize) {
      return;
    }

    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const maxScrollTop = Math.max(0, getRowsetHeight(teams.length) - container.clientHeight);
    if (scrollTop > maxScrollTop) {
      container.scrollTop = maxScrollTop;
      setScrollTop(maxScrollTop);
    }
  }, [shouldVirtualize, scrollTop, teams.length]);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (!displayMode || teams.length <= DISPLAY_PINNED_ROWS) {
      return;
    }

    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      if (maxScrollTop <= 0) {
        return;
      }

      const atBottom = container.scrollTop >= maxScrollTop - 2;
      const atTop = container.scrollTop <= 2;
      if (atBottom) {
        displayScrollDirectionRef.current = -1;
      } else if (atTop) {
        displayScrollDirectionRef.current = 1;
      }

      const nextScrollTop =
        displayScrollDirectionRef.current === 1
          ? Math.min(maxScrollTop, container.scrollTop + DISPLAY_SCROLL_STEP)
          : Math.max(0, container.scrollTop - DISPLAY_SCROLL_STEP);

      container.scrollTo({ top: nextScrollTop, behavior: 'smooth' });
    }, DISPLAY_SCROLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [displayMode, teams.length]);

  const virtualState = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        startIndex: 0,
        items: teams,
        offset: 0,
        totalHeight: getRowsetHeight(teams.length),
      };
    }

    const safeScrollTop = Math.max(0, scrollTop);
    const estimateIndex = Math.floor(safeScrollTop / ROW_STRIDE);
    const startIndex = Math.max(0, estimateIndex - BUFFER);
    const endIndex = Math.min(teams.length, startIndex + MAX_RENDERED_ROWS);
    const offset = startIndex * ROW_STRIDE;

    return {
      startIndex,
      items: teams.slice(startIndex, endIndex),
      offset,
      totalHeight: getRowsetHeight(teams.length),
    };
  }, [scrollTop, shouldVirtualize, teams]);

  const maxPingas = useMemo(
    () => teams.reduce((max, team) => (team.pingas > max ? team.pingas : max), 0),
    [teams]
  );

  const totalPingas = useMemo(() => teams.reduce((total, team) => total + team.pingas, 0), [teams]);
  const displayPinnedTeams = displayMode ? teams.slice(0, DISPLAY_PINNED_ROWS) : [];
  const displayScrollableTeams = displayMode ? teams.slice(DISPLAY_PINNED_ROWS) : [];

  const leaderboardSponsors = useMemo(() => {
    const fallbackSponsors = [...sponsorLeft, ...sponsorRight].map((imageDataUrl, index) => ({
      id: `fallback-${index}`,
      name: `Patrocinador ${index + 1}`,
      imageDataUrl,
      active: true,
      order: index,
    }));

    return sponsors.length > 0 ? sponsors : fallbackSponsors;
  }, [sponsors]);

  const sponsorColumns = useMemo(() => {
    return leaderboardSponsors.reduce(
      (columns, sponsor, index) => {
        columns[index % 2 === 0 ? 0 : 1].push(sponsor);
        return columns;
      },
      [[], []] as [Sponsor[], Sponsor[]]
    );
  }, [leaderboardSponsors]);

  const tableAriaLabel = 'Classificação geral das equipas por pingas acumuladas';

  return (
    <>
      {displayMode ? null : <Header />}
      <Page
        tone="default"
        width={displayMode ? 'fluid' : 'page'}
        padding={displayMode ? 'none' : 'lg'}
        className={displayMode ? styles.displayRoot : undefined}
        innerClassName={`${styles.page} ${displayMode ? styles.displayPage : ''}`}
      >
        <div className={styles.layout}>
          <div className={`${styles.railSlot} ${styles.leftRail}`}>
            <SponsorsRail sponsors={sponsorColumns[0]} side="left" />
          </div>

          <div className={styles.content}>
            <Section padding="none" className={styles.introSection}>
              <Stack gap="sm" className={styles.introHeader}>
                <Text as="span" variant="eyebrow" tone="secondary">
                  Taça da Pinga
                </Text>
              </Stack>
            </Section>

            <Section padding="none">
              <Card variant="muted" padding="lg" className={styles.tableCard}>
                <Stack
                  direction="row"
                  justify="between"
                  align="center"
                  className={styles.tableHeaderMeta}
                >
                  <div>
                    <Text as="h2" variant="heading">
                      Classificação
                    </Text>
                  </div>
                  <div className={styles.tableBadges}>
                    <Text as="p" variant="label" tone="secondary" className={styles.tableCount}>
                      {teams.length === 1
                        ? '1 equipa em prova'
                        : `${teams.length} equipas em prova`}
                    </Text>
                    <div className={styles.totalBadge} aria-label="Total de pingas registadas">
                      <Text as="span" variant="label" tone="muted">
                        Total de Pingas
                      </Text>
                      <Text as="span" variant="heading" weight="bold" className={styles.totalValue}>
                        {numberFormatter.format(totalPingas)}
                      </Text>
                    </div>
                  </div>
                </Stack>

                {!isLoaded ? (
                  <div
                    role="status"
                    className={styles.tableSkeleton}
                    aria-label="A carregar a classificação"
                  >
                    <span className={styles.visuallyHidden}>A carregar a classificação...</span>
                    {skeletonRows.map((row) => (
                      <div key={row} className={styles.skeletonRow}>
                        <span className={styles.skeletonRank} />
                        <span className={styles.skeletonName} />
                        <span className={styles.skeletonValue} />
                      </div>
                    ))}
                  </div>
                ) : teams.length === 0 ? (
                  <div role="status" className={styles.feedback}>
                    Ainda não há equipas inscritas. Assim que surgirem pingas, aparecerão aqui.
                  </div>
                ) : (
                  <div
                    className={styles.tableSurface}
                    role="table"
                    aria-label={tableAriaLabel}
                    aria-rowcount={teams.length + 1}
                    aria-colcount={3}
                    aria-busy={!isLoaded}
                  >
                    <div
                      className={styles.scrollRegion}
                      onScroll={handleScroll}
                      ref={scrollRef}
                      role="presentation"
                    >
                      <div role="rowgroup" className={styles.headerGroup}>
                        <div role="row" className={styles.headerRow} aria-rowindex={1}>
                          <span role="columnheader" className={styles.headerCell}>
                            #
                          </span>
                          <span role="columnheader" className={styles.headerCell}>
                            Equipa
                          </span>
                          <span
                            role="columnheader"
                            className={`${styles.headerCell} ${styles.headerCellEnd}`}
                          >
                            Pingas
                          </span>
                        </div>
                      </div>

                      <div role="rowgroup" className={styles.bodyGroup}>
                        {displayMode ? (
                          <>
                            <div className={styles.displayPinnedList} role="presentation">
                              {displayPinnedTeams.map((team, index) => (
                                <LeaderboardRow
                                  key={team.id}
                                  rank={index + 1}
                                  teamName={team.name}
                                  pingas={team.pingas}
                                  maxPingas={maxPingas}
                                  ariaRowIndex={index + 2}
                                  numberFormatter={numberFormatter}
                                />
                              ))}
                            </div>
                            {displayScrollableTeams.length > 0 ? (
                              <div className={styles.fullList} role="presentation">
                                {displayScrollableTeams.map((team, index) => (
                                  <LeaderboardRow
                                    key={team.id}
                                    rank={index + DISPLAY_PINNED_ROWS + 1}
                                    teamName={team.name}
                                    pingas={team.pingas}
                                    maxPingas={maxPingas}
                                    ariaRowIndex={index + DISPLAY_PINNED_ROWS + 2}
                                    numberFormatter={numberFormatter}
                                  />
                                ))}
                              </div>
                            ) : null}
                          </>
                        ) : shouldVirtualize ? (
                          <div
                            className={styles.virtualRoot}
                            style={{ height: `${virtualState.totalHeight}px` }}
                            role="presentation"
                          >
                            <div
                              className={styles.virtualInner}
                              style={{ transform: `translateY(${virtualState.offset}px)` }}
                              role="presentation"
                            >
                              {virtualState.items.map((team, index) => (
                                <LeaderboardRow
                                  key={team.id}
                                  rank={virtualState.startIndex + index + 1}
                                  teamName={team.name}
                                  pingas={team.pingas}
                                  maxPingas={maxPingas}
                                  ariaRowIndex={virtualState.startIndex + index + 2}
                                  numberFormatter={numberFormatter}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className={styles.fullList} role="presentation">
                            {teams.map((team, index) => (
                              <LeaderboardRow
                                key={team.id}
                                rank={index + 1}
                                teamName={team.name}
                                pingas={team.pingas}
                                maxPingas={maxPingas}
                                ariaRowIndex={index + 2}
                                numberFormatter={numberFormatter}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </Section>

            <div className={styles.mobileSponsors}>
              <SponsorsRail sponsors={leaderboardSponsors} side="left" />
            </div>
          </div>

          <div className={`${styles.railSlot} ${styles.rightRail}`}>
            <SponsorsRail sponsors={sponsorColumns[1]} side="right" />
          </div>
        </div>
      </Page>
    </>
  );
}

export { MAX_RENDERED_ROWS };
