import { now } from "@allem-dev/core";
import { RenderStore } from "./store";

/** Tracks why a component re-rendered by comparing props/state */
export function diffProps(prev: Record<string, unknown>, next: Record<string, unknown>): string[] {
  const changed: string[] = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  for (const key of allKeys) {
    if (!Object.is(prev[key], next[key])) {
      changed.push(key);
    }
  }
  return changed;
}

/** Create a render tracker that can be used as a React Profiler onRender callback */
export function createProfilerCallback(store: RenderStore) {
  return function onRender(
    id: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number,
  ): void {
    store.record({
      component: id,
      timestamp: Date.now(),
      duration: actualDuration,
      reason: phase,
      changedProps: [],
      changedState: [],
    });
  };
}
