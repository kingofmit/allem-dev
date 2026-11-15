import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { installMockInterceptor } from "./mockInterceptor";
import { MockStore } from "./MockStore";

describe("installMockInterceptor", () => {
  let mockStore: MockStore;
  let originalFetch: typeof window.fetch;

  beforeEach(() => {
    mockStore = new MockStore();
    originalFetch = window.fetch;
  });

  afterEach(() => {
    window.fetch = originalFetch;
  });

  it("calls original fetch when no matching rule", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("real"));
    window.fetch = mockFetch;

    const cleanup = installMockInterceptor(mockStore);

    const response = await window.fetch("https://example.com/no-match");
    expect(await response.text()).toBe("real");
    expect(mockFetch).toHaveBeenCalled();

    cleanup();
  });

  it("returns mocked response when matching rule exists", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("real"));
    window.fetch = mockFetch;

    mockStore.addRule({
      urlPattern: "/api/users",
      status: 200,
      body: { users: [] },
      enabled: true,
    });

    const cleanup = installMockInterceptor(mockStore);

    const response = await window.fetch("https://example.com/api/users");
    const body = await response.json();

    expect(body).toEqual({ users: [] });
    expect(response.status).toBe(200);
    expect(mockFetch).not.toHaveBeenCalled();

    cleanup();
  });

  it("mocked response has correct status", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("real"));
    window.fetch = mockFetch;

    mockStore.addRule({
      urlPattern: "/api/error",
      status: 500,
      body: { error: "server error" },
      enabled: true,
    });

    const cleanup = installMockInterceptor(mockStore);

    const response = await window.fetch("https://example.com/api/error");
    expect(response.status).toBe(500);

    cleanup();
  });

  it("mocked response has correct body for string body", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("real"));
    window.fetch = mockFetch;

    mockStore.addRule({
      urlPattern: "/api/text",
      status: 200,
      body: "plain text response",
      enabled: true,
    });

    const cleanup = installMockInterceptor(mockStore);

    const response = await window.fetch("https://example.com/api/text");
    expect(await response.text()).toBe("plain text response");

    cleanup();
  });

  it("applies mock delay", async () => {
    vi.useFakeTimers();

    const mockFetch = vi.fn().mockResolvedValue(new Response("real"));
    window.fetch = mockFetch;

    mockStore.addRule({
      urlPattern: "/api/slow",
      status: 200,
      body: { ok: true },
      delay: 500,
      enabled: true,
    });

    const cleanup = installMockInterceptor(mockStore);

    const fetchPromise = window.fetch("https://example.com/api/slow");
    let resolved = false;
    fetchPromise.then(() => { resolved = true; });

    // Should not resolve before delay
    await vi.advanceTimersByTimeAsync(100);
    expect(resolved).toBe(false);

    // Should resolve after delay
    await vi.advanceTimersByTimeAsync(400);
    expect(resolved).toBe(true);

    const response = await fetchPromise;
    expect(response.status).toBe(200);

    cleanup();
    vi.useRealTimers();
  });

  it("cleanup restores original fetch", () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("real"));
    window.fetch = mockFetch;

    const cleanup = installMockInterceptor(mockStore);
    expect(window.fetch).not.toBe(mockFetch);

    cleanup();
    expect(window.fetch).toBe(mockFetch);
  });

  it("increments rule hitCount on match", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("real"));
    window.fetch = mockFetch;

    const rule = mockStore.addRule({
      urlPattern: "/api/hit",
      status: 200,
      body: { ok: true },
      enabled: true,
    });

    const cleanup = installMockInterceptor(mockStore);

    await window.fetch("https://example.com/api/hit");
    await window.fetch("https://example.com/api/hit");

    const rules = mockStore.getRules();
    const updated = rules.find((r) => r.id === rule.id);
    expect(updated!.hitCount).toBe(2);

    cleanup();
  });

  it("does not match disabled rules", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("real"));
    window.fetch = mockFetch;

    mockStore.addRule({
      urlPattern: "/api/disabled",
      status: 200,
      body: { mocked: true },
      enabled: false,
    });

    const cleanup = installMockInterceptor(mockStore);

    const response = await window.fetch("https://example.com/api/disabled");
    expect(await response.text()).toBe("real");
    expect(mockFetch).toHaveBeenCalled();

    cleanup();
  });

  it("matches by method when specified", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("real"));
    window.fetch = mockFetch;

    mockStore.addRule({
      urlPattern: "/api/post-only",
      method: "POST",
      status: 201,
      body: { created: true },
      enabled: true,
    });

    const cleanup = installMockInterceptor(mockStore);

    // GET should not match
    const getResponse = await window.fetch("https://example.com/api/post-only");
    expect(await getResponse.text()).toBe("real");

    mockFetch.mockClear();

    // POST should match
    const postResponse = await window.fetch("https://example.com/api/post-only", {
      method: "POST",
    });
    expect(postResponse.status).toBe(201);
    expect(mockFetch).not.toHaveBeenCalled();

    cleanup();
  });
});
