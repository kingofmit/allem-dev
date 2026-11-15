import { describe, it, expect, vi } from "vitest";
import { NetworkStore } from "./store";

function makeEntry(overrides: Partial<{
  method: string; url: string; status: number | null; startTime: number;
  endTime: number | null; duration: number | null;
  requestHeaders: Record<string, string>; responseHeaders: Record<string, string>;
  requestBody: unknown; responseBody: unknown; error: string | null;
}> = {}) {
  return {
    method: "GET",
    url: "/api/test",
    status: null,
    startTime: Date.now(),
    endTime: null,
    duration: null,
    requestHeaders: {},
    responseHeaders: {},
    requestBody: null,
    responseBody: null,
    error: null,
    ...overrides,
  };
}

describe("NetworkStore", () => {
  it("add() creates entry with id and adds to store", () => {
    const store = new NetworkStore();
    const entry = store.add(makeEntry());
    expect(entry.id).toMatch(/^ad_/);
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0]).toEqual(entry);
  });

  it("getAll() returns a cached snapshot that is stable between calls", () => {
    const store = new NetworkStore();
    store.add(makeEntry());
    const a = store.getAll();
    const b = store.getAll();
    expect(a).toBe(b); // same reference for useSyncExternalStore
    expect(a).toHaveLength(1);
  });

  it("update() patches existing entry by id", () => {
    const store = new NetworkStore();
    const entry = store.add(makeEntry());
    store.update(entry.id, { status: 200, endTime: Date.now(), duration: 50 });
    const updated = store.getAll()[0];
    expect(updated.status).toBe(200);
    expect(updated.duration).toBe(50);
  });

  it("getCount() returns correct count", () => {
    const store = new NetworkStore();
    expect(store.getCount()).toBe(0);
    store.add(makeEntry());
    store.add(makeEntry());
    expect(store.getCount()).toBe(2);
  });

  it("circular buffer evicts oldest when exceeding maxEntries", () => {
    const store = new NetworkStore(3);
    const first = store.add(makeEntry({ url: "/first" }));
    store.add(makeEntry({ url: "/second" }));
    store.add(makeEntry({ url: "/third" }));
    store.add(makeEntry({ url: "/fourth" }));
    expect(store.getCount()).toBe(3);
    expect(store.getAll().find((e) => e.id === first.id)).toBeUndefined();
    expect(store.getAll()[0].url).toBe("/second");
  });

  it('getByStatus("pending") returns entries with null status', () => {
    const store = new NetworkStore();
    store.add(makeEntry({ status: null }));
    store.add(makeEntry({ status: 200, error: null }));
    expect(store.getByStatus("pending")).toHaveLength(1);
  });

  it('getByStatus("success") returns entries with status < 400 and no error', () => {
    const store = new NetworkStore();
    store.add(makeEntry({ status: 200, error: null }));
    store.add(makeEntry({ status: 301, error: null }));
    store.add(makeEntry({ status: 500, error: null }));
    expect(store.getByStatus("success")).toHaveLength(2);
  });

  it('getByStatus("error") returns entries with status >= 400 or error set', () => {
    const store = new NetworkStore();
    store.add(makeEntry({ status: 500, error: null }));
    store.add(makeEntry({ status: 200, error: "timeout" }));
    store.add(makeEntry({ status: 200, error: null }));
    expect(store.getByStatus("error")).toHaveLength(2);
  });

  it("clear() empties the store", () => {
    const store = new NetworkStore();
    store.add(makeEntry());
    store.add(makeEntry());
    store.clear();
    expect(store.getCount()).toBe(0);
    expect(store.getAll()).toEqual([]);
  });

  it("subscribe() notifies on add, update, and clear", () => {
    const store = new NetworkStore();
    const listener = vi.fn();
    store.subscribe(listener);

    const entry = store.add(makeEntry());
    expect(listener).toHaveBeenCalledTimes(1);

    store.update(entry.id, { status: 200 });
    expect(listener).toHaveBeenCalledTimes(2);

    store.clear();
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("subscribe() returns unsubscribe function", () => {
    const store = new NetworkStore();
    const listener = vi.fn();
    const unsub = store.subscribe(listener);
    unsub();
    store.add(makeEntry());
    expect(listener).not.toHaveBeenCalled();
  });
});
