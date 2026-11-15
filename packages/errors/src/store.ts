import { ErrorEntry, uid } from "@allem-dev/core";

/** In-memory store for caught errors */
export class ErrorStore {
  private entries: ErrorEntry[] = [];
  private snapshot: ErrorEntry[] = [];
  private maxEntries: number;
  private listeners = new Set<() => void>();

  constructor(maxEntries = 200) {
    this.maxEntries = maxEntries;
  }

  add(entry: Omit<ErrorEntry, "id">): ErrorEntry {
    const full: ErrorEntry = { id: uid(), ...entry };
    this.entries.push(full);
    if (this.entries.length > this.maxEntries) this.entries.shift();
    this.notify();
    return full;
  }

  getAll = (): ErrorEntry[] => this.snapshot;

  clear(): void {
    this.entries = [];
    this.notify();
  }

  getCount(): number { return this.entries.length; }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private notify(): void {
    this.snapshot = [...this.entries];
    this.listeners.forEach((fn) => fn());
  }
}
