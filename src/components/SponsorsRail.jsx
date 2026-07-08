import React from 'react';
import styles from './SponsorsRail.module.css';
/**
 * @param {{ images?: string[]; sponsors?: Array<{ imageDataUrl: string, name?: string }>; side?: 'left' | 'right' }} props
 */
export default function SponsorsRail({ images = [], sponsors = [], side = 'left' }) {
  const items = sponsors.length
    ? sponsors.map((sponsor, index) => ({
        src: sponsor.imageDataUrl,
        alt: sponsor.name || `Patrocinador ${index + 1}`,
      }))
    : images.map((src, index) => ({ src, alt: `Patrocinador ${index + 1}` }));

  if (!items.length) return null;
  return (
    <aside className={`${styles.rail} ${side === 'right' ? styles.right : styles.left}`}>
      <div className={styles.stack}>
        {items.map((item, i) => (
          <div key={`${item.alt}-${i}`} className={styles.slot}>
            <div className={styles.imageFrame}>
              <img className={styles.logo} src={item.src} alt={item.alt} />
            </div>
            <span className={styles.name}>{item.alt}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
