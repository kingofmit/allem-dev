import { ErrorStore } from "./store";

/** Install global error and unhandled rejection catchers */
export function installErrorCatcher(store: ErrorStore): () => void {
  const onError = (event: ErrorEvent) => {
    store.add({
      timestamp: Date.now(),
      message: event.message,
      stack: event.error?.stack ?? null,
      source: "runtime",
      url: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    const err = event.reason;
    store.add({
      timestamp: Date.now(),
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack ?? null : null,
      source: "unhandled-rejection",
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}

/** Intercept console.error calls */
export function interceptConsoleErrors(store: ErrorStore): () => void {
  const originalError = console.error;
  let recording = false;

  console.error = function (...args: unknown[]) {
    if (!recording) {
      recording = true;
      try {
        const message = args.map((a) => (a instanceof Error ? a.message : String(a))).join(" ");
        const stack = args.find((a) => a instanceof Error) instanceof Error
          ? (args.find((a) => a instanceof Error) as Error).stack ?? null
          : null;

        store.add({
          timestamp: Date.now(),
          message,
          stack,
          source: "console",
        });
      } finally {
        recording = false;
      }
    }

    originalError.apply(console, args);
  };

  return () => { console.error = originalError; };
}
