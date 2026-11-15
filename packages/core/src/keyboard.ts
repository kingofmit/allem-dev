/** Parse a shortcut string like "ctrl+shift+d" into key parts */
export function parseShortcut(shortcut: string): { key: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } {
  const parts = shortcut.toLowerCase().split("+");
  return {
    key: parts[parts.length - 1],
    ctrl: parts.includes("ctrl"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
    meta: parts.includes("meta") || parts.includes("cmd"),
  };
}

/** Check if a keyboard event matches a shortcut */
export function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parsed = parseShortcut(shortcut);
  return (
    event.key.toLowerCase() === parsed.key &&
    event.ctrlKey === parsed.ctrl &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt &&
    event.metaKey === parsed.meta
  );
}

/** Register a global keyboard shortcut */
export function registerShortcut(shortcut: string, callback: () => void): () => void {
  const handler = (e: KeyboardEvent) => {
    if (matchesShortcut(e, shortcut)) {
      e.preventDefault();
      callback();
    }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}
