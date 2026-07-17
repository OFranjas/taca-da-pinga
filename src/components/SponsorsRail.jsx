import React from 'react';
import useMeasuredLoop from '../hooks/useMeasuredLoop';
import styles from './SponsorsRail.module.css';

const AUTO_SCROLL_SPEED = 22;

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
  const cycleRef = React.useRef(null);
  const trackRef = React.useRef(null);
  const loopProgressRef = React.useRef(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
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
  const { copies, cycleExtent } = useMeasuredLoop({
    axis: 'y',
    cycleRef,
    enabled: shouldLoop,
    pixelsPerSecond: AUTO_SCROLL_SPEED,
    viewportRef,
  });

  React.useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) {
      return undefined;
    }

    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);

    return () => mediaQuery.removeEventListener?.('change', updatePreference);
  }, []);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return undefined;
    }

    if (!shouldLoop || !cycleExtent) {
      track.style.transform = '';
      return undefined;
    }

    if (prefersReducedMotion) {
      loopProgressRef.current = 0;
      track.style.transform = '';
      return undefined;
    }

    let frameId = 0;
    let previousTime;
    let offset = loopProgressRef.current * cycleExtent;

    const applyOffset = () => {
      track.style.transform = `translate3d(0, -${offset}px, 0)`;
    };

    const tick = (time) => {
      if (previousTime === undefined) {
        previousTime = time;
      }

      const elapsedSeconds = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      offset = (offset + elapsedSeconds * AUTO_SCROLL_SPEED) % cycleExtent;
      loopProgressRef.current = offset / cycleExtent;
      applyOffset();

      frameId = window.requestAnimationFrame(tick);
    };

    applyOffset();

    if (isPaused) {
      return () => {
        loopProgressRef.current = offset / cycleExtent;
      };
    }

    frameId = window.requestAnimationFrame(tick);

    return () => {
      loopProgressRef.current = offset / cycleExtent;
      window.cancelAnimationFrame(frameId);
    };
  }, [cycleExtent, isPaused, prefersReducedMotion, shouldLoop]);

  React.useEffect(
    () => () => {
      trackRef.current?.style.removeProperty('transform');
    },
    []
  );

  if (!items.length) return null;

  const pauseLoop = () => {
    setIsPaused(true);
  };

  const resumeLoop = (event) => {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
      return;
    }

    setIsPaused(false);
  };

  const renderItem = (item, index, isDuplicate) => {
    const content = (
      <>
        <div className={styles.imageFrame}>
          <img className={styles.logo} src={item.src} alt={isDuplicate ? '' : item.alt} />
        </div>
        <span className={styles.name}>{item.alt}</span>
      </>
    );
    const className = styles.slot;

    if (item.link) {
      return (
        <a
          key={`${isDuplicate ? 'duplicate' : 'item'}-${item.alt}-${index}`}
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className={className}
          aria-hidden={isDuplicate || undefined}
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
        aria-hidden={isDuplicate || undefined}
      >
        {content}
      </div>
    );
  };

  const renderCycle = (cycleIndex) => {
    const isDuplicate = shouldLoop && cycleIndex > 0;
    const renderedItems = shouldLoop ? cycleItems : items;
    return (
      <div
        key={cycleIndex}
        ref={cycleIndex === 0 ? cycleRef : undefined}
        className={styles.segment}
        aria-hidden={isDuplicate || undefined}
      >
        {renderedItems.map((item, index) => {
          const isRepeatedItem = isDuplicate || index >= items.length;
          return renderItem(item, index, isRepeatedItem);
        })}
      </div>
    );
  };

  return (
    <aside
      className={`${styles.rail} ${side === 'right' ? styles.right : styles.left}`}
      onMouseEnter={pauseLoop}
      onMouseLeave={resumeLoop}
      onFocusCapture={pauseLoop}
      onBlurCapture={resumeLoop}
    >
      <div
        ref={viewportRef}
        className={`${styles.viewport} ${shouldLoop ? styles.animatedViewport : ''}`}
      >
        <div ref={trackRef} className={styles.stack}>
          {Array.from({ length: shouldLoop ? copies : 1 }, (_, cycleIndex) =>
            renderCycle(cycleIndex)
          )}
        </div>
      </div>
    </aside>
  );
}
