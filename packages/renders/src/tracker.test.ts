import { describe, it, expect, vi } from "vitest";
import { diffProps, createProfilerCallback } from "./tracker";
import { RenderStore } from "./store";

describe("diffProps", () => {
  it("returns changed prop names", () => {
    const prev = { a: 1, b: 2 };
    const next = { a: 1, b: 3 };
    expect(diffProps(prev, next)).toEqual(["b"]);
  });

  it("detects added keys", () => {
    const prev = { a: 1 };
    const next = { a: 1, b: 2 };
    expect(diffProps(prev, next)).toContain("b");
  });

  it("detects removed keys", () => {
    const prev = { a: 1, b: 2 };
    const next = { a: 1 };
    expect(diffProps(prev, next)).toContain("b");
  });

  it("detects changed keys", () => {
    const prev = { x: "old" };
    const next = { x: "new" };
    expect(diffProps(prev, next)).toEqual(["x"]);
  });

  it("returns empty for identical objects", () => {
    const prev = { a: 1, b: "hello" };
    const next = { a: 1, b: "hello" };
    expect(diffProps(prev, next)).toEqual([]);
  });
});

describe("createProfilerCallback", () => {
  it("records to store on each call", () => {
    const store = new RenderStore();
    const onRender = createProfilerCallback(store);

    onRender("Comp", "mount", 5.2, 10, 0, 100);

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].component).toBe("Comp");
    expect(entries[0].duration).toBe(5.2);
    expect(entries[0].reason).toBe("mount");
  });

  it("with getComponentProps populates changedProps", () => {
    const store = new RenderStore();
    let currentProps: Record<string, unknown> = { color: "red" };
    const getProps = (_id: string) => currentProps;
    const onRender = createProfilerCallback(store, getProps);

    // First render: no prev props, so changedProps is empty
    onRender("Comp", "mount", 1, 1, 0, 0);
    expect(store.getAll()[0].changedProps).toEqual([]);

    // Second render with changed prop
    currentProps = { color: "blue" };
    onRender("Comp", "update", 2, 2, 0, 0);
    expect(store.getAll()[1].changedProps).toEqual(["color"]);
  });

  it("without getComponentProps leaves changedProps empty", () => {
    const store = new RenderStore();
    const onRender = createProfilerCallback(store);

    onRender("Comp", "update", 3, 3, 0, 0);
    expect(store.getAll()[0].changedProps).toEqual([]);
  });
});
