import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import styles from './SponsorMarquee.module.css';

const AUTO_SCROLL_SPEED = 18;
const RESUME_DELAY_MS = 1400;
const LOOP_SEGMENTS = 3;

function SponsorRow({ sponsors, autoScroll, rowIndex }) {
  const viewportRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const pausedUntilRef = useRef(0);
  const isInteractingRef = useRef(false);
  const loopKey = useMemo(() => sponsors.map((sponsor) => sponsor.id).join('|'), [sponsors]);
  const shouldLoop = autoScroll && sponsors.length > 1;

  const getSegmentWidth = useCallback((viewport) => viewport.scrollWidth / LOOP_SEGMENTS, []);

  const syncPosition = useCallback((viewport) => {
    if (viewport) {
      scrollPositionRef.current = viewport.scrollLeft;
    }
  }, []);

  const wrapViewport = useCallback(
    (viewport) => {
      if (!viewport || !shouldLoop) return;

      const segmentWidth = getSegmentWidth(viewport);
      if (viewport.scrollWidth <= viewport.clientWidth) return;

      let nextScrollLeft = viewport.scrollLeft;
      if (viewport.scrollLeft >= segmentWidth * 2) nextScrollLeft -= segmentWidth;
      if (viewport.scrollLeft <= 0) nextScrollLeft += segmentWidth;

      if (nextScrollLeft !== viewport.scrollLeft) {
        viewport.scrollLeft = nextScrollLeft;
        scrollPositionRef.current = nextScrollLeft;
      }
    },
    [getSegmentWidth, shouldLoop]
  );

  const pauseInteraction = useCallback(
    (viewport) => {
      syncPosition(viewport);
      isInteractingRef.current = true;
      pausedUntilRef.current = Number.POSITIVE_INFINITY;
    },
    [syncPosition]
  );

  const scheduleResume = useCallback(
    (viewport) => {
      syncPosition(viewport);
      isInteractingRef.current = false;
      pausedUntilRef.current = performance.now() + RESUME_DELAY_MS;
    },
    [syncPosition]
  );

  const handleScroll = useCallback(
    (event) => {
      const viewport = event.currentTarget;
      wrapViewport(viewport);
      syncPosition(viewport);
    },
    [syncPosition, wrapViewport]
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !shouldLoop) return undefined;

    const positionInitialSegment = () => {
      const segmentWidth = getSegmentWidth(viewport);
      if (viewport.scrollWidth > viewport.clientWidth && viewport.dataset.loopKey !== loopKey) {
        viewport.scrollLeft = segmentWidth;
        scrollPositionRef.current = segmentWidth;
        pausedUntilRef.current = 0;
        viewport.dataset.loopKey = loopKey;
      }
    };

    const frameId = window.requestAnimationFrame(positionInitialSegment);
    return () => window.cancelAnimationFrame(frameId);
  }, [getSegmentWidth, loopKey, shouldLoop]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !shouldLoop) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frameId = 0;
    let lastFrame = 0;
    const step = (timestamp) => {
      if (!lastFrame) lastFrame = timestamp;
      const deltaSeconds = (timestamp - lastFrame) / 1000;
      lastFrame = timestamp;
      if (viewport.scrollWidth > viewport.clientWidth && pausedUntilRef.current <= timestamp) {
        const nextPosition = scrollPositionRef.current + AUTO_SCROLL_SPEED * deltaSeconds;
        scrollPositionRef.current = nextPosition;
        viewport.scrollLeft = nextPosition;
        wrapViewport(viewport);
      }
      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [getSegmentWidth, shouldLoop, wrapViewport]);

  const renderedSponsors = shouldLoop
    ? Array.from({ length: LOOP_SEGMENTS }, () => sponsors).flat()
    : sponsors;

  return (
    <div
      ref={viewportRef}
      className={`${styles.row} ${autoScroll ? styles.animatedRow : ''}`}
      tabIndex={0}
      onPointerDown={(event) => pauseInteraction(event.currentTarget)}
      onPointerUp={(event) => scheduleResume(event.currentTarget)}
      onPointerCancel={(event) => scheduleResume(event.currentTarget)}
      onTouchStart={(event) => pauseInteraction(event.currentTarget)}
      onTouchEnd={(event) => scheduleResume(event.currentTarget)}
      onTouchCancel={(event) => scheduleResume(event.currentTarget)}
      onWheel={(event) => scheduleResume(event.currentTarget)}
      onFocus={() => pauseInteraction(viewportRef.current)}
      onBlur={() => scheduleResume(viewportRef.current)}
      onMouseEnter={() => pauseInteraction(viewportRef.current)}
      onMouseLeave={() => scheduleResume(viewportRef.current)}
      onScroll={handleScroll}
    >
      {renderedSponsors.map((sponsor, index) => {
        const segmentIndex = shouldLoop ? Math.floor(index / sponsors.length) : 0;
        const isDuplicate = shouldLoop && segmentIndex !== 1;
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

        if (isDuplicate) {
          return (
            <span
              key={`${sponsor.id}-duplicate-${rowIndex}-${index}`}
              className={styles.card}
              aria-hidden="true"
            >
              {content}
            </span>
          );
        }

        if (hasLink) {
          return (
            <span
              key={`${sponsor.id}-${rowIndex}-${index}`}
              className={styles.card}
              role="listitem"
            >
              <a href={sponsor.link} target="_blank" rel="noreferrer" className={styles.cardLink}>
                {content}
              </a>
            </span>
          );
        }

        return (
          <span key={`${sponsor.id}-${rowIndex}-${index}`} className={styles.card} role="listitem">
            {content}
          </span>
        );
      })}
    </div>
  );
}

export default function SponsorMarquee({
  sponsors = [],
  rows = 1,
  compact = false,
  autoScroll = false,
  ariaLabel = 'Patrocinadores',
}) {
  const safeRows = Math.max(1, rows);
  const rowsData = useMemo(() => {
    const buckets = Array.from({ length: safeRows }, () => []);
    sponsors.forEach((sponsor, index) => buckets[index % safeRows].push(sponsor));
    return buckets.filter((bucket) => bucket.length > 0);
  }, [safeRows, sponsors]);

  if (rowsData.length === 0) return null;

  const rootClassName = compact ? `${styles.root} ${styles.compact}` : styles.root;
  return (
    <div className={rootClassName} role="list" aria-label={ariaLabel}>
      {rowsData.map((rowSponsors, rowIndex) => (
        <SponsorRow
          key={`row-${rowIndex}`}
          sponsors={rowSponsors}
          autoScroll={autoScroll}
          rowIndex={rowIndex}
        />
      ))}
    </div>
  );
}
