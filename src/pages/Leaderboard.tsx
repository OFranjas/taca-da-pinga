import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import Header from '../components/Header';
import SponsorMarquee from '../components/SponsorMarquee';
import SponsorsRail from '../components/SponsorsRail';
import { observeLeaderboard } from '../services/leaderboard';
import { observeSponsors, type Sponsor } from '../services/sponsors.service';
import { Card, Page, Section, Stack, Text } from '../ui';
import styles from './Leaderboard.module.css';

import { LeaderboardRow, type GapRailPosition } from '../components/LeaderboardRow';

const DEFAULT_ROW_METRICS = { height: 80, gap: 12 };
const LAPTOP_ROW_METRICS = { height: 44, gap: 2 };
const VIRTUALIZE_THRESHOLD = 50;
const VISIBLE_WINDOW = 18;
const BUFFER = 6;
const MAX_RENDERED_ROWS = VISIBLE_WINDOW + BUFFER * 2;
const DISPLAY_PINNED_ROWS = 5;
const DISPLAY_SCROLL_PX_PER_SECOND = 30;
const DISPLAY_SCROLL_PAUSE_MS = 2200;

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

type LeaderboardTeamWithGap = LeaderboardTeam & {
  gapToPrevious?: number;
  gapRailPosition?: GapRailPosition;
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

export const splitSponsorsBalanced = (sponsors: Sponsor[]): [Sponsor[], Sponsor[]] =>
  sponsors.reduce(
    (columns, sponsor, index) => {
      columns[index % 2].push(sponsor);
      return columns;
    },
    [[], []] as [Sponsor[], Sponsor[]]
  );

function SponsorLoadingPlaceholder({ compact = false }: { compact?: boolean }) {
  const className = compact
    ? `${styles.sponsorLoading} ${styles.sponsorLoadingCompact}`
    : styles.sponsorLoading;

  return (
    <div className={className} role="status" aria-label="A carregar patrocinadores">
      <span className={styles.visuallyHidden}>A carregar patrocinadores...</span>
      {Array.from({ length: compact ? 3 : 4 }, (_, index) => (
        <span key={index} className={styles.sponsorLoadingCard} aria-hidden="true" />
      ))}
    </div>
  );
}

export const getVirtualRowMetrics = (isLaptopViewport: boolean) =>
  isLaptopViewport ? LAPTOP_ROW_METRICS : DEFAULT_ROW_METRICS;

export const getRowsetHeight = (length: number, rowHeight: number, rowGap: number) => {
  if (length <= 0) {
    return 0;
  }

  return length * (rowHeight + rowGap) - rowGap;
};

export default function Leaderboard({ displayMode = false }: LeaderboardProps = {}) {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorStatus, setSponsorStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [isLaptopViewport, setIsLaptopViewport] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const displayScrollListRef = useRef<HTMLDivElement | null>(null);
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
    const mediaQuery = window.matchMedia?.('(min-width: 75rem) and (max-width: 89.9375rem)');
    if (!mediaQuery) {
      return;
    }

    const handleViewportChange = () => {
      setIsLaptopViewport(mediaQuery.matches);
    };

    handleViewportChange();
    mediaQuery.addEventListener?.('change', handleViewportChange);

    return () => {
      mediaQuery.removeEventListener?.('change', handleViewportChange);
    };
  }, []);

  const rowMetrics = getVirtualRowMetrics(isLaptopViewport);
  const rowStride = rowMetrics.height + rowMetrics.gap;

  useEffect(() => {
    const unsubscribe = observeSponsors(
      (nextSponsors) => {
        setSponsors(nextSponsors);
        setSponsorStatus('loaded');
      },
      { activeOnly: true },
      () => {
        setSponsorStatus('error');
      }
    );

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(max-width: 40rem)');
    if (!mediaQuery) {
      return;
    }

    const handleViewportChange = () => {
      setIsCompactViewport(mediaQuery.matches);
    };

    handleViewportChange();
    mediaQuery.addEventListener?.('change', handleViewportChange);

    return () => {
      mediaQuery.removeEventListener?.('change', handleViewportChange);
    };
  }, []);

  const shouldVirtualize =
    !displayMode && !isCompactViewport && teams.length > VIRTUALIZE_THRESHOLD;

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

    const maxScrollTop = Math.max(
      0,
      getRowsetHeight(teams.length, rowMetrics.height, rowMetrics.gap) - container.clientHeight
    );
    if (scrollTop > maxScrollTop) {
      container.scrollTop = maxScrollTop;
      setScrollTop(maxScrollTop);
    }
  }, [rowMetrics.gap, rowMetrics.height, shouldVirtualize, scrollTop, teams.length]);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (!displayMode || teams.length <= DISPLAY_PINNED_ROWS) {
      return;
    }

    const container = scrollRef.current;
    const list = displayScrollListRef.current;
    if (!container || !list) {
      return;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if (reduceMotion || typeof list.animate !== 'function') {
      return;
    }

    let pauseTimeoutId = 0;
    let direction: 1 | -1 = 1;
    let currentOffset = 0;
    let activeAnimation: Animation | null = null;

    const getMaxScrollTop = () => Math.max(0, container.scrollHeight - container.clientHeight);
    const applyOffset = (offset: number) => {
      list.style.transform = `translate3d(0, -${offset}px, 0)`;
    };

    const animateTo = (targetOffset: number) => {
      activeAnimation?.cancel();
      const startOffset = currentOffset;
      const distance = Math.abs(targetOffset - startOffset);
      const duration = Math.max(2600, (distance / DISPLAY_SCROLL_PX_PER_SECOND) * 1000);

      const animation = list.animate(
        [
          { transform: `translate3d(0, -${startOffset}px, 0)` },
          { transform: `translate3d(0, -${targetOffset}px, 0)` },
        ],
        { duration, easing: 'linear', fill: 'forwards' }
      );
      activeAnimation = animation;

      animation.onfinish = () => {
        if (activeAnimation !== animation) {
          return;
        }

        currentOffset = targetOffset;
        applyOffset(currentOffset);
        animation.cancel();
        activeAnimation = null;
        direction = direction === 1 ? -1 : 1;
        pauseTimeoutId = window.setTimeout(scheduleNextScroll, DISPLAY_SCROLL_PAUSE_MS);
      };
    };

    const scheduleNextScroll = () => {
      const maxScrollTop = getMaxScrollTop();
      if (maxScrollTop <= 0) {
        pauseTimeoutId = window.setTimeout(scheduleNextScroll, DISPLAY_SCROLL_PAUSE_MS);
        return;
      }

      animateTo(direction === 1 ? maxScrollTop : 0);
    };

    applyOffset(0);
    pauseTimeoutId = window.setTimeout(scheduleNextScroll, DISPLAY_SCROLL_PAUSE_MS);

    return () => {
      activeAnimation?.cancel();
      window.clearTimeout(pauseTimeoutId);
      list.style.transform = '';
    };
  }, [displayMode, teams.length]);

  const teamsWithGaps = useMemo<LeaderboardTeamWithGap[]>(() => {
    const railTeamCount = Math.min(teams.length, DISPLAY_PINNED_ROWS);

    return teams.map((team, index) => {
      const isGapVisible = index > 0 && index < DISPLAY_PINNED_ROWS;
      const gapToPrevious = isGapVisible
        ? Math.max(0, teams[index - 1].pingas - team.pingas)
        : undefined;

      let gapRailPosition: GapRailPosition | undefined;
      if (index < railTeamCount) {
        gapRailPosition = index === 0 ? 'start' : index === railTeamCount - 1 ? 'end' : 'middle';
      }

      return {
        ...team,
        gapToPrevious,
        gapRailPosition,
      };
    });
  }, [teams]);

  const virtualState = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        startIndex: 0,
        items: teamsWithGaps,
        offset: 0,
        totalHeight: getRowsetHeight(teamsWithGaps.length, rowMetrics.height, rowMetrics.gap),
      };
    }

    const safeScrollTop = Math.max(0, scrollTop);
    const estimateIndex = Math.floor(safeScrollTop / rowStride);
    const startIndex = Math.max(0, estimateIndex - BUFFER);
    const endIndex = Math.min(teamsWithGaps.length, startIndex + MAX_RENDERED_ROWS);
    const offset = startIndex * rowStride;

    return {
      startIndex,
      items: teamsWithGaps.slice(startIndex, endIndex),
      offset,
      totalHeight: getRowsetHeight(teamsWithGaps.length, rowMetrics.height, rowMetrics.gap),
    };
  }, [rowMetrics.gap, rowMetrics.height, rowStride, scrollTop, shouldVirtualize, teamsWithGaps]);

  const maxPingas = useMemo(
    () => teamsWithGaps.reduce((max, team) => (team.pingas > max ? team.pingas : max), 0),
    [teamsWithGaps]
  );

  const displayPinnedTeams = displayMode ? teamsWithGaps.slice(0, DISPLAY_PINNED_ROWS) : [];
  const displayScrollableTeams = displayMode ? teamsWithGaps.slice(DISPLAY_PINNED_ROWS) : [];

  const leaderboardSponsors = useMemo(
    () => (sponsorStatus === 'loaded' ? sponsors : []),
    [sponsorStatus, sponsors]
  );
  const isSponsorsLoading = sponsorStatus === 'loading';

  const sponsorColumns = useMemo(
    () => splitSponsorsBalanced(leaderboardSponsors),
    [leaderboardSponsors]
  );
  const canAnimateSponsorRails = sponsorColumns.every((column) => column.length > 1);
  const largestSponsorRail = Math.max(sponsorColumns[0].length, sponsorColumns[1].length);
  const sponsorLoopItemTarget =
    canAnimateSponsorRails && largestSponsorRail === 3 ? 4 : largestSponsorRail || undefined;

  const tableAriaLabel = 'Classificação geral das equipas por pingas em escala relativa';

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
            {isSponsorsLoading ? (
              <SponsorLoadingPlaceholder />
            ) : (
              <SponsorsRail
                sponsors={sponsorColumns[0]}
                side="left"
                loopItemTarget={sponsorLoopItemTarget}
                autoScroll={canAnimateSponsorRails}
              />
            )}
          </div>

          <div className={styles.content}>
            {!displayMode ? (
              <div className={`${styles.mobileSponsors} ${styles.mobileSponsorsTop}`}>
                {isSponsorsLoading ? (
                  <SponsorLoadingPlaceholder compact />
                ) : (
                  <SponsorMarquee
                    sponsors={leaderboardSponsors}
                    compact
                    autoScroll
                    ariaLabel="Patrocinadores em destaque"
                  />
                )}
              </div>
            ) : null}

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
                    aria-rowcount={teamsWithGaps.length + 1}
                    aria-colcount={3}
                    aria-busy={!isLoaded}
                  >
                    <div
                      className={styles.scrollRegion}
                      onScroll={handleScroll}
                      ref={scrollRef}
                      tabIndex={0}
                      aria-label="Tabela de classificação; use as setas para navegar"
                    >
                      <div role="rowgroup" className={styles.headerGroup}>
                        <div role="row" className={styles.headerRow} aria-rowindex={1}>
                          <span role="columnheader" className={styles.headerCell}>
                            #
                          </span>
                          <span role="columnheader" className={styles.headerCell}>
                            Equipa
                          </span>
                          <span role="columnheader" className={styles.headerCell}>
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
                                  gapToPrevious={team.gapToPrevious}
                                  gapRailPosition={team.gapRailPosition}
                                  ariaRowIndex={index + 2}
                                />
                              ))}
                            </div>
                            {displayScrollableTeams.length > 0 ? (
                              <div
                                ref={displayScrollListRef}
                                className={styles.fullList}
                                role="presentation"
                              >
                                {displayScrollableTeams.map((team, index) => (
                                  <LeaderboardRow
                                    key={team.id}
                                    rank={index + DISPLAY_PINNED_ROWS + 1}
                                    teamName={team.name}
                                    pingas={team.pingas}
                                    maxPingas={maxPingas}
                                    gapToPrevious={team.gapToPrevious}
                                    gapRailPosition={team.gapRailPosition}
                                    ariaRowIndex={index + DISPLAY_PINNED_ROWS + 2}
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
                                  gapToPrevious={team.gapToPrevious}
                                  gapRailPosition={team.gapRailPosition}
                                  ariaRowIndex={virtualState.startIndex + index + 2}
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className={styles.fullList} role="presentation">
                            {teamsWithGaps.map((team, index) => (
                              <LeaderboardRow
                                key={team.id}
                                rank={index + 1}
                                teamName={team.name}
                                pingas={team.pingas}
                                maxPingas={maxPingas}
                                gapToPrevious={team.gapToPrevious}
                                gapRailPosition={team.gapRailPosition}
                                ariaRowIndex={index + 2}
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
          </div>

          <div className={`${styles.railSlot} ${styles.rightRail}`}>
            {isSponsorsLoading ? (
              <SponsorLoadingPlaceholder />
            ) : (
              <SponsorsRail
                sponsors={sponsorColumns[1]}
                side="right"
                loopItemTarget={sponsorLoopItemTarget}
                autoScroll={canAnimateSponsorRails}
              />
            )}
          </div>
        </div>
      </Page>
    </>
  );
}

export { MAX_RENDERED_ROWS };
