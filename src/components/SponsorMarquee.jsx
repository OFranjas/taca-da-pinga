import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import styles from './SponsorMarquee.module.css';

const AUTO_SCROLL_SPEED = 46;
const RESUME_DELAY_MS = 1400;
const LOOP_SEGMENTS = 3;

export default function SponsorMarquee({
  sponsors = [],
  rows = 1,
  compact = false,
  ariaLabel = 'Patrocinadores',
}) {
  const rowRefs = useRef([]);
  const scrollPositionsRef = useRef([]);
  const pausedUntilRef = useRef([]);
  const isInteractingRef = useRef([]);
  const isProgrammaticScrollRef = useRef([]);
  const isWrappingRef = useRef([]);
  const safeRows = Math.max(1, rows);

  const rowsData = useMemo(() => {
    const buckets = Array.from({ length: safeRows }, () => []);
    sponsors.forEach((sponsor, index) => {
      buckets[index % safeRows].push(sponsor);
    });
    return buckets.filter((bucket) => bucket.length > 0);
  }, [safeRows, sponsors]);

  const rowKeys = useMemo(
    () => rowsData.map((rowSponsors) => rowSponsors.map((sponsor) => sponsor.id).join('|')),
    [rowsData]
  );

  const getSegmentWidth = useCallback((row) => row.scrollWidth / LOOP_SEGMENTS, []);

  const wrapRow = useCallback(
    (row, rowIndex) => {
      if (!row || isWrappingRef.current[rowIndex]) {
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
        isWrappingRef.current[rowIndex] = true;
        isProgrammaticScrollRef.current[rowIndex] = true;
        row.scrollLeft = nextScrollLeft;
        scrollPositionsRef.current[rowIndex] = nextScrollLeft;
        window.requestAnimationFrame(() => {
          isWrappingRef.current[rowIndex] = false;
          isProgrammaticScrollRef.current[rowIndex] = false;
        });
      }
    },
    [getSegmentWidth]
  );

  const getRowIndex = (row) => Number(row?.dataset.rowIndex ?? -1);

  const syncRowPosition = useCallback((row, rowIndex = getRowIndex(row)) => {
    if (row && rowIndex >= 0) {
      scrollPositionsRef.current[rowIndex] = row.scrollLeft;
    }
  }, []);

  const scheduleResume = useCallback(
    (row) => {
      const rowIndex = getRowIndex(row);
      if (rowIndex >= 0) {
        syncRowPosition(row, rowIndex);
        isInteractingRef.current[rowIndex] = false;
        pausedUntilRef.current[rowIndex] = performance.now() + RESUME_DELAY_MS;
      }
    },
    [syncRowPosition]
  );

  const pauseInteraction = useCallback(
    (row) => {
      const rowIndex = getRowIndex(row);
      if (rowIndex >= 0) {
        syncRowPosition(row, rowIndex);
        isInteractingRef.current[rowIndex] = true;
        pausedUntilRef.current[rowIndex] = Number.POSITIVE_INFINITY;
      }
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
      const rowIndex = getRowIndex(row);
      if (rowIndex < 0) {
        return;
      }

      wrapRow(row, rowIndex);

      if (!isProgrammaticScrollRef.current[rowIndex]) {
        syncRowPosition(row, rowIndex);
        if (!isInteractingRef.current[rowIndex]) {
          pausedUntilRef.current[rowIndex] = performance.now() + RESUME_DELAY_MS;
        }
      }
    },
    [syncRowPosition, wrapRow]
  );

  useEffect(() => {
    rowRefs.current.forEach((row, index) => {
      if (!row) {
        return;
      }

      const segmentWidth = getSegmentWidth(row);
      const loopKey = rowKeys[index] ?? '';
      if (segmentWidth > row.clientWidth && row.dataset.loopKey !== loopKey) {
        row.scrollLeft = segmentWidth;
        scrollPositionsRef.current[index] = segmentWidth;
        pausedUntilRef.current[index] = 0;
        row.dataset.loopKey = loopKey;
      }
    });
  }, [getSegmentWidth, rowKeys, rowsData]);

  useEffect(() => {
    if (sponsors.length <= 1) {
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

        if ((pausedUntilRef.current[index] ?? 0) > timestamp) {
          return;
        }

        const currentPosition = scrollPositionsRef.current[index] ?? row.scrollLeft;
        const nextPosition = currentPosition + AUTO_SCROLL_SPEED * deltaSeconds;
        scrollPositionsRef.current[index] = nextPosition;
        isProgrammaticScrollRef.current[index] = true;
        row.scrollLeft = nextPosition;
        wrapRow(row, index);
        window.requestAnimationFrame(() => {
          isProgrammaticScrollRef.current[index] = false;
        });
      });

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [getSegmentWidth, rowsData, sponsors.length, wrapRow]);

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
            onPointerUp={(event) => scheduleResume(event.currentTarget)}
            onPointerCancel={(event) => scheduleResume(event.currentTarget)}
            onTouchStart={(event) => pauseInteraction(event.currentTarget)}
            onTouchEnd={(event) => scheduleResume(event.currentTarget)}
            onTouchCancel={(event) => scheduleResume(event.currentTarget)}
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
