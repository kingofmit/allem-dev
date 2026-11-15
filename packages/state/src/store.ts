import { StateEntry, uid } from "@allem-dev/core";

/** In-memory store for state changes */
export class StateStore {
  private entries: StateEntry[] = [];
  private maxEntries: number;
  private listeners = new Set<() => void>();

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  record(entry: Omit<StateEntry, "id">): StateEntry {
    const full: StateEntry = { id: uid(), ...entry };
    this.entries.push(full);
    if (this.entries.length > this.maxEntries) this.entries.shift();
    this.notify();
    return full;
  }

  getAll(): StateEntry[] { return [...this.entries]; }
  clear(): void { this.entries = []; this.notify(); }
  getCount(): number { return this.entries.length; }

  getByStore(storeName: string): StateEntry[] {
    return this.entries.filter((e) => e.store === storeName);
  }

  getTimeline(since?: number): StateEntry[] {
    if (!since) return this.getAll();
    return this.entries.filter((e) => e.timestamp >= since);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
