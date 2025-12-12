import React from 'react';
import styles from './SponsorsRail.module.css';
/**
 * @param {{ images?: string[]; side?: 'left' | 'right' }} props
 */
export default function SponsorsRail({ images = [], side = 'left' }) {
  if (!images?.length) return null;
  return (
    <aside className={`${styles.rail} ${side === 'right' ? styles.right : styles.left}`}>
      <div className={styles.stack}>
        {images.map((src, i) => (
          <div key={i} className={styles.slot}>
            <img className={styles.logo} src={src} alt={`Sponsor ${i + 1}`} />
          </div>
        ))}
      </div>
    </aside>
  );
}
