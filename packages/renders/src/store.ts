import { RenderEntry, uid } from "@allem-dev/core";

/** In-memory store for render tracking */
export class RenderStore {
  private entries: RenderEntry[] = [];
  private snapshot: RenderEntry[] = [];
  private renderCounts = new Map<string, number>();
  private maxEntries: number;
  private listeners = new Set<() => void>();

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  record(entry: Omit<RenderEntry, "id" | "renderCount">): RenderEntry {
    const count = (this.renderCounts.get(entry.component) ?? 0) + 1;
    this.renderCounts.set(entry.component, count);
    const full: RenderEntry = { id: uid(), renderCount: count, ...entry };
    this.entries.push(full);
    if (this.entries.length > this.maxEntries) this.entries.shift();
    this.notify();
    return full;
  }

  getAll = (): RenderEntry[] => this.snapshot;

  clear(): void {
    this.entries = [];
    this.renderCounts.clear();
    this.notify();
  }

  getCount(): number { return this.entries.length; }

  getHotComponents(limit = 10): Array<{ component: string; count: number }> {
    return Array.from(this.renderCounts.entries())
      .map(([component, count]) => ({ component, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getByComponent(name: string): RenderEntry[] {
    return this.entries.filter((e) => e.component === name);
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify(): void {
    this.snapshot = [...this.entries];
    this.listeners.forEach((fn) => fn());
  }
}
