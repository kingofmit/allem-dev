import { describe, it, expect, vi } from "vitest";
import { StateStore } from "./store";

function makeEntry(overrides: Partial<{
  store: string; key: string; timestamp: number;
  previousValue: unknown; nextValue: unknown; action: string;
}> = {}) {
  return {
    store: "myStore",
    key: "count",
    timestamp: Date.now(),
    previousValue: 0,
    nextValue: 1,
    ...overrides,
  };
}

describe("StateStore", () => {
  it("record() creates entry with id", () => {
    const store = new StateStore();
    const entry = store.record(makeEntry());
    expect(entry.id).toMatch(/^ad_/);
    expect(store.getAll()).toHaveLength(1);
  });

  it("getByStore() filters by store name", () => {
    const store = new StateStore();
    store.record(makeEntry({ store: "auth" }));
    store.record(makeEntry({ store: "auth" }));
    store.record(makeEntry({ store: "cart" }));
    expect(store.getByStore("auth")).toHaveLength(2);
    expect(store.getByStore("cart")).toHaveLength(1);
    expect(store.getByStore("other")).toHaveLength(0);
  });

  it("getTimeline(since) returns entries after timestamp", () => {
    const store = new StateStore();
    store.record(makeEntry({ timestamp: 1000 }));
    store.record(makeEntry({ timestamp: 2000 }));
    store.record(makeEntry({ timestamp: 3000 }));
    const timeline = store.getTimeline(2000);
    expect(timeline).toHaveLength(2);
    expect(timeline[0].timestamp).toBe(2000);
    expect(timeline[1].timestamp).toBe(3000);
  });

  it("getTimeline() without since returns all entries", () => {
    const store = new StateStore();
    store.record(makeEntry());
    store.record(makeEntry());
    expect(store.getTimeline()).toHaveLength(2);
  });

  it("circular buffer evicts oldest entries", () => {
    const store = new StateStore(2);
    store.record(makeEntry({ key: "a" }));
    store.record(makeEntry({ key: "b" }));
    store.record(makeEntry({ key: "c" }));
    expect(store.getCount()).toBe(2);
    expect(store.getAll()[0].key).toBe("b");
  });

  it("clear() empties the store", () => {
    const store = new StateStore();
    store.record(makeEntry());
    store.clear();
    expect(store.getCount()).toBe(0);
  });

  it("subscribe() notifies on record and clear", () => {
    const store = new StateStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.record(makeEntry());
    expect(listener).toHaveBeenCalledTimes(1);
    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
