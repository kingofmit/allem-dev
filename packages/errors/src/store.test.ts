import { describe, it, expect, vi } from "vitest";
import { ErrorStore } from "./store";

function makeEntry(overrides: Partial<{
  timestamp: number; message: string; stack: string | null;
  source: "runtime" | "unhandled-rejection" | "boundary" | "console";
  componentStack: string; url: string; line: number; column: number;
}> = {}) {
  return {
    timestamp: Date.now(),
    message: "Something went wrong",
    stack: null,
    source: "runtime" as const,
    ...overrides,
  };
}

describe("ErrorStore", () => {
  it("add() creates entry with id", () => {
    const store = new ErrorStore();
    const entry = store.add(makeEntry());
    expect(entry.id).toMatch(/^ad_/);
    expect(store.getAll()).toHaveLength(1);
  });

  it("circular buffer evicts oldest at maxEntries (default 200)", () => {
    const store = new ErrorStore(3);
    store.add(makeEntry({ message: "a" }));
    store.add(makeEntry({ message: "b" }));
    store.add(makeEntry({ message: "c" }));
    store.add(makeEntry({ message: "d" }));
    expect(store.getCount()).toBe(3);
    expect(store.getAll()[0].message).toBe("b");
  });

  it("getCount() returns correct count", () => {
    const store = new ErrorStore();
    expect(store.getCount()).toBe(0);
    store.add(makeEntry());
    expect(store.getCount()).toBe(1);
  });

  it("clear() empties the store", () => {
    const store = new ErrorStore();
    store.add(makeEntry());
    store.clear();
    expect(store.getCount()).toBe(0);
  });

  it("subscribe() notifies on add and clear", () => {
    const store = new ErrorStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.add(makeEntry());
    expect(listener).toHaveBeenCalledTimes(1);

    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("subscribe() returns unsubscribe function", () => {
    const store = new ErrorStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.add(makeEntry());
    expect(listener).not.toHaveBeenCalled();
  });
});
