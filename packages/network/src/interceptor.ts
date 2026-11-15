import { NetworkEntry, uid, now } from "@allem-dev/core";
import { NetworkStore } from "./store";

/** Intercept all fetch() calls and log them */
export function interceptFetch(store: NetworkStore): () => void {
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method?.toUpperCase() ?? "GET";
    const startTime = now();
    const id = uid();

    const entry = store.add({
      method,
      url,
      status: null,
      startTime,
      endTime: null,
      duration: null,
      requestHeaders: extractHeaders(init?.headers),
      responseHeaders: {},
      requestBody: init?.body ?? null,
      responseBody: null,
      error: null,
    });

    try {
      const response = await originalFetch.call(window, input, init);
      const endTime = now();
      const cloned = response.clone();
      let responseBody: unknown = null;
      try {
        const contentType = response.headers.get("content-type") ?? "";
        if (contentType.includes("json")) {
          responseBody = await cloned.json();
        } else if (contentType.includes("text")) {
          responseBody = await cloned.text();
        }
      } catch {
        // ignore body parse errors
      }

      store.update(entry.id, {
        status: response.status,
        endTime,
        duration: endTime - startTime,
        responseHeaders: extractHeaders(response.headers),
        responseBody,
      });

      return response;
    } catch (err) {
      const endTime = now();
      store.update(entry.id, {
        status: 0,
        endTime,
        duration: endTime - startTime,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  };

  return () => { window.fetch = originalFetch; };
}

/** Intercept XMLHttpRequest and log requests */
export function interceptXHR(store: NetworkStore): () => void {
  const OriginalXHR = window.XMLHttpRequest;
  const originalOpen = OriginalXHR.prototype.open;
  const originalSend = OriginalXHR.prototype.send;

  OriginalXHR.prototype.open = function (method: string, url: string | URL) {
    (this as any).__allemDev = { method: method.toUpperCase(), url: String(url) };
    return originalOpen.apply(this, arguments as any);
  };

  OriginalXHR.prototype.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
    const meta = (this as any).__allemDev;
    if (!meta) return originalSend.apply(this, arguments as any);

    const startTime = now();
    const entry = store.add({
      method: meta.method,
      url: meta.url,
      status: null,
      startTime,
      endTime: null,
      duration: null,
      requestHeaders: {},
      responseHeaders: {},
      requestBody: body ?? null,
      responseBody: null,
      error: null,
    });

    this.addEventListener("load", () => {
      const endTime = now();
      store.update(entry.id, {
        status: this.status,
        endTime,
        duration: endTime - startTime,
        responseBody: this.responseText,
      });
    });

    this.addEventListener("error", () => {
      const endTime = now();
      store.update(entry.id, {
        status: 0,
        endTime,
        duration: endTime - startTime,
        error: "Network error",
      });
    });

    return originalSend.apply(this, arguments as any);
  };

  return () => {
    OriginalXHR.prototype.open = originalOpen;
    OriginalXHR.prototype.send = originalSend;
  };
}

function extractHeaders(headers?: HeadersInit | Headers): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => { result[key] = value; });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => { result[key] = value; });
  } else {
    Object.assign(result, headers);
  }
  return result;
}
