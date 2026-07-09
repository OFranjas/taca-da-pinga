import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './SponsorMarquee.module.css';

const AUTO_SCROLL_SPEED = 46;
const RESUME_DELAY_MS = 3500;
const LOOP_SEGMENTS = 3;

export default function SponsorMarquee({
  sponsors = [],
  rows = 1,
  compact = false,
  ariaLabel = 'Patrocinadores',
}) {
  const [isPaused, setPaused] = useState(false);
  const rowRefs = useRef([]);
  const resumeTimeoutRef = useRef(0);
  const isWrappingRef = useRef(false);
  const safeRows = Math.max(1, rows);

  const rowsData = useMemo(() => {
    const buckets = Array.from({ length: safeRows }, () => []);
    sponsors.forEach((sponsor, index) => {
      buckets[index % safeRows].push(sponsor);
    });
    return buckets.filter((bucket) => bucket.length > 0);
  }, [safeRows, sponsors]);

  const getSegmentWidth = useCallback((row) => row.scrollWidth / LOOP_SEGMENTS, []);

  const wrapRow = useCallback(
    (row) => {
      if (!row || isWrappingRef.current) {
        return;
      }

      const segmentWidth = getSegmentWidth(row);
      if (segmentWidth <= row.clientWidth) {
        return;
      }

      let nextScrollLeft = row.scrollLeft;
      if (row.scrollLeft >= segmentWidth * 2) {
        nextScrollLeft = row.scrollLeft - segmentWidth;
      }

      if (row.scrollLeft <= 0) {
        nextScrollLeft = row.scrollLeft + segmentWidth;
      }

      if (nextScrollLeft !== row.scrollLeft) {
        isWrappingRef.current = true;
        row.scrollLeft = nextScrollLeft;
        window.requestAnimationFrame(() => {
          isWrappingRef.current = false;
        });
      }
    },
    [getSegmentWidth]
  );

  const pauseTemporarily = useCallback(() => {
    window.clearTimeout(resumeTimeoutRef.current);
    setPaused(true);
    resumeTimeoutRef.current = window.setTimeout(() => {
      setPaused(false);
    }, RESUME_DELAY_MS);
  }, []);

  useEffect(() => {
    rowRefs.current.forEach((row) => {
      if (!row || row.dataset.loopReady === 'true') {
        return;
      }

      const segmentWidth = getSegmentWidth(row);
      if (segmentWidth > row.clientWidth) {
        row.scrollLeft = segmentWidth;
        row.dataset.loopReady = 'true';
      }
    });
  }, [getSegmentWidth, rowsData]);

  useEffect(() => {
    return () => {
      window.clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

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

      rowRefs.current.forEach((row) => {
        if (!row) {
          return;
        }

        const segmentWidth = getSegmentWidth(row);
        if (segmentWidth <= row.clientWidth) {
          return;
        }

        row.scrollLeft += AUTO_SCROLL_SPEED * deltaSeconds;
        wrapRow(row);
      });

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [getSegmentWidth, isPaused, rowsData, sponsors.length, wrapRow]);

  if (rowsData.length === 0) {
    return null;
  }

  const rootClassName = compact ? `${styles.root} ${styles.compact}` : styles.root;

  return (
    <div className={rootClassName} role="list" aria-label={ariaLabel}>
      {rowsData.map((rowSponsors, rowIndex) => {
        const renderedSponsors =
          rowSponsors.length > 1
            ? Array.from({ length: LOOP_SEGMENTS }, () => rowSponsors).flat()
            : rowSponsors;

        return (
          <div
            key={`row-${rowIndex}`}
            className={styles.row}
            ref={(node) => {
              rowRefs.current[rowIndex] = node;
            }}
            onPointerDown={pauseTemporarily}
            onTouchStart={pauseTemporarily}
            onWheel={pauseTemporarily}
            onScroll={(event) => wrapRow(event.currentTarget)}
            tabIndex={0}
          >
            {renderedSponsors.map((sponsor, index) => {
              const segmentIndex = Math.floor(index / rowSponsors.length);
              const isDuplicate = rowSponsors.length > 1 && segmentIndex !== 1;
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
