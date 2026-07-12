import React from 'react';
import styles from './SponsorsRail.module.css';

const AUTO_SCROLL_SPEED = 22;
const RESUME_DELAY_MS = 1400;
const LOOP_SEGMENTS = 3;

/**
 * @param {{ images?: string[]; sponsors?: Array<{ imageDataUrl: string, name?: string }>; side?: 'left' | 'right' }} props
 */
export default function SponsorsRail({ images = [], sponsors = [], side = 'left' }) {
  const viewportRef = React.useRef(null);
  const scrollPositionRef = React.useRef(0);
  const pausedUntilRef = React.useRef(0);
  const isInteractingRef = React.useRef(false);
  const isProgrammaticScrollRef = React.useRef(false);
  const isWrappingRef = React.useRef(false);

  const items = React.useMemo(
    () =>
      sponsors.length
        ? sponsors.map((sponsor, index) => ({
            src: sponsor.imageDataUrl,
            alt: sponsor.name || `Patrocinador ${index + 1}`,
          }))
        : images.map((src, index) => ({ src, alt: `Patrocinador ${index + 1}` })),
    [images, sponsors]
  );

  const shouldLoop = items.length > 3;
  const itemKey = React.useMemo(() => items.map((item) => item.src).join('|'), [items]);

  const getSegmentHeight = React.useCallback(
    (viewport) => viewport.scrollHeight / LOOP_SEGMENTS,
    []
  );

  const syncPosition = React.useCallback((viewport) => {
    if (viewport) {
      scrollPositionRef.current = viewport.scrollTop;
    }
  }, []);

  const wrapViewport = React.useCallback(
    (viewport) => {
      if (!viewport || !shouldLoop || isWrappingRef.current) {
        return;
      }

      const segmentHeight = getSegmentHeight(viewport);
      if (segmentHeight <= viewport.clientHeight) {
        return;
      }

      let nextScrollTop = viewport.scrollTop;
      if (viewport.scrollTop >= segmentHeight * 2) {
        nextScrollTop = viewport.scrollTop - segmentHeight;
      }

      if (viewport.scrollTop <= 0) {
        nextScrollTop = viewport.scrollTop + segmentHeight;
      }

      if (nextScrollTop !== viewport.scrollTop) {
        isWrappingRef.current = true;
        isProgrammaticScrollRef.current = true;
        viewport.scrollTop = nextScrollTop;
        scrollPositionRef.current = nextScrollTop;
        window.requestAnimationFrame(() => {
          isWrappingRef.current = false;
          isProgrammaticScrollRef.current = false;
        });
      }
    },
    [getSegmentHeight, shouldLoop]
  );

  const pauseInteraction = React.useCallback(
    (viewport) => {
      syncPosition(viewport);
      isInteractingRef.current = true;
      pausedUntilRef.current = Number.POSITIVE_INFINITY;
    },
    [syncPosition]
  );

  const scheduleResume = React.useCallback(
    (viewport) => {
      syncPosition(viewport);
      isInteractingRef.current = false;
      pausedUntilRef.current = performance.now() + RESUME_DELAY_MS;
    },
    [syncPosition]
  );

  const pauseTemporarily = React.useCallback(
    (viewport) => {
      pauseInteraction(viewport);
      scheduleResume(viewport);
    },
    [pauseInteraction, scheduleResume]
  );

  const handleScroll = React.useCallback(
    (event) => {
      const viewport = event.currentTarget;
      wrapViewport(viewport);

      if (!isProgrammaticScrollRef.current) {
        syncPosition(viewport);
        if (!isInteractingRef.current) {
          pausedUntilRef.current = performance.now() + RESUME_DELAY_MS;
        }
      }
    },
    [syncPosition, wrapViewport]
  );

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !shouldLoop) {
      return;
    }

    const segmentHeight = getSegmentHeight(viewport);
    if (segmentHeight > viewport.clientHeight && viewport.dataset.loopKey !== itemKey) {
      viewport.scrollTop = segmentHeight;
      scrollPositionRef.current = segmentHeight;
      pausedUntilRef.current = 0;
      viewport.dataset.loopKey = itemKey;
    }
  }, [getSegmentHeight, itemKey, shouldLoop]);

  React.useEffect(() => {
    if (!shouldLoop) {
      return undefined;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return undefined;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduceMotion) {
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
      const segmentHeight = getSegmentHeight(viewport);

      if (segmentHeight > viewport.clientHeight && pausedUntilRef.current <= timestamp) {
        const nextPosition = scrollPositionRef.current + AUTO_SCROLL_SPEED * deltaSeconds;
        scrollPositionRef.current = nextPosition;
        isProgrammaticScrollRef.current = true;
        viewport.scrollTop = nextPosition;
        wrapViewport(viewport);
        window.requestAnimationFrame(() => {
          isProgrammaticScrollRef.current = false;
        });
      }

      frameId = window.requestAnimationFrame(step);
    };

    frameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(frameId);
  }, [getSegmentHeight, shouldLoop, wrapViewport]);

  if (!items.length) return null;

  const renderedItems = shouldLoop
    ? Array.from({ length: LOOP_SEGMENTS }, () => items).flat()
    : items;

  const renderItem = (item, index) => {
    const segmentIndex = shouldLoop ? Math.floor(index / items.length) : 0;
    const isDuplicate = shouldLoop && segmentIndex !== 1;

    return (
      <div
        key={`${isDuplicate ? 'duplicate' : 'item'}-${item.alt}-${index}`}
        className={`${styles.slot} ${isDuplicate ? styles.duplicateSlot : ''}`}
        aria-hidden={isDuplicate ? 'true' : undefined}
      >
        <div className={styles.imageFrame}>
          <img className={styles.logo} src={item.src} alt={isDuplicate ? '' : item.alt} />
        </div>
        <span className={styles.name}>{item.alt}</span>
      </div>
    );
  };

  return (
    <aside className={`${styles.rail} ${side === 'right' ? styles.right : styles.left}`}>
      <div
        className={styles.viewport}
        ref={viewportRef}
        onPointerDown={(event) => pauseInteraction(event.currentTarget)}
        onPointerUp={(event) => scheduleResume(event.currentTarget)}
        onPointerCancel={(event) => scheduleResume(event.currentTarget)}
        onTouchStart={(event) => pauseInteraction(event.currentTarget)}
        onTouchEnd={(event) => scheduleResume(event.currentTarget)}
        onTouchCancel={(event) => scheduleResume(event.currentTarget)}
        onWheel={(event) => pauseTemporarily(event.currentTarget)}
        onScroll={handleScroll}
      >
        <div className={styles.stack}>
          {renderedItems.map((item, index) => renderItem(item, index))}
        </div>
      </div>
    </aside>
  );
}
