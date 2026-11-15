import { describe, it, expect } from "vitest";
import { shallowDiff } from "./differ";

describe("shallowDiff", () => {
  it("detects added keys", () => {
    const results = shallowDiff({ a: 1 }, { a: 1, b: 2 });
    const added = results.filter((r) => r.type === "added");
    expect(added).toHaveLength(1);
    expect(added[0]).toEqual({ type: "added", path: "b", newValue: 2 });
  });

  it("detects removed keys", () => {
    const results = shallowDiff({ a: 1, b: 2 }, { a: 1 });
    const removed = results.filter((r) => r.type === "removed");
    expect(removed).toHaveLength(1);
    expect(removed[0]).toEqual({ type: "removed", path: "b", oldValue: 2 });
  });

  it("detects changed values", () => {
    const results = shallowDiff({ a: 1 }, { a: 2 });
    expect(results).toEqual([
      { type: "changed", path: "a", oldValue: 1, newValue: 2 },
    ]);
  });

  it("reports unchanged when objects are identical by reference", () => {
    const obj = { a: 1 };
    const results = shallowDiff(obj, obj);
    expect(results).toEqual([{ type: "unchanged", path: "(root)" }]);
  });

  it("reports unchanged when all keys match", () => {
    const results = shallowDiff({ a: 1, b: 2 }, { a: 1, b: 2 });
    expect(results).toEqual([{ type: "unchanged", path: "(root)" }]);
  });

  it("handles null vs object comparison", () => {
    const results = shallowDiff(null, { a: 1 });
    expect(results).toEqual([
      { type: "changed", path: "(root)", oldValue: null, newValue: { a: 1 } },
    ]);
  });

  it("handles primitive comparisons", () => {
    const results = shallowDiff(1, 2);
    expect(results).toEqual([
      { type: "changed", path: "(root)", oldValue: 1, newValue: 2 },
    ]);
  });

  it("handles identical primitives", () => {
    const results = shallowDiff(42, 42);
    expect(results).toEqual([{ type: "unchanged", path: "(root)" }]);
  });

  it("handles arrays (treated as objects with index keys)", () => {
    const results = shallowDiff([1, 2], [1, 3]);
    const changed = results.filter((r) => r.type === "changed");
    expect(changed).toHaveLength(1);
    expect(changed[0].path).toBe("1");
    expect(changed[0].oldValue).toBe(2);
    expect(changed[0].newValue).toBe(3);
  });
});
