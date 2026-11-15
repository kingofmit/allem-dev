import { RenderStore } from "./store";

export interface RenderSummary {
  totalRenders: number;
  uniqueComponents: number;
  slowestRender: { component: string; duration: number } | null;
  avgDuration: number;
  hotComponents: Array<{ component: string; count: number }>;
}

/** Generate a summary of render activity */
export function summarizeRenders(store: RenderStore): RenderSummary {
  const entries = store.getAll();
  const components = new Set(entries.map((e) => e.component));
  const slowest = entries.reduce<{ component: string; duration: number } | null>(
    (max, e) => (!max || e.duration > max.duration ? { component: e.component, duration: e.duration } : max),
    null,
  );
  const totalDuration = entries.reduce((sum, e) => sum + e.duration, 0);

  return {
    totalRenders: entries.length,
    uniqueComponents: components.size,
    slowestRender: slowest,
    avgDuration: entries.length > 0 ? totalDuration / entries.length : 0,
    hotComponents: store.getHotComponents(5),
  };
}
