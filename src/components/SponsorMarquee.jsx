import React, { useMemo, useRef } from 'react';
import useInteractiveLoop from '../hooks/useInteractiveLoop';
import useMeasuredLoop from '../hooks/useMeasuredLoop';
import styles from './SponsorMarquee.module.css';

const AUTO_SCROLL_SPEED = 18;

function SponsorRow({ sponsors, autoScroll, rowIndex }) {
  const viewportRef = useRef(null);
  const cycleRef = useRef(null);
  const trackRef = useRef(null);
  const shouldLoop = autoScroll && sponsors.length > 1;
  const { copies, cycleExtent, durationSeconds } = useMeasuredLoop({
    axis: 'x',
    cycleRef,
    enabled: shouldLoop,
    pixelsPerSecond: AUTO_SCROLL_SPEED,
    viewportRef,
  });
  const interactionHandlers = useInteractiveLoop({
    axis: 'x',
    cycleExtent,
    durationSeconds,
    enabled: shouldLoop,
    trackRef,
  });

  const renderSponsor = (sponsor, index, isDuplicate) => {
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

    if (hasLink) {
      return (
        <a
          key={`${sponsor.id}-${rowIndex}-${index}`}
          href={sponsor.link}
          target="_blank"
          rel="noreferrer"
          tabIndex={isDuplicate ? -1 : undefined}
          className={styles.cardLink}
        >
          {content}
        </a>
      );
    }

    return <React.Fragment key={`${sponsor.id}-${rowIndex}-${index}`}>{content}</React.Fragment>;
  };

  const renderCycle = (cycleIndex) => {
    const isDuplicate = shouldLoop && cycleIndex > 0;
    return (
      <span
        key={cycleIndex}
        ref={cycleIndex === 0 ? cycleRef : undefined}
        className={styles.segment}
        aria-hidden={isDuplicate || undefined}
      >
        {sponsors.map((sponsor, index) => (
          <span
            key={sponsor.id}
            className={styles.card}
            role={isDuplicate ? undefined : 'listitem'}
          >
            {renderSponsor(sponsor, index, isDuplicate)}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div
      ref={viewportRef}
      className={`${styles.row} ${shouldLoop ? styles.animatedRow : ''}`}
      tabIndex={0}
      {...interactionHandlers}
    >
      <span ref={trackRef} className={styles.track}>
        {Array.from({ length: shouldLoop ? copies : 1 }, (_, cycleIndex) =>
          renderCycle(cycleIndex)
        )}
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
