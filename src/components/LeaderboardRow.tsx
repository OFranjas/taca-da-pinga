import type { CSSProperties } from 'react';
import styles from './LeaderboardRow.module.css';

type LeaderboardRowTone = {
  accent: string;
  badgeBg: string;
  badgeColor: string;
  meterStart: string;
  meterEnd: string;
  meterShadow: string;
};

type LeaderboardRowProps = {
  rank: number;
  teamName: string;
  pingas: number;
  maxPingas: number;
  ariaRowIndex: number;
};

const getTone = (rank: number): LeaderboardRowTone => {
  switch (rank) {
    case 1:
      return {
        accent: 'rgba(250, 204, 21, 0.32)',
        badgeBg: 'rgba(250, 204, 21, 0.38)',
        badgeColor: '#854d0e',
        meterStart: '#d97706',
        meterEnd: '#facc15',
        meterShadow: 'rgba(180, 83, 9, 0.28)',
      };
    case 2:
      return {
        accent: 'rgba(148, 163, 184, 0.28)',
        badgeBg: 'rgba(226, 232, 240, 0.6)',
        badgeColor: '#1f2937',
        meterStart: '#64748b',
        meterEnd: '#cbd5e1',
        meterShadow: 'rgba(71, 85, 105, 0.24)',
      };
    case 3:
      return {
        accent: 'rgba(249, 115, 22, 0.25)',
        badgeBg: 'rgba(253, 186, 116, 0.5)',
        badgeColor: '#7c2d12',
        meterStart: '#c2410c',
        meterEnd: '#fb923c',
        meterShadow: 'rgba(154, 52, 18, 0.26)',
      };
    default:
      return {
        accent: 'rgba(34, 197, 94, 0.2)',
        badgeBg: 'rgba(16, 185, 129, 0.18)',
        badgeColor: '#065f46',
        meterStart: '#047857',
        meterEnd: '#22c55e',
        meterShadow: 'rgba(4, 120, 87, 0.28)',
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

  return value;
};

export function LeaderboardRow({
  rank,
  teamName,
  pingas,
  maxPingas,
  ariaRowIndex,
}: LeaderboardRowProps) {
  const safePingas = Number.isFinite(pingas) ? Math.max(0, Math.floor(pingas)) : 0;
  const safeMax = Number.isFinite(maxPingas) ? Math.max(0, Math.floor(maxPingas)) : 0;
  const fillPercent = safeMax > 0 ? clampPercentage((safePingas / safeMax) * 100) : 0;
  const roundedFillPercent = Math.round(fillPercent);
  const tone = getTone(rank);

  const style = {
    '--row-fill-width': `${fillPercent}%`,
    '--row-accent': tone.accent,
    '--row-rank-bg': tone.badgeBg,
    '--row-rank-color': tone.badgeColor,
    '--row-meter-start': tone.meterStart,
    '--row-meter-end': tone.meterEnd,
    '--row-meter-shadow': tone.meterShadow,
  } as CSSProperties;

  const ariaValueText =
    safeMax === 0
      ? `${teamName} ainda não tem valor registado`
      : roundedFillPercent === 100
        ? `${teamName} está no valor de referência`
        : `${teamName} está a ${roundedFillPercent}% do valor da equipa líder`;

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
      </div>
      <div role="cell" className={styles.meterCell}>
        <div
          className={styles.meter}
          role="meter"
          aria-valuemin={0}
          aria-valuenow={roundedFillPercent}
          aria-valuemax={100}
          aria-valuetext={ariaValueText}
        >
          <div className={styles.meterFill} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
