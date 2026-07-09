import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './SponsorMarquee.module.css';

const AUTO_SCROLL_SPEED = 28;

export default function SponsorMarquee({
  sponsors = [],
  rows = 1,
  compact = false,
  ariaLabel = 'Patrocinadores',
}) {
  const [isPaused, setPaused] = useState(false);
  const rowRefs = useRef([]);
  const safeRows = Math.max(1, rows);

  const rowsData = useMemo(() => {
    const buckets = Array.from({ length: safeRows }, () => []);
    sponsors.forEach((sponsor, index) => {
      buckets[index % safeRows].push(sponsor);
    });
    return buckets.filter((bucket) => bucket.length > 0);
  }, [safeRows, sponsors]);

  useEffect(() => {
    if (isPaused || sponsors.length <= 1) {
      return undefined;
    }

    let frameId = 0;
    let lastFrame = 0;

    const step = (timestamp) => {
      if (!lastFrame) {
        lastFrame = timestamp;
      }
      const deltaSeconds = (timestamp - lastFrame) / 1000;
      lastFrame = timestamp;

      rowRefs.current.forEach((row, index) => {
        if (!row) {
          return;
        }

        const loopWidth = row.scrollWidth / 2;
        if (loopWidth <= row.clientWidth) {
          return;
        }

        const direction = index % 2 === 0 ? 1 : -1;
        row.scrollLeft += direction * AUTO_SCROLL_SPEED * deltaSeconds;

        if (direction === 1 && row.scrollLeft >= loopWidth) {
          row.scrollLeft -= loopWidth;
        }

        if (direction === -1 && row.scrollLeft <= 0) {
          row.scrollLeft += loopWidth;
        }
      });

      frameId = window.requestAnimationFrame(step);
    };

    rowRefs.current.forEach((row, index) => {
      if (row && index % 2 === 1 && row.scrollLeft === 0) {
        row.scrollLeft = row.scrollWidth / 2;
      }
    });

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [isPaused, sponsors.length]);

  if (rowsData.length === 0) {
    return null;
  }

  const pause = () => setPaused(true);
  const rootClassName = compact ? `${styles.root} ${styles.compact}` : styles.root;

  return (
    <div className={rootClassName} role="list" aria-label={ariaLabel}>
      {rowsData.map((rowSponsors, rowIndex) => {
        const renderedSponsors =
          rowSponsors.length > 1 ? [...rowSponsors, ...rowSponsors] : rowSponsors;

        return (
          <div
            key={`row-${rowIndex}`}
            className={styles.row}
            ref={(node) => {
              rowRefs.current[rowIndex] = node;
            }}
            onPointerDown={pause}
            onTouchStart={pause}
            onWheel={pause}
            tabIndex={0}
          >
            {renderedSponsors.map((sponsor, index) => {
              const isDuplicate = rowSponsors.length > 1 && index >= rowSponsors.length;
              const hasLink = Boolean(sponsor.link && sponsor.link.trim().length > 0);
              const content = (
                <>
                  <span className={styles.imageFrame}>
                    <img
                      src={sponsor.imageDataUrl}
                      alt={isDuplicate ? '' : sponsor.name}
                      loading="lazy"
                      className={styles.logo}
                    />
                  </span>
                  <span className={styles.name}>{sponsor.name}</span>
                </>
              );

              if (hasLink && !isDuplicate) {
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
                  role={isDuplicate ? undefined : 'listitem'}
                  aria-hidden={isDuplicate ? 'true' : undefined}
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
