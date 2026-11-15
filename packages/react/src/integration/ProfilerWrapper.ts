import React from "react";
import { createProfilerCallback } from "@allem-dev/renders";
import type { RenderStore } from "@allem-dev/renders";

export interface AllemDevProfilerProps {
  id: string;
  children: React.ReactNode;
  renderStore: RenderStore;
}

/**
 * Convenience wrapper around React.Profiler that auto-tracks renders
 * to the Allem Dev render store.
 *
 * No-ops in production (just renders children).
 */
export function AllemDevProfiler({ id, children, renderStore }: AllemDevProfilerProps): React.ReactElement {
  if (typeof globalThis !== "undefined" && (globalThis as any).process?.env?.NODE_ENV === "production") {
    return React.createElement(React.Fragment, null, children);
  }

  const onRender = React.useMemo(
    () => createProfilerCallback(renderStore),
    [renderStore],
  );

  return React.createElement(React.Profiler, { id, onRender }, children);
}
