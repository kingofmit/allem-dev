import type { ConsoleStore, ConsoleLevel } from "./ConsoleStore";

const LEVELS: ConsoleLevel[] = ["log", "info", "warn", "error", "debug"];

export function interceptConsole(store: ConsoleStore): () => void {
  const originals = new Map<ConsoleLevel, (...args: any[]) => void>();
  let recording = false; // re-entrancy guard

  for (const level of LEVELS) {
    originals.set(level, console[level]);
    console[level] = (...args: any[]) => {
      // Prevent recursive interception (store.add triggers notify → re-render → possible console call)
      if (!recording) {
        recording = true;
        try {
          const message = args.map((a) => {
            if (a instanceof Error) return a.message;
            if (typeof a === "object") try { return JSON.stringify(a); } catch { return String(a); }
            return String(a);
          }).join(" ");

          let stack: string | null = null;
          for (const a of args) {
            if (a instanceof Error && a.stack) { stack = a.stack; break; }
          }
          if (!stack) {
            try { stack = new Error().stack || null; } catch { /* ignore */ }
          }

          store.add({ timestamp: Date.now(), level, args, message, stack });
        } finally {
          recording = false;
        }
      }
      originals.get(level)!.apply(console, args);
    };
  }

  return () => {
    for (const level of LEVELS) {
      console[level] = originals.get(level)!;
    }
  };
}
