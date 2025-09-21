import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import Header from '../components/Header';
import SponsorsRail from '../components/SponsorsRail';
import { observeLeaderboard } from '../services/leaderboard';
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

const numberFormatter = new Intl.NumberFormat('pt-BR');

const sponsorLeft = [s1, s3, s5, s7, s10, s11];
const sponsorRight = [s2, s4, s6, s8, s9, s12];

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

const sanitizeTeams = (incoming: ServiceTeam[]): LeaderboardTeam[] =>
  incoming
    .map((team) => {
      const safeName =
        typeof team.name === 'string' && team.name.trim().length > 0
          ? team.name.trim()
          : 'Equipe sem nome';
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

      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    });

const getRowsetHeight = (length: number) => {
  if (length <= 0) {
    return 0;
  }

  return length * ROW_STRIDE - ROW_GAP;
};

export default function Leaderboard() {
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
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

  const shouldVirtualize = teams.length > VIRTUALIZE_THRESHOLD;

  useEffect(() => {
    if (!shouldVirtualize) {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
      setScrollTop(0);
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

  const topTeam = teams[0];
  const secondaryTeam = teams[1];

  const tableAriaLabel = 'Classificação geral das equipes por pingas acumuladas';

  return (
    <>
      <Header />
      <Page tone="default" width="page" padding="lg" innerClassName={styles.page}>
        <div className={styles.layout}>
          <div className={`${styles.railSlot} ${styles.leftRail}`}>
            <SponsorsRail images={sponsorLeft} side="left" />
          </div>

          <div className={styles.content}>
            <Section padding="none">
              <Card variant="highlight" padding="xl" className={styles.heroCard}>
                <Stack gap="sm">
                  <Text as="span" variant="eyebrow" tone="secondary">
                    Taça da Pinga · Painel ao vivo
                  </Text>
                  <Text as="h1" variant="hero">
                    Leaderboard atualizado
                  </Text>
                  <Text as="p" variant="subtitle" tone="muted">
                    Acompanhe a disputa em tempo real e veja quem está abrindo vantagem nas pingas.
                  </Text>
                </Stack>

                <div className={styles.heroStats}>
                  <div className={styles.heroStatCard}>
                    <Text as="span" variant="label" tone="secondary">
                      Equipe líder
                    </Text>
                    <Text as="p" variant="heading" weight="bold" className={styles.heroTeamName}>
                      {topTeam ? topTeam.name : 'Ainda sem equipes'}
                    </Text>
                    <Text as="p" variant="body" tone="secondary">
                      {topTeam
                        ? `${numberFormatter.format(topTeam.pingas)} pingas`
                        : 'Aguardando primeiras pontuações'}
                    </Text>
                  </div>

                  <div className={styles.heroStatCard}>
                    <Text as="span" variant="label" tone="secondary">
                      Vice-liderança
                    </Text>
                    <Text as="p" variant="heading" weight="bold" className={styles.heroTeamName}>
                      {secondaryTeam ? secondaryTeam.name : 'Em disputa'}
                    </Text>
                    <Text as="p" variant="body" tone="secondary">
                      {secondaryTeam
                        ? `${numberFormatter.format(secondaryTeam.pingas)} pingas`
                        : 'Atualiza em tempo real'}
                    </Text>
                  </div>

                  <div className={styles.heroStatCard}>
                    <Text as="span" variant="label" tone="secondary">
                      Pingas totais registradas
                    </Text>
                    <Text as="p" variant="heading" weight="bold" className={styles.heroTeamName}>
                      {numberFormatter.format(totalPingas)}
                    </Text>
                    <Text as="p" variant="body" tone="secondary">
                      Soma de todas as equipes em disputa
                    </Text>
                  </div>
                </div>
              </Card>
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
                      Ranking das equipes
                    </Text>
                    <Text as="p" variant="body" tone="secondary">
                      Atualiza automaticamente conforme novos registros entram.
                    </Text>
                  </div>
                  <Text as="p" variant="label" tone="secondary" className={styles.tableCount}>
                    {teams.length === 1
                      ? '1 equipe participando'
                      : `${teams.length} equipes participando`}
                  </Text>
                </Stack>

                {!isLoaded ? (
                  <div role="status" className={styles.feedback}>
                    Carregando leaderboard…
                  </div>
                ) : teams.length === 0 ? (
                  <div role="status" className={styles.feedback}>
                    Nenhuma equipe cadastrada ainda. Assim que uma equipe ganhar pingas, ela aparece
                    aqui.
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
                            Equipe
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
                        {shouldVirtualize ? (
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
          </div>

          <div className={`${styles.railSlot} ${styles.rightRail}`}>
            <SponsorsRail images={sponsorRight} side="right" />
          </div>
        </div>
      </Page>
    </>
  );
}

export { MAX_RENDERED_ROWS };
