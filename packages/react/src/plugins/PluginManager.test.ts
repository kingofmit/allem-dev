import { describe, it, expect, vi } from "vitest";
import React from "react";
import { PluginManager, AllemDevPlugin } from "./PluginManager";

function makePlugin(overrides: Partial<AllemDevPlugin> = {}): AllemDevPlugin {
  return {
    id: "test-plugin",
    label: "Test Plugin",
    render: () => React.createElement("div", null, "test"),
    ...overrides,
  };
}

describe("PluginManager", () => {
  it("register() adds plugin and returns unregister function", () => {
    const manager = new PluginManager();
    const unregister = manager.register(makePlugin({ id: "a" }));
    expect(manager.getAll()).toHaveLength(1);
    expect(typeof unregister).toBe("function");
    unregister();
    expect(manager.getAll()).toHaveLength(0);
  });

  it("getAll() returns all registered plugins", () => {
    const manager = new PluginManager();
    manager.register(makePlugin({ id: "a", label: "A" }));
    manager.register(makePlugin({ id: "b", label: "B" }));
    const all = manager.getAll();
    expect(all).toHaveLength(2);
  });

  it("get() returns specific plugin by id", () => {
    const manager = new PluginManager();
    manager.register(makePlugin({ id: "a", label: "Alpha" }));
    const plugin = manager.get("a");
    expect(plugin).toBeDefined();
    expect(plugin!.label).toBe("Alpha");
  });

  it("get() returns undefined for unknown id", () => {
    const manager = new PluginManager();
    expect(manager.get("nonexistent")).toBeUndefined();
  });

  it("unregister() removes plugin", () => {
    const manager = new PluginManager();
    manager.register(makePlugin({ id: "a" }));
    manager.unregister("a");
    expect(manager.getAll()).toHaveLength(0);
    expect(manager.get("a")).toBeUndefined();
  });

  it("duplicate registration is rejected with warning", () => {
    const manager = new PluginManager();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    manager.register(makePlugin({ id: "a" }));
    const unsub = manager.register(makePlugin({ id: "a" }));
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('"a" is already registered'),
    );
    expect(manager.getAll()).toHaveLength(1);
    // returned unregister should be a no-op (does not remove original)
    unsub();
    expect(manager.getAll()).toHaveLength(1);
    warnSpy.mockRestore();
  });

  it("subscribe() notifies on register and unregister", () => {
    const manager = new PluginManager();
    const listener = vi.fn();
    manager.subscribe(listener);
    manager.register(makePlugin({ id: "a" }));
    expect(listener).toHaveBeenCalledTimes(1);
    manager.unregister("a");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("subscribe() returns unsubscribe function", () => {
    const manager = new PluginManager();
    const listener = vi.fn();
    const unsub = manager.subscribe(listener);
    unsub();
    manager.register(makePlugin({ id: "a" }));
    expect(listener).not.toHaveBeenCalled();
  });
});
