import { describe, it, expect, vi } from "vitest";
import { MockStore } from "./MockStore";

function makeRule(overrides: Partial<{
  urlPattern: string; method: string; status: number;
  headers: Record<string, string>; body: unknown;
  delay: number; enabled: boolean;
}> = {}) {
  return {
    urlPattern: "/api/test",
    status: 200,
    body: { ok: true },
    enabled: true,
    ...overrides,
  };
}

describe("MockStore", () => {
  it("addRule() creates rule with id and hitCount 0", () => {
    const store = new MockStore();
    const rule = store.addRule(makeRule());
    expect(rule.id).toMatch(/^ad_/);
    expect(rule.hitCount).toBe(0);
    expect(store.getRules()).toHaveLength(1);
  });

  it("findMatch() matches by URL substring", () => {
    const store = new MockStore();
    store.addRule(makeRule({ urlPattern: "/api/users" }));
    const match = store.findMatch("http://localhost:3000/api/users/1", "GET");
    expect(match).not.toBeNull();
    expect(match!.urlPattern).toBe("/api/users");
  });

  it("findMatch() matches by regex pattern", () => {
    const store = new MockStore();
    store.addRule(makeRule({ urlPattern: "^https?://.*\\/api\\/users" }));
    const match = store.findMatch("https://example.com/api/users", "GET");
    expect(match).not.toBeNull();
  });

  it("findMatch() respects method filter", () => {
    const store = new MockStore();
    store.addRule(makeRule({ urlPattern: "/api/test", method: "POST" }));
    expect(store.findMatch("/api/test", "GET")).toBeNull();
    expect(store.findMatch("/api/test", "POST")).not.toBeNull();
    expect(store.findMatch("/api/test", "post")).not.toBeNull();
  });

  it("findMatch() skips disabled rules", () => {
    const store = new MockStore();
    store.addRule(makeRule({ urlPattern: "/api/test", enabled: false }));
    expect(store.findMatch("/api/test", "GET")).toBeNull();
  });

  it("toggleRule() toggles enabled", () => {
    const store = new MockStore();
    const rule = store.addRule(makeRule({ enabled: true }));
    store.toggleRule(rule.id);
    expect(store.getRules()[0].enabled).toBe(false);
    store.toggleRule(rule.id);
    expect(store.getRules()[0].enabled).toBe(true);
  });

  it("removeRule() removes the rule", () => {
    const store = new MockStore();
    const rule = store.addRule(makeRule());
    store.removeRule(rule.id);
    expect(store.getCount()).toBe(0);
  });

  it("incrementHit() increases hitCount", () => {
    const store = new MockStore();
    const rule = store.addRule(makeRule());
    store.incrementHit(rule.id);
    store.incrementHit(rule.id);
    expect(store.getRules()[0].hitCount).toBe(2);
  });

  it("subscribe() notifies on mutations", () => {
    const store = new MockStore();
    const listener = vi.fn();
    store.subscribe(listener);
    const rule = store.addRule(makeRule());
    expect(listener).toHaveBeenCalledTimes(1);
    store.toggleRule(rule.id);
    expect(listener).toHaveBeenCalledTimes(2);
    store.removeRule(rule.id);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("clear() removes all rules", () => {
    const store = new MockStore();
    store.addRule(makeRule());
    store.addRule(makeRule());
    store.clear();
    expect(store.getCount()).toBe(0);
  });
});
