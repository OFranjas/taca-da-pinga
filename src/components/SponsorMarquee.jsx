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
  const scrollPositionsRef = useRef([]);
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
        const rowIndex = Number(row.dataset.rowIndex ?? -1);
        if (rowIndex >= 0) {
          scrollPositionsRef.current[rowIndex] = nextScrollLeft;
        }
        window.requestAnimationFrame(() => {
          isWrappingRef.current = false;
        });
      }
    },
    [getSegmentWidth]
  );

  const syncRowPosition = useCallback((row) => {
    if (row) {
      const rowIndex = Number(row.dataset.rowIndex ?? -1);
      if (rowIndex >= 0) {
        scrollPositionsRef.current[rowIndex] = row.scrollLeft;
      }
    }
  }, []);

  const scheduleResume = useCallback(() => {
    window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      setPaused(false);
    }, RESUME_DELAY_MS);
  }, []);

  const pauseInteraction = useCallback(
    (row) => {
      syncRowPosition(row);
      window.clearTimeout(resumeTimeoutRef.current);
      setPaused(true);
    },
    [syncRowPosition]
  );

  const pauseTemporarily = useCallback(
    (row) => {
      pauseInteraction(row);
      scheduleResume();
    },
    [pauseInteraction, scheduleResume]
  );

  const handleRowScroll = useCallback(
    (row) => {
      wrapRow(row);
      if (isPaused) {
        syncRowPosition(row);
      }
    },
    [isPaused, syncRowPosition, wrapRow]
  );

  useEffect(() => {
    rowRefs.current.forEach((row, index) => {
      if (!row || row.dataset.loopReady === 'true') {
        return;
      }

      const segmentWidth = getSegmentWidth(row);
      if (segmentWidth > row.clientWidth) {
        row.scrollLeft = segmentWidth;
        scrollPositionsRef.current[index] = segmentWidth;
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

      rowRefs.current.forEach((row, index) => {
        if (!row) {
          return;
        }

        const segmentWidth = getSegmentWidth(row);
        if (segmentWidth <= row.clientWidth) {
          return;
        }

        const currentPosition = scrollPositionsRef.current[index] ?? row.scrollLeft;
        const nextPosition = currentPosition + AUTO_SCROLL_SPEED * deltaSeconds;
        scrollPositionsRef.current[index] = nextPosition;
        row.scrollLeft = nextPosition;
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
            data-row-index={rowIndex}
            onPointerDown={(event) => pauseInteraction(event.currentTarget)}
            onPointerUp={scheduleResume}
            onPointerCancel={scheduleResume}
            onTouchStart={(event) => pauseInteraction(event.currentTarget)}
            onTouchEnd={scheduleResume}
            onTouchCancel={scheduleResume}
            onWheel={(event) => pauseTemporarily(event.currentTarget)}
            onScroll={(event) => handleRowScroll(event.currentTarget)}
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
