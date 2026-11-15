import { describe, it, expect, vi } from "vitest";
import { ConsoleStore } from "./ConsoleStore";

function makeEntry(overrides: Partial<{
  timestamp: number; level: "log" | "info" | "warn" | "error" | "debug";
  args: unknown[]; message: string; stack: string | null;
}> = {}) {
  return {
    timestamp: Date.now(),
    level: "log" as const,
    args: ["hello"],
    message: "hello",
    stack: null,
    ...overrides,
  };
}

describe("ConsoleStore", () => {
  it("add() creates entry with id", () => {
    const store = new ConsoleStore();
    const entry = store.add(makeEntry());
    expect(entry.id).toMatch(/^ad_/);
    expect(store.getAll()).toHaveLength(1);
  });

  it("getAll() returns all entries", () => {
    const store = new ConsoleStore();
    store.add(makeEntry({ message: "a" }));
    store.add(makeEntry({ message: "b" }));
    const all = store.getAll();
    expect(all).toHaveLength(2);
    expect(all[0].message).toBe("a");
  });

  it("clear() empties the store", () => {
    const store = new ConsoleStore();
    store.add(makeEntry());
    store.clear();
    expect(store.getCount()).toBe(0);
  });

  it("subscribe() notifies on add and clear", () => {
    const store = new ConsoleStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.add(makeEntry());
    expect(listener).toHaveBeenCalledTimes(1);
    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("subscribe() returns unsubscribe function", () => {
    const store = new ConsoleStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.add(makeEntry());
    expect(listener).not.toHaveBeenCalled();
  });

  it("circular buffer evicts oldest when exceeding maxEntries", () => {
    const store = new ConsoleStore(2);
    store.add(makeEntry({ message: "a" }));
    store.add(makeEntry({ message: "b" }));
    store.add(makeEntry({ message: "c" }));
    expect(store.getCount()).toBe(2);
    expect(store.getAll()[0].message).toBe("b");
  });
});
