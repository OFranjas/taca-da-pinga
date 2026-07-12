import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import styles from './SponsorMarquee.module.css';

const AUTO_SCROLL_SPEED = 18;
const RESUME_DELAY_MS = 1400;
const LOOP_SEGMENTS = 3;

const usesMobileTransformAnimation = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches;

export const normalizeMobileLoopPosition = (position, segmentWidth) => {
  if (!segmentWidth) return 0;

  return (
    segmentWidth + ((((position - segmentWidth) % segmentWidth) + segmentWidth) % segmentWidth)
  );
};

function SponsorRow({ sponsors, autoScroll, rowIndex }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const mobilePositionRef = useRef(0);
  const mobileDragRef = useRef(null);
  const pausedUntilRef = useRef(0);
  const isInteractingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const loopKey = useMemo(() => sponsors.map((sponsor) => sponsor.id).join('|'), [sponsors]);
  const shouldLoop = autoScroll && sponsors.length > 1;

  const getSegmentWidth = useCallback((viewport) => viewport.scrollWidth / LOOP_SEGMENTS, []);

  const normalizeMobilePosition = useCallback((position) => {
    const segmentWidth = (trackRef.current?.scrollWidth ?? 0) / LOOP_SEGMENTS;
    return normalizeMobileLoopPosition(position, segmentWidth);
  }, []);

  const applyMobilePosition = useCallback(
    (position) => {
      const normalizedPosition = normalizeMobilePosition(position);
      mobilePositionRef.current = normalizedPosition;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${-normalizedPosition}px, 0, 0)`;
      }
    },
    [normalizeMobilePosition]
  );

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
    if (!viewport || !shouldLoop || usesMobileTransformAnimation()) return undefined;

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
    if (!viewport || !shouldLoop || usesMobileTransformAnimation()) return undefined;
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

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !shouldLoop || !usesMobileTransformAnimation()) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;

    let frameId = 0;
    let lastFrame = 0;
    const step = (timestamp) => {
      if (!lastFrame) lastFrame = timestamp;
      const deltaSeconds = (timestamp - lastFrame) / 1000;
      lastFrame = timestamp;

      if (pausedUntilRef.current <= timestamp) {
        applyMobilePosition(mobilePositionRef.current + AUTO_SCROLL_SPEED * deltaSeconds);
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);
    return () => {
      window.cancelAnimationFrame(frameId);
      track.style.transform = '';
    };
  }, [applyMobilePosition, shouldLoop]);

  const handlePointerDown = (event) => {
    if (!usesMobileTransformAnimation()) {
      pauseInteraction(event.currentTarget);
      return;
    }

    event.currentTarget.setPointerCapture?.(event.pointerId);
    mobileDragRef.current = {
      pointerId: event.pointerId,
      startPosition: mobilePositionRef.current,
      startX: event.clientX,
    };
    isInteractingRef.current = true;
    pausedUntilRef.current = Number.POSITIVE_INFINITY;
    suppressClickRef.current = false;
  };

  const handlePointerMove = (event) => {
    const drag = mobileDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4) {
      suppressClickRef.current = true;
    }
    applyMobilePosition(drag.startPosition - distance);
    event.preventDefault();
  };

  const handlePointerEnd = (event) => {
    const drag = mobileDragRef.current;
    if (drag?.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      mobileDragRef.current = null;
      isInteractingRef.current = false;
      pausedUntilRef.current = performance.now() + RESUME_DELAY_MS;
      return;
    }

    scheduleResume(event.currentTarget);
  };

  const renderSponsor = (sponsor, index, segmentIndex) => {
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
          aria-hidden
        >
          {content}
        </span>
      );
    }

    if (hasLink) {
      return (
        <span key={`${sponsor.id}-${rowIndex}-${index}`} className={styles.card} role="listitem">
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
  };

  return (
    <div
      ref={viewportRef}
      className={`${styles.row} ${autoScroll ? styles.animatedRow : ''}`}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClickCapture={(event) => {
        if (suppressClickRef.current) {
          event.preventDefault();
          event.stopPropagation();
          suppressClickRef.current = false;
        }
      }}
      onWheel={(event) => scheduleResume(event.currentTarget)}
      onFocus={() => pauseInteraction(viewportRef.current)}
      onBlur={() => scheduleResume(viewportRef.current)}
      onMouseEnter={() => pauseInteraction(viewportRef.current)}
      onMouseLeave={() => scheduleResume(viewportRef.current)}
      onScroll={handleScroll}
    >
      <span ref={trackRef} className={styles.track}>
        {Array.from({ length: shouldLoop ? LOOP_SEGMENTS : 1 }, (_, segmentIndex) => (
          <span key={segmentIndex} className={styles.segment}>
            {sponsors.map((sponsor, index) => renderSponsor(sponsor, index, segmentIndex))}
          </span>
        ))}
      </span>
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
