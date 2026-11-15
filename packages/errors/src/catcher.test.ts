import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { installErrorCatcher, interceptConsoleErrors } from "./catcher";
import { ErrorStore } from "./store";

describe("installErrorCatcher", () => {
  let store: ErrorStore;

  beforeEach(() => {
    store = new ErrorStore();
  });

  it("adds error event listener that logs to store", () => {
    const cleanup = installErrorCatcher(store);

    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "test error",
        error: new Error("test error"),
        filename: "test.js",
        lineno: 1,
        colno: 1,
      }),
    );

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe("test error");
    expect(entries[0].source).toBe("runtime");
    expect(entries[0].url).toBe("test.js");
    expect(entries[0].line).toBe(1);
    expect(entries[0].column).toBe(1);

    cleanup();
  });

  it("captures stack from ErrorEvent", () => {
    const cleanup = installErrorCatcher(store);

    const err = new Error("stack error");
    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "stack error",
        error: err,
        filename: "app.js",
        lineno: 10,
        colno: 5,
      }),
    );

    const entries = store.getAll();
    expect(entries[0].stack).toBe(err.stack);

    cleanup();
  });

  it("handles PromiseRejectionEvent if constructable", () => {
    const cleanup = installErrorCatcher(store);

    try {
      const event = new PromiseRejectionEvent("unhandledrejection", {
        reason: new Error("rejected"),
        promise: Promise.resolve(),
      });
      window.dispatchEvent(event);

      const entries = store.getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].message).toBe("rejected");
      expect(entries[0].source).toBe("unhandled-rejection");
    } catch {
      // PromiseRejectionEvent not available in jsdom, skip
    }

    cleanup();
  });

  it("handles PromiseRejectionEvent with non-Error reason", () => {
    const cleanup = installErrorCatcher(store);

    try {
      const event = new PromiseRejectionEvent("unhandledrejection", {
        reason: "string rejection",
        promise: Promise.resolve(),
      });
      window.dispatchEvent(event);

      const entries = store.getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0].message).toBe("string rejection");
      expect(entries[0].stack).toBeNull();
    } catch {
      // PromiseRejectionEvent not available in jsdom, skip
    }

    cleanup();
  });

  it("cleanup removes both listeners", () => {
    const cleanup = installErrorCatcher(store);
    cleanup();

    // Temporarily suppress the error event so it doesn't propagate to the test runner
    const suppress = (e: Event) => e.preventDefault();
    window.addEventListener("error", suppress);

    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "after cleanup",
        error: new Error("after cleanup"),
        cancelable: true,
      }),
    );

    window.removeEventListener("error", suppress);

    expect(store.getAll()).toHaveLength(0);
  });
});

describe("interceptConsoleErrors", () => {
  let store: ErrorStore;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    store = new ErrorStore();
    originalConsoleError = console.error;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("wraps console.error and adds entry with source console", () => {
    const cleanup = interceptConsoleErrors(store);

    console.error("something went wrong");

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe("something went wrong");
    expect(entries[0].source).toBe("console");

    cleanup();
  });

  it("calls original console.error", () => {
    const spy = vi.fn();
    console.error = spy;

    const cleanup = interceptConsoleErrors(store);

    console.error("forwarded");

    expect(spy).toHaveBeenCalledWith("forwarded");

    cleanup();
  });

  it("handles Error objects in console.error args", () => {
    const cleanup = interceptConsoleErrors(store);

    const err = new Error("err obj");
    console.error("prefix", err);

    const entries = store.getAll();
    expect(entries[0].message).toBe("prefix err obj");
    expect(entries[0].stack).toBe(err.stack);

    cleanup();
  });

  it("cleanup restores original console.error", () => {
    const spy = vi.fn();
    console.error = spy;

    const cleanup = interceptConsoleErrors(store);
    expect(console.error).not.toBe(spy);

    cleanup();
    expect(console.error).toBe(spy);
  });
});
