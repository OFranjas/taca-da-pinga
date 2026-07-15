import { useEffect, useState } from 'react';

const MIN_LOOP_COPIES = 3;

export const getLoopCopyCount = (viewportExtent, cycleExtent) => {
  if (!Number.isFinite(viewportExtent) || !Number.isFinite(cycleExtent) || cycleExtent <= 0) {
    return MIN_LOOP_COPIES;
  }

  return Math.max(MIN_LOOP_COPIES, Math.ceil(viewportExtent / cycleExtent) + 3);
};

export const getLoopDurationSeconds = (cycleExtent, pixelsPerSecond) => {
  if (!Number.isFinite(cycleExtent) || !Number.isFinite(pixelsPerSecond) || pixelsPerSecond <= 0) {
    return undefined;
  }

  return Math.max(8, cycleExtent / pixelsPerSecond);
};

export default function useMeasuredLoop({ axis, cycleRef, enabled, pixelsPerSecond, viewportRef }) {
  const [loop, setLoop] = useState(() => ({
    copies: enabled ? MIN_LOOP_COPIES : 1,
    cycleExtent: 0,
    durationSeconds: undefined,
  }));

  useEffect(() => {
    if (!enabled) {
      setLoop({ copies: 1, cycleExtent: 0, durationSeconds: undefined });
      return undefined;
    }

    const viewport = viewportRef.current;
    const cycle = cycleRef.current;
    if (!viewport || !cycle) {
      return undefined;
    }

    const measure = () => {
      const cycleExtent =
        axis === 'x' ? cycle.getBoundingClientRect().width : cycle.getBoundingClientRect().height;
      const viewportExtent = axis === 'x' ? viewport.clientWidth : viewport.clientHeight;
      const nextLoop = {
        copies: getLoopCopyCount(viewportExtent, cycleExtent),
        cycleExtent,
        durationSeconds: getLoopDurationSeconds(cycleExtent, pixelsPerSecond),
      };

      setLoop((current) =>
        current.copies === nextLoop.copies &&
        current.cycleExtent === nextLoop.cycleExtent &&
        current.durationSeconds === nextLoop.durationSeconds
          ? current
          : nextLoop
      );
    };

    measure();
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    resizeObserver?.observe(viewport);
    resizeObserver?.observe(cycle);
    window.addEventListener('resize', measure);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [axis, cycleRef, enabled, pixelsPerSecond, viewportRef]);

  return loop;
}
