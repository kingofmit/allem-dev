import type { MockStore } from "./MockStore";
import type { NetworkStore } from "@allem-dev/network";
import { uid } from "@allem-dev/core";

/**
 * Intercept fetch to check mock rules first.
 * Should be installed BEFORE the network interceptor, so that mocked
 * responses also get logged by the network store.
 */
export function installMockInterceptor(mockStore: MockStore): () => void {
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || "GET";

    const rule = mockStore.findMatch(url, method);
    if (!rule) {
      return originalFetch.call(window, input, init);
    }

    mockStore.incrementHit(rule.id);

    // Simulate delay
    if (rule.delay && rule.delay > 0) {
      await new Promise((r) => setTimeout(r, rule.delay));
    }

    const body = typeof rule.body === "string" ? rule.body : JSON.stringify(rule.body);
    const headers = new Headers(rule.headers || { "content-type": "application/json" });

    return new Response(body, {
      status: rule.status,
      statusText: rule.status === 200 ? "OK (Mocked)" : `${rule.status} (Mocked)`,
      headers,
    });
  };

  return () => {
    window.fetch = originalFetch;
  };
}
