import { uid } from "@allem-dev/core";

export type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";

export interface ConsoleEntry {
  id: string;
  timestamp: number;
  level: ConsoleLevel;
  args: unknown[];
  message: string;
  stack: string | null;
}

export class ConsoleStore {
  private entries: ConsoleEntry[] = [];
  private snapshot: ConsoleEntry[] = [];
  private maxEntries: number;
  private listeners = new Set<() => void>();

  constructor(maxEntries = 500) { this.maxEntries = maxEntries; }

  add(entry: Omit<ConsoleEntry, "id">): ConsoleEntry {
    const full: ConsoleEntry = { id: uid(), ...entry };
    this.entries.push(full);
    if (this.entries.length > this.maxEntries) this.entries.shift();
    this.notify();
    return full;
  }

  getAll = (): ConsoleEntry[] => this.snapshot;

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
