import { useCallback, useEffect, useRef } from 'react';

const RESUME_DELAY_MS = 1400;
const DRAG_THRESHOLD_PX = 5;

export const normalizeLoopTime = (time, duration) => {
  if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  return ((time % duration) + duration) % duration;
};

export default function useInteractiveLoop({
  axis,
  cycleExtent,
  durationSeconds,
  enabled,
  trackRef,
}) {
  const animationRef = useRef(null);
  const dragRef = useRef(null);
  const resumeTimeoutRef = useRef(0);
  const suppressClickRef = useRef(false);

  const pause = useCallback(() => {
    window.clearTimeout(resumeTimeoutRef.current);
    animationRef.current?.pause();
  }, []);

  const resumeLater = useCallback(() => {
    window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      animationRef.current?.play();
    }, RESUME_DELAY_MS);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !enabled || !cycleExtent || !durationSeconds) {
      return undefined;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduceMotion || typeof track.animate !== 'function') {
      return undefined;
    }

    const translate =
      axis === 'x'
        ? `translate3d(${-cycleExtent}px, 0, 0)`
        : `translate3d(0, ${-cycleExtent}px, 0)`;
    const animation = track.animate(
      [{ transform: 'translate3d(0, 0, 0)' }, { transform: translate }],
      {
        duration: durationSeconds * 1000,
        easing: 'linear',
        iterations: Infinity,
      }
    );
    animationRef.current = animation;

    return () => {
      window.clearTimeout(resumeTimeoutRef.current);
      animation.cancel();
      if (animationRef.current === animation) {
        animationRef.current = null;
      }
    };
  }, [axis, cycleExtent, durationSeconds, enabled, trackRef]);

  const onPointerDown = useCallback(
    (event) => {
      const animation = animationRef.current;
      if (!animation || !cycleExtent || !durationSeconds) {
        return;
      }

      pause();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        startCoordinate: axis === 'x' ? event.clientX : event.clientY,
        startTime: Number(animation.currentTime ?? 0),
      };
      suppressClickRef.current = false;
    },
    [axis, cycleExtent, durationSeconds, pause]
  );

  const onPointerMove = useCallback(
    (event) => {
      const drag = dragRef.current;
      const animation = animationRef.current;
      if (!drag || drag.pointerId !== event.pointerId || !animation) {
        return;
      }

      const coordinate = axis === 'x' ? event.clientX : event.clientY;
      const distance = coordinate - drag.startCoordinate;
      if (Math.abs(distance) > DRAG_THRESHOLD_PX) {
        suppressClickRef.current = true;
      }

      const duration = durationSeconds * 1000;
      animation.currentTime = normalizeLoopTime(
        drag.startTime - (distance / cycleExtent) * duration,
        duration
      );
      event.preventDefault();
    },
    [axis, cycleExtent, durationSeconds]
  );

  const onPointerEnd = useCallback(
    (event) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) {
        return;
      }

      event.currentTarget.releasePointerCapture?.(event.pointerId);
      dragRef.current = null;
      resumeLater();
    },
    [resumeLater]
  );

  const onClickCapture = useCallback((event) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressClickRef.current = false;
    }
  }, []);

  return {
    onBlur: resumeLater,
    onClickCapture,
    onFocus: pause,
    onMouseEnter: pause,
    onMouseLeave: resumeLater,
    onPointerCancel: onPointerEnd,
    onPointerDown,
    onPointerMove,
    onPointerUp: onPointerEnd,
  };
}
