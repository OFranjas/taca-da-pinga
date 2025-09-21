import type { CSSProperties } from 'react';
import styles from './LeaderboardRow.module.css';

const fallbackFormatter = new Intl.NumberFormat('pt-BR');

type LeaderboardRowTone = {
  accent: string;
  badgeBg: string;
  badgeColor: string;
  meterStart: string;
  meterEnd: string;
  scoreColor: string;
};

type LeaderboardRowProps = {
  rank: number;
  teamName: string;
  pingas: number;
  maxPingas: number;
  ariaRowIndex: number;
  numberFormatter?: Intl.NumberFormat;
};

const getTone = (rank: number): LeaderboardRowTone => {
  switch (rank) {
    case 1:
      return {
        accent: 'rgba(250, 204, 21, 0.32)',
        badgeBg: 'rgba(250, 204, 21, 0.38)',
        badgeColor: '#854d0e',
        meterStart: '#facc15',
        meterEnd: '#f59e0b',
        scoreColor: '#92400e',
      };
    case 2:
      return {
        accent: 'rgba(148, 163, 184, 0.28)',
        badgeBg: 'rgba(226, 232, 240, 0.6)',
        badgeColor: '#1f2937',
        meterStart: '#cbd5f5',
        meterEnd: '#94a3b8',
        scoreColor: '#1e293b',
      };
    case 3:
      return {
        accent: 'rgba(249, 115, 22, 0.25)',
        badgeBg: 'rgba(253, 186, 116, 0.5)',
        badgeColor: '#7c2d12',
        meterStart: '#fb923c',
        meterEnd: '#f97316',
        scoreColor: '#b45309',
      };
    default:
      return {
        accent: 'rgba(34, 197, 94, 0.2)',
        badgeBg: 'rgba(16, 185, 129, 0.18)',
        badgeColor: '#065f46',
        meterStart: '#22c55e',
        meterEnd: '#0f766e',
        scoreColor: '#0f172a',
      };
  }
};

const clampPercentage = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  if (value >= 100) {
    return 100;
  }

  return Math.max(0, value);
};

export function LeaderboardRow({
  rank,
  teamName,
  pingas,
  maxPingas,
  ariaRowIndex,
  numberFormatter,
}: LeaderboardRowProps) {
  const formatter = numberFormatter ?? fallbackFormatter;
  const safePingas = Number.isFinite(pingas) ? Math.max(0, Math.floor(pingas)) : 0;
  const safeMax = Math.max(maxPingas, safePingas, 0);
  const fillPercent = safeMax > 0 ? clampPercentage((safePingas / safeMax) * 100) : 0;
  const tone = getTone(rank);

  const style = {
    '--row-fill-width': `${fillPercent}%`,
    '--row-accent': tone.accent,
    '--row-rank-bg': tone.badgeBg,
    '--row-rank-color': tone.badgeColor,
    '--row-meter-fill-start': tone.meterStart,
    '--row-meter-fill-end': tone.meterEnd,
    '--row-score-color': tone.scoreColor,
  } as CSSProperties;

  const scoreText = formatter.format(safePingas);
  const ariaValueMax = safeMax === 0 ? 0 : safeMax;

  return (
    <div
      role="row"
      aria-rowindex={ariaRowIndex}
      className={styles.root}
      data-testid="leaderboard-row"
      style={style}
    >
      <div role="cell" className={styles.rankCell}>
        <span className={styles.rankBadge} aria-label={`Posição ${rank}`}>
          {rank}
        </span>
      </div>
      <div role="cell" className={styles.teamCell}>
        <span className={styles.teamName} title={teamName}>
          {teamName}
        </span>
        <div
          className={styles.meter}
          role="meter"
          aria-valuemin={0}
          aria-valuenow={safePingas}
          aria-valuemax={ariaValueMax}
          aria-valuetext={`${teamName} possui ${scoreText} pingas`}
        >
          <div className={styles.meterFill} style={{ width: `${fillPercent}%` }} aria-hidden />
        </div>
      </div>
      <div role="cell" className={styles.scoreCell}>
        <span className={styles.scoreValue}>{scoreText}</span>
        <span className={styles.scoreLabel}>pingas</span>
      </div>
    </div>
  );
}
