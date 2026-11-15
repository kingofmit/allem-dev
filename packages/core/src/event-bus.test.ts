import { describe, it, expect, vi } from "vitest";
import { EventBus } from "./event-bus";

describe("EventBus", () => {
  it("on() registers listener and returns unsubscribe", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    const unsub = bus.on("test", cb);

    expect(typeof unsub).toBe("function");

    bus.emit("test", "data");
    expect(cb).toHaveBeenCalledWith("data");
  });

  it("emit() calls all registered listeners for that event", () => {
    const bus = new EventBus();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.on("evt", cb1);
    bus.on("evt", cb2);

    bus.emit("evt", 42);

    expect(cb1).toHaveBeenCalledWith(42);
    expect(cb2).toHaveBeenCalledWith(42);
  });

  it("emit() doesn't call listeners for other events", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    bus.on("a", cb);

    bus.emit("b", "payload");

    expect(cb).not.toHaveBeenCalled();
  });

  it("unsubscribed listeners are not called", () => {
    const bus = new EventBus();
    const cb = vi.fn();
    const unsub = bus.on("evt", cb);

    bus.emit("evt", 1);
    expect(cb).toHaveBeenCalledTimes(1);

    unsub();
    bus.emit("evt", 2);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("clear() removes all listeners", () => {
    const bus = new EventBus();
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    bus.on("a", cb1);
    bus.on("b", cb2);

    bus.clear();

    bus.emit("a", null);
    bus.emit("b", null);
    expect(cb1).not.toHaveBeenCalled();
    expect(cb2).not.toHaveBeenCalled();
  });
});
