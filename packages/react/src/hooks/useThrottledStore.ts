import { useState, useRef, useEffect, useCallback } from "react";

import { THROTTLE_MS } from "../constants";

/**
 * Subscribes to a store but throttles UI updates so rapid-fire changes
 * are coalesced into a single render every `ms` milliseconds.
 *
 * Uses requestIdleCallback when available, setTimeout as fallback.
 */
export function useThrottledStore<T>(
  subscribe: (cb: () => void) => () => void,
  getSnapshot: () => T,
  ms: number = THROTTLE_MS,
): T {
  const [snapshot, setSnapshot] = useState<T>(getSnapshot);
  const timerRef = useRef<number | null>(null);
  const getSnapshotRef = useRef(getSnapshot);
  getSnapshotRef.current = getSnapshot;

  const scheduleUpdate = useCallback(() => {
    if (timerRef.current !== null) return;

    const fire = () => {
      timerRef.current = null;
      setSnapshot(getSnapshotRef.current());
    };

    if (typeof requestIdleCallback === "function") {
      timerRef.current = requestIdleCallback(fire, { timeout: ms }) as unknown as number;
    } else {
      timerRef.current = window.setTimeout(fire, ms) as unknown as number;
    }
  }, [ms]);

  useEffect(() => {
    // Sync immediately on mount / subscribe change
    setSnapshot(getSnapshotRef.current());

    const unsub = subscribe(scheduleUpdate);

    return () => {
      unsub();
      if (timerRef.current !== null) {
        if (typeof cancelIdleCallback === "function") {
          cancelIdleCallback(timerRef.current);
        } else {
          clearTimeout(timerRef.current);
        }
        timerRef.current = null;
      }
    };
  }, [subscribe, scheduleUpdate]);

  return snapshot;
}
