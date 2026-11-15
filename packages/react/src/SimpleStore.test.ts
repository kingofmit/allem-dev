import { describe, it, expect, vi } from "vitest";
import { SimpleStore } from "./SimpleStore";

describe("SimpleStore", () => {
  it("constructor sets initial value", () => {
    const store = new SimpleStore(42);
    expect(store.get()).toBe(42);
  });

  it("get() returns current value", () => {
    const store = new SimpleStore("hello");
    expect(store.get()).toBe("hello");
  });

  it("set() updates value", () => {
    const store = new SimpleStore(0);
    store.set(99);
    expect(store.get()).toBe(99);
  });

  it("set() notifies all subscribers", () => {
    const store = new SimpleStore(0);
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    store.subscribe(cb1);
    store.subscribe(cb2);

    store.set(1);

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });

  it("subscribe() returns unsubscribe function", () => {
    const store = new SimpleStore(0);
    const cb = vi.fn();
    const unsub = store.subscribe(cb);

    expect(typeof unsub).toBe("function");
  });

  it("unsubscribing prevents future notifications", () => {
    const store = new SimpleStore(0);
    const cb = vi.fn();
    const unsub = store.subscribe(cb);

    store.set(1);
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
    store.set(2);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("multiple subscribers all get notified", () => {
    const store = new SimpleStore("a");
    const callbacks = Array.from({ length: 5 }, () => vi.fn());
    callbacks.forEach((cb) => store.subscribe(cb));

    store.set("b");

    callbacks.forEach((cb) => {
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });
});
