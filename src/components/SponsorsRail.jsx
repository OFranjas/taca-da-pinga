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
  const shouldLoop = items.length > 3;
  const stackClassName = shouldLoop ? `${styles.stack} ${styles.stackAnimated}` : styles.stack;

  const renderItem = (item, i, isDuplicate = false) => (
    <div
      key={`${isDuplicate ? 'duplicate' : 'item'}-${item.alt}-${i}`}
      className={`${styles.slot} ${isDuplicate ? styles.duplicateSlot : ''}`}
      aria-hidden={isDuplicate ? 'true' : undefined}
    >
      <div className={styles.imageFrame}>
        <img className={styles.logo} src={item.src} alt={isDuplicate ? '' : item.alt} />
      </div>
      <span className={styles.name}>{item.alt}</span>
    </div>
  );

  return (
    <aside className={`${styles.rail} ${side === 'right' ? styles.right : styles.left}`}>
      <div className={styles.viewport}>
        <div className={stackClassName}>
          {items.map((item, i) => renderItem(item, i))}
          {shouldLoop ? items.map((item, i) => renderItem(item, i, true)) : null}
        </div>
      </div>
    </aside>
  );
}
