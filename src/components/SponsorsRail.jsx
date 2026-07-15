import React from 'react';
import styles from './SponsorsRail.module.css';

const AUTO_SCROLL_SPEED = 22;
const RESUME_DELAY_MS = 1400;
// Extra copies keep the rail scrollable even when a sponsor cycle is shorter
// than the display viewport.
const LOOP_SEGMENTS = 5;

export function getLoopWrapPosition({ scrollTop, scrollHeight, clientHeight, segmentHeight }) {
  const maxScrollTop = Math.max(0, scrollHeight - clientHeight);
  if (segmentHeight <= 0 || maxScrollTop <= segmentHeight) {
    return scrollTop;
  }

  // Usually we wrap at the end of the second segment. On taller displays the
  // browser can reach its scroll limit before that point, so wrap at that
  // limit instead. Both positions render the same repeated sponsor cycle.
  const upperWrapBoundary = Math.min(segmentHeight * 2, maxScrollTop);
  if (scrollTop >= upperWrapBoundary) {
    return scrollTop - segmentHeight;
  }

  if (scrollTop <= 0) {
    return scrollTop + segmentHeight;
  }

  return scrollTop;
}

/**
 * @param {{ images?: string[]; sponsors?: Array<{ imageDataUrl: string, name?: string, link?: string }>; side?: 'left' | 'right'; loopItemTarget?: number; autoScroll?: boolean }} props
 */
export default function SponsorsRail({
  images = [],
  sponsors = [],
  side = 'left',
  loopItemTarget,
  autoScroll = true,
}) {
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
            link: sponsor.link,
          }))
        : images.map((src, index) => ({ src, alt: `Patrocinador ${index + 1}` })),
    [images, sponsors]
  );

  const requestedCycleLength = Math.max(items.length, loopItemTarget ?? 0);
  const cycleLength =
    items.length === 2 && requestedCycleLength % 2 === 1
      ? requestedCycleLength + 1
      : requestedCycleLength;
  const shouldLoop = autoScroll && items.length > 1 && cycleLength > 1;
  const cycleItems = React.useMemo(() => {
    if (!items.length) return [];

    const nextCycle = [...items];
    while (nextCycle.length < cycleLength) {
      const previousItem = nextCycle[nextCycle.length - 1];
      const firstItem = nextCycle[0];
      const nextItem =
        items.find((item) => item !== previousItem && item !== firstItem) ??
        items.find((item) => item !== previousItem) ??
        firstItem;
      nextCycle.push(nextItem);
    }

    return nextCycle;
  }, [cycleLength, items]);
  const itemKey = React.useMemo(
    () => `${cycleLength}:${items.map((item) => item.src).join('|')}`,
    [cycleLength, items]
  );

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
      if (viewport.scrollHeight <= viewport.clientHeight) {
        return;
      }

      const nextScrollTop = getLoopWrapPosition({
        scrollTop: viewport.scrollTop,
        scrollHeight: viewport.scrollHeight,
        clientHeight: viewport.clientHeight,
        segmentHeight,
      });

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
      if (isProgrammaticScrollRef.current) {
        return;
      }

      wrapViewport(viewport);

      syncPosition(viewport);
      if (!isInteractingRef.current) {
        pausedUntilRef.current = performance.now() + RESUME_DELAY_MS;
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
    if (viewport.scrollHeight > viewport.clientHeight && viewport.dataset.loopKey !== itemKey) {
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
      if (viewport.scrollHeight > viewport.clientHeight && pausedUntilRef.current <= timestamp) {
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
    ? Array.from({ length: LOOP_SEGMENTS }, () => cycleItems).flat()
    : items;

  const renderItem = (item, index) => {
    const segmentIndex = shouldLoop ? Math.floor(index / cycleLength) : 0;
    const cycleIndex = shouldLoop ? index % cycleLength : index;
    const isDuplicate = shouldLoop && (segmentIndex !== 1 || cycleIndex >= items.length);

    const content = (
      <>
        <div className={styles.imageFrame}>
          <img className={styles.logo} src={item.src} alt={isDuplicate ? '' : item.alt} />
        </div>
        <span className={styles.name}>{item.alt}</span>
      </>
    );

    const className = `${styles.slot} ${isDuplicate ? styles.duplicateSlot : ''}`;
    if (item.link) {
      return (
        <a
          key={`${isDuplicate ? 'duplicate' : 'item'}-${item.alt}-${index}`}
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className={className}
          aria-hidden={isDuplicate ? 'true' : undefined}
          aria-label={isDuplicate ? undefined : item.alt}
          tabIndex={isDuplicate ? -1 : undefined}
        >
          {content}
        </a>
      );
    }

    return (
      <div
        key={`${isDuplicate ? 'duplicate' : 'item'}-${item.alt}-${index}`}
        className={className}
        aria-hidden={isDuplicate ? 'true' : undefined}
      >
        {content}
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
