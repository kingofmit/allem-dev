import { NetworkEntry, uid } from "@allem-dev/core";

/** In-memory store for network requests */
export class NetworkStore {
  private entries: NetworkEntry[] = [];
  private maxEntries: number;
  private listeners = new Set<() => void>();

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  add(entry: Omit<NetworkEntry, "id">): NetworkEntry {
    const full: NetworkEntry = { id: uid(), ...entry };
    this.entries.push(full);
    if (this.entries.length > this.maxEntries) this.entries.shift();
    this.notify();
    return full;
  }

  update(id: string, patch: Partial<NetworkEntry>): void {
    const entry = this.entries.find((e) => e.id === id);
    if (entry) {
      Object.assign(entry, patch);
      this.notify();
    }
  }

  getAll(): NetworkEntry[] { return [...this.entries]; }
  clear(): void { this.entries = []; this.notify(); }
  getCount(): number { return this.entries.length; }

  getByStatus(status: "pending" | "success" | "error"): NetworkEntry[] {
    return this.entries.filter((e) => {
      if (status === "pending") return e.status === null;
      if (status === "error") return e.status !== null && (e.status >= 400 || e.error !== null);
      return e.status !== null && e.status < 400 && e.error === null;
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
