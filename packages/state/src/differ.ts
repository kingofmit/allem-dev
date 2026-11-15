export interface DiffResult {
  type: "added" | "removed" | "changed" | "unchanged";
  path: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/** Shallow diff between two values */
export function shallowDiff(prev: unknown, next: unknown, path = ""): DiffResult[] {
  if (Object.is(prev, next)) return [{ type: "unchanged", path: path || "(root)" }];
  if (prev === null || next === null || typeof prev !== "object" || typeof next !== "object") {
    return [{ type: "changed", path: path || "(root)", oldValue: prev, newValue: next }];
  }

  const results: DiffResult[] = [];
  const prevObj = prev as Record<string, unknown>;
  const nextObj = next as Record<string, unknown>;
  const allKeys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)]);

  for (const key of allKeys) {
    const fullPath = path ? `${path}.${key}` : key;
    if (!(key in prevObj)) {
      results.push({ type: "added", path: fullPath, newValue: nextObj[key] });
    } else if (!(key in nextObj)) {
      results.push({ type: "removed", path: fullPath, oldValue: prevObj[key] });
    } else if (!Object.is(prevObj[key], nextObj[key])) {
      results.push({ type: "changed", path: fullPath, oldValue: prevObj[key], newValue: nextObj[key] });
    }
  }

  return results.length > 0 ? results : [{ type: "unchanged", path: path || "(root)" }];
}
