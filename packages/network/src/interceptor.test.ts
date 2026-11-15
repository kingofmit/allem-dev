import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { interceptFetch, interceptXHR } from "./interceptor";
import { NetworkStore } from "./store";

describe("interceptFetch", () => {
  let store: NetworkStore;
  let originalFetch: typeof window.fetch;

  beforeEach(() => {
    store = new NetworkStore();
    originalFetch = window.fetch;
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  it("wraps window.fetch and logs requests to store", async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    window.fetch = vi.fn().mockResolvedValue(mockResponse);

    const cleanup = interceptFetch(store);

    await window.fetch("https://example.com/api");

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe("https://example.com/api");

    cleanup();
  });

  it("captures method, url, status, and duration", async () => {
    const mockResponse = new Response("ok", {
      status: 201,
      headers: { "content-type": "text/plain" },
    });
    window.fetch = vi.fn().mockResolvedValue(mockResponse);

    const cleanup = interceptFetch(store);

    await window.fetch("https://example.com/create", { method: "POST" });

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].method).toBe("POST");
    expect(entries[0].url).toBe("https://example.com/create");
    expect(entries[0].status).toBe(201);
    expect(entries[0].duration).toBeTypeOf("number");
    expect(entries[0].duration).toBeGreaterThanOrEqual(0);

    cleanup();
  });

  it("handles JSON responses and parses responseBody", async () => {
    const payload = { data: [1, 2, 3] };
    const mockResponse = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    window.fetch = vi.fn().mockResolvedValue(mockResponse);

    const cleanup = interceptFetch(store);

    await window.fetch("https://example.com/json");

    const entries = store.getAll();
    expect(entries[0].responseBody).toEqual(payload);

    cleanup();
  });

  it("handles text responses", async () => {
    const mockResponse = new Response("hello world", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
    window.fetch = vi.fn().mockResolvedValue(mockResponse);

    const cleanup = interceptFetch(store);

    await window.fetch("https://example.com/text");

    const entries = store.getAll();
    expect(entries[0].responseBody).toBe("hello world");

    cleanup();
  });

  it("handles fetch errors (sets status=0 and error message)", async () => {
    window.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

    const cleanup = interceptFetch(store);

    await expect(window.fetch("https://example.com/fail")).rejects.toThrow("Network failure");

    const entries = store.getAll();
    expect(entries).toHaveLength(1);
    expect(entries[0].status).toBe(0);
    expect(entries[0].error).toBe("Network failure");

    cleanup();
  });

  it("cleanup restores original fetch", () => {
    const mockResponse = new Response("ok", { status: 200 });
    const mockFetch = vi.fn().mockResolvedValue(mockResponse);
    window.fetch = mockFetch;

    const cleanup = interceptFetch(store);
    expect(window.fetch).not.toBe(mockFetch);

    cleanup();
    expect(window.fetch).toBe(mockFetch);
  });

  it("defaults method to GET when not specified", async () => {
    const mockResponse = new Response("ok", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
    window.fetch = vi.fn().mockResolvedValue(mockResponse);

    const cleanup = interceptFetch(store);

    await window.fetch("https://example.com/get");

    const entries = store.getAll();
    expect(entries[0].method).toBe("GET");

    cleanup();
  });
});

describe("interceptXHR", () => {
  let store: NetworkStore;
  let OriginalXHR: typeof XMLHttpRequest;

  beforeEach(() => {
    store = new NetworkStore();
    OriginalXHR = window.XMLHttpRequest;
  });

  afterEach(() => {
    // Restore in case cleanup was not called
    window.XMLHttpRequest.prototype.open = OriginalXHR.prototype.open;
    window.XMLHttpRequest.prototype.send = OriginalXHR.prototype.send;
  });

  it("patches XMLHttpRequest.prototype.open and send", () => {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    const cleanup = interceptXHR(store);

    expect(XMLHttpRequest.prototype.open).not.toBe(origOpen);
    expect(XMLHttpRequest.prototype.send).not.toBe(origSend);

    cleanup();
  });

  it("cleanup restores original prototypes", () => {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    const cleanup = interceptXHR(store);
    cleanup();

    expect(XMLHttpRequest.prototype.open).toBe(origOpen);
    expect(XMLHttpRequest.prototype.send).toBe(origSend);
  });
});

describe("extractHeaders (tested indirectly via interceptFetch)", () => {
  let store: NetworkStore;
  let originalFetch: typeof window.fetch;

  beforeEach(() => {
    store = new NetworkStore();
    originalFetch = window.fetch;
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  it("normalizes object-format headers into request entry", async () => {
    const mockResponse = new Response("ok", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
    window.fetch = vi.fn().mockResolvedValue(mockResponse);

    const cleanup = interceptFetch(store);

    await window.fetch("https://example.com/h", {
      headers: { Authorization: "Bearer token", Accept: "application/json" },
    });

    const entries = store.getAll();
    expect(entries[0].requestHeaders).toEqual({
      Authorization: "Bearer token",
      Accept: "application/json",
    });

    cleanup();
  });

  it("handles empty/null headers", async () => {
    const mockResponse = new Response("ok", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
    window.fetch = vi.fn().mockResolvedValue(mockResponse);

    const cleanup = interceptFetch(store);

    await window.fetch("https://example.com/no-headers");

    const entries = store.getAll();
    expect(entries[0].requestHeaders).toEqual({});

    cleanup();
  });
});
