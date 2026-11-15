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

/**
 * Create a render tracker that can be used as a React Profiler onRender callback.
 *
 * Optionally accepts a `getComponentProps` function that returns the current props
 * for a given component id. When provided, the tracker diffs props between renders
 * to populate changedProps.
 */
export function createProfilerCallback(
  store: RenderStore,
  getComponentProps?: (id: string) => Record<string, unknown> | null,
) {
  const prevPropsMap = new Map<string, Record<string, unknown>>();

  return function onRender(
    id: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number,
    _baseDuration: number,
    _startTime: number,
    _commitTime: number,
  ): void {
    let changedProps: string[] = [];

    if (getComponentProps) {
      const currentProps = getComponentProps(id);
      if (currentProps) {
        const prev = prevPropsMap.get(id);
        if (prev) {
          changedProps = diffProps(prev, currentProps);
        }
        prevPropsMap.set(id, { ...currentProps });
      }
    }

    store.record({
      component: id,
      timestamp: Date.now(),
      duration: actualDuration,
      reason: phase,
      changedProps,
      changedState: [], // React Profiler API does not expose state diffs
    });
  };
}
