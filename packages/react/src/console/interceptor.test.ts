import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { interceptConsole } from "./interceptor";
import { ConsoleStore, ConsoleLevel } from "./ConsoleStore";

const LEVELS: ConsoleLevel[] = ["log", "info", "warn", "error", "debug"];

describe("interceptConsole", () => {
  let store: ConsoleStore;
  const originals: Record<string, (...args: any[]) => void> = {};

  beforeEach(() => {
    store = new ConsoleStore();
    for (const level of LEVELS) {
      originals[level] = console[level];
    }
  });

  afterEach(() => {
    for (const level of LEVELS) {
      console[level] = originals[level];
    }
  });

  it("intercepts console.log and adds entry with level log", () => {
    const cleanup = interceptConsole(store);

    console.log("hello");

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe("log");
    expect(entries[0].message).toBe("hello");

    cleanup();
  });

  it("intercepts console.info and adds entry with level info", () => {
    const cleanup = interceptConsole(store);

    console.info("info message");

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe("info");
    expect(entries[0].message).toBe("info message");

    cleanup();
  });

  it("intercepts console.warn and adds entry with level warn", () => {
    const cleanup = interceptConsole(store);

    console.warn("warning");

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe("warn");
    expect(entries[0].message).toBe("warning");

    cleanup();
  });

  it("intercepts console.error and adds entry with level error", () => {
    const cleanup = interceptConsole(store);

    console.error("error msg");

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe("error");
    expect(entries[0].message).toBe("error msg");

    cleanup();
  });

  it("intercepts console.debug and adds entry with level debug", () => {
    const cleanup = interceptConsole(store);

    console.debug("debug msg");

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe("debug");
    expect(entries[0].message).toBe("debug msg");

    cleanup();
  });

  it("builds message from multiple args", () => {
    const cleanup = interceptConsole(store);

    console.log("a", 1, true);

    const entries = store.getAll();
    expect(entries[0].message).toBe("a 1 true");

    cleanup();
  });

  it("serializes object args as JSON", () => {
    const cleanup = interceptConsole(store);

    console.log({ key: "value" });

    const entries = store.getAll();
    expect(entries[0].message).toBe('{"key":"value"}');

    cleanup();
  });

  it("extracts Error message from Error args", () => {
    const cleanup = interceptConsole(store);

    console.error(new Error("err"));

    const entries = store.getAll();
    expect(entries[0].message).toBe("err");

    cleanup();
  });

  it("still calls original console methods", () => {
    const spies: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const level of LEVELS) {
      spies[level] = vi.fn();
      console[level] = spies[level];
    }

    const cleanup = interceptConsole(store);

    for (const level of LEVELS) {
      console[level](`${level} test`);
    }

    for (const level of LEVELS) {
      expect(spies[level]).toHaveBeenCalledWith(`${level} test`);
    }

    cleanup();
  });

  it("cleanup restores all original methods", () => {
    const spies: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const level of LEVELS) {
      spies[level] = vi.fn();
      console[level] = spies[level];
    }

    const cleanup = interceptConsole(store);

    for (const level of LEVELS) {
      expect(console[level]).not.toBe(spies[level]);
    }

    cleanup();

    for (const level of LEVELS) {
      expect(console[level]).toBe(spies[level]);
    }
  });

  it("stores args array on entry", () => {
    const cleanup = interceptConsole(store);

    console.log("a", 42);

    const entries = store.getAll();
    expect(entries[0].args).toEqual(["a", 42]);

    cleanup();
  });
});
