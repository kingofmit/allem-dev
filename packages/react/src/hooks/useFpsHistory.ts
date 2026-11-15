import { useState, useRef, useEffect } from "react";

import { MAX_FPS_SAMPLES } from "../constants";

/**
 * Maintains a ring-buffer style history of FPS samples.
 * Appends `currentFps` on every change and trims to MAX_FPS_SAMPLES.
 */
export function useFpsHistory(currentFps: number): number[] {
  const bufferRef = useRef<number[]>([]);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    const buf = bufferRef.current;
    buf.push(currentFps);

    if (buf.length > MAX_FPS_SAMPLES) {
      buf.shift();
    }

    // Snapshot into a new array so React sees a new reference
    setHistory([...buf]);
  }, [currentFps]);

  return history;
}
