import { describe, it, expect } from "vitest";
import { summarizeRenders } from "./profiler";
import { RenderStore } from "./store";

function recordEntry(
  store: RenderStore,
  component: string,
  duration: number,
): void {
  store.record({
    component,
    timestamp: Date.now(),
    duration,
    reason: "update",
    changedProps: [],
    changedState: [],
  });
}

describe("summarizeRenders", () => {
  it("returns correct totalRenders", () => {
    const store = new RenderStore();
    recordEntry(store, "A", 1);
    recordEntry(store, "B", 2);
    recordEntry(store, "C", 3);

    const summary = summarizeRenders(store);
    expect(summary.totalRenders).toBe(3);
  });

  it("returns correct uniqueComponents count", () => {
    const store = new RenderStore();
    recordEntry(store, "A", 1);
    recordEntry(store, "A", 2);
    recordEntry(store, "B", 3);

    const summary = summarizeRenders(store);
    expect(summary.uniqueComponents).toBe(2);
  });

  it("finds slowestRender", () => {
    const store = new RenderStore();
    recordEntry(store, "Fast", 1);
    recordEntry(store, "Slow", 50);
    recordEntry(store, "Medium", 10);

    const summary = summarizeRenders(store);
    expect(summary.slowestRender).toEqual({ component: "Slow", duration: 50 });
  });

  it("calculates avgDuration", () => {
    const store = new RenderStore();
    recordEntry(store, "A", 10);
    recordEntry(store, "B", 20);
    recordEntry(store, "C", 30);

    const summary = summarizeRenders(store);
    expect(summary.avgDuration).toBe(20);
  });

  it("returns avgDuration 0 for empty store", () => {
    const store = new RenderStore();
    const summary = summarizeRenders(store);
    expect(summary.avgDuration).toBe(0);
    expect(summary.slowestRender).toBeNull();
    expect(summary.totalRenders).toBe(0);
  });

  it("returns top 5 hotComponents", () => {
    const store = new RenderStore();
    // Record varying counts per component
    for (let i = 0; i < 10; i++) recordEntry(store, "Hot1", 1);
    for (let i = 0; i < 8; i++) recordEntry(store, "Hot2", 1);
    for (let i = 0; i < 6; i++) recordEntry(store, "Hot3", 1);
    for (let i = 0; i < 4; i++) recordEntry(store, "Hot4", 1);
    for (let i = 0; i < 2; i++) recordEntry(store, "Hot5", 1);
    for (let i = 0; i < 1; i++) recordEntry(store, "Cold", 1);

    const summary = summarizeRenders(store);
    expect(summary.hotComponents).toHaveLength(5);
    expect(summary.hotComponents[0].component).toBe("Hot1");
    expect(summary.hotComponents[0].count).toBe(10);
    expect(summary.hotComponents[4].component).toBe("Hot5");
    // "Cold" should not appear in top 5
    expect(summary.hotComponents.map((h) => h.component)).not.toContain("Cold");
  });
});
