import React, { useMemo } from 'react';
import styles from './SponsorMarquee.module.css';

// Keep mobile/tablet sponsor strips manual-only for now. The previous JS marquee
// fought native touch scroll and snapped back after dragging on iOS.
export default function SponsorMarquee({
  sponsors = [],
  rows = 1,
  compact = false,
  ariaLabel = 'Patrocinadores',
}) {
  const safeRows = Math.max(1, rows);

  const rowsData = useMemo(() => {
    const buckets = Array.from({ length: safeRows }, () => []);
    sponsors.forEach((sponsor, index) => {
      buckets[index % safeRows].push(sponsor);
    });
    return buckets.filter((bucket) => bucket.length > 0);
  }, [safeRows, sponsors]);

  if (rowsData.length === 0) {
    return null;
  }

  const rootClassName = compact ? `${styles.root} ${styles.compact}` : styles.root;

  return (
    <div className={rootClassName} role="list" aria-label={ariaLabel}>
      {rowsData.map((rowSponsors, rowIndex) => {
        return (
          <div key={`row-${rowIndex}`} className={styles.row} tabIndex={0}>
            {rowSponsors.map((sponsor, index) => {
              const hasLink = Boolean(sponsor.link && sponsor.link.trim().length > 0);
              const content = (
                <>
                  <span className={styles.imageFrame}>
                    <img
                      src={sponsor.imageDataUrl}
                      alt={sponsor.name}
                      loading="lazy"
                      className={styles.logo}
                    />
                  </span>
                  <span className={styles.name}>{sponsor.name}</span>
                </>
              );

              if (hasLink) {
                return (
                  <a
                    key={`${sponsor.id}-${rowIndex}-${index}`}
                    href={sponsor.link}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.card}
                    role="listitem"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <span
                  key={`${sponsor.id}-${rowIndex}-${index}`}
                  className={styles.card}
                  role="listitem"
                >
                  {content}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
