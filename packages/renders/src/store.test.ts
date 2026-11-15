import { describe, it, expect, vi } from "vitest";
import { RenderStore } from "./store";

function makeEntry(overrides: Partial<{
  component: string; timestamp: number; duration: number;
  reason: string; changedProps: string[]; changedState: string[];
}> = {}) {
  return {
    component: "MyComponent",
    timestamp: Date.now(),
    duration: 5,
    reason: "props",
    changedProps: ["value"],
    changedState: [],
    ...overrides,
  };
}

describe("RenderStore", () => {
  it("record() increments renderCount per component", () => {
    const store = new RenderStore();
    const first = store.record(makeEntry({ component: "A" }));
    const second = store.record(makeEntry({ component: "A" }));
    const other = store.record(makeEntry({ component: "B" }));
    expect(first.renderCount).toBe(1);
    expect(second.renderCount).toBe(2);
    expect(other.renderCount).toBe(1);
  });

  it("getHotComponents() returns sorted by count descending", () => {
    const store = new RenderStore();
    store.record(makeEntry({ component: "A" }));
    store.record(makeEntry({ component: "B" }));
    store.record(makeEntry({ component: "B" }));
    store.record(makeEntry({ component: "C" }));
    store.record(makeEntry({ component: "C" }));
    store.record(makeEntry({ component: "C" }));

    const hot = store.getHotComponents();
    expect(hot[0]).toEqual({ component: "C", count: 3 });
    expect(hot[1]).toEqual({ component: "B", count: 2 });
    expect(hot[2]).toEqual({ component: "A", count: 1 });
  });

  it("getByComponent() filters correctly", () => {
    const store = new RenderStore();
    store.record(makeEntry({ component: "A" }));
    store.record(makeEntry({ component: "B" }));
    store.record(makeEntry({ component: "A" }));
    expect(store.getByComponent("A")).toHaveLength(2);
    expect(store.getByComponent("B")).toHaveLength(1);
    expect(store.getByComponent("C")).toHaveLength(0);
  });

  it("circular buffer evicts oldest entries", () => {
    const store = new RenderStore(2);
    const first = store.record(makeEntry({ component: "A" }));
    store.record(makeEntry({ component: "B" }));
    store.record(makeEntry({ component: "C" }));
    expect(store.getCount()).toBe(2);
    expect(store.getAll().find((e) => e.id === first.id)).toBeUndefined();
  });

  it("clear() empties entries and render counts", () => {
    const store = new RenderStore();
    store.record(makeEntry({ component: "A" }));
    store.record(makeEntry({ component: "A" }));
    store.clear();
    expect(store.getCount()).toBe(0);
    expect(store.getHotComponents()).toEqual([]);
  });

  it("subscribe() notifies on record and clear", () => {
    const store = new RenderStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.record(makeEntry());
    expect(listener).toHaveBeenCalledTimes(1);
    store.clear();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
