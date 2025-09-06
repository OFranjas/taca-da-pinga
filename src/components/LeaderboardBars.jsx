import React, { useEffect, useMemo, useRef } from 'react';
import styles from '../pages/Leaderboard.module.css';

// Medal colors + greens for 4th/5th
const BAR_COLORS = [
  '#F2C94C', // 1 - gold
  '#C0C0C0', // 2 - silver
  '#CD7F32', // 3 - bronze
  '#34A853', // 4 - green
  '#2E7D32', // 5 - dark green
];
// Darker neutral for remaining teams
const REST_COLOR = '#9CA3AF';

// Scaling: baseline keeps tiny bars visible, gamma (<1) emphasizes small values
const BASELINE_PCT = 5;
const GAMMA = 0.65;

const medalClass = (i) => {
  if (i === 0) return styles.rankGold;
  if (i === 1) return styles.rankSilver;
  if (i === 2) return styles.rankBronze;
  return '';
};

function widthPctFor(value, max) {
  if (!max || value <= 0) return 0;
  const ratio = value / max;
  const scaled = Math.pow(ratio, GAMMA);
  return BASELINE_PCT + scaled * (100 - BASELINE_PCT);
}

export default function LeaderboardBars({ teams }) {
  const max = useMemo(() => Math.max(1, ...teams.map((t) => Number(t.pingas) || 0)), [teams]);

  const barRefs = useRef([]);

  useEffect(() => {
    barRefs.current.forEach((el, i) => {
      if (!el) return;
      const value = Number(teams[i]?.pingas) || 0;
      el.style.width = widthPctFor(value, max) + '%';
    });
  }, [teams, max]);

  return (
    <div className={styles.list}>
      {teams.map((t, i) => {
        const value = Number(t.pingas) || 0;
        const pct = widthPctFor(value, max);
        const color = i < 5 ? BAR_COLORS[i] : REST_COLOR;
        return (
          <div key={t.id} className={styles.row}>
            <div className={`${styles.rank} ${medalClass(i)}`}>{i + 1}</div>

            <div className={styles.card}>
              <div className={styles.rowHeader}>
                <div className={styles.teamName} title={t.name}>
                  {t.name}
                </div>
              </div>

              <div className={styles.barTrack} aria-hidden>
                <div
                  className={styles.bar}
                  ref={(el) => (barRefs.current[i] = el)}
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
