import React from "react";
import type { CSSProperties } from "react";
import type { ThemeTokens } from "../theme";

export interface JsonViewerProps {
  data: unknown;
  theme: ThemeTokens;
  maxDepth?: number;
  collapsed?: boolean;
}

/**
 * Render a single value node. `ancestors` is the set of object references
 * on the path from root to the current node — used to detect true circular
 * references. It is never mutated; each branch gets its own copy.
 */
function renderNode(
  data: unknown,
  theme: ThemeTokens,
  depth: number,
  maxDepth: number,
  defaultCollapsed: boolean,
  ancestors: ReadonlySet<object>,
): React.ReactElement {
  if (data === null) {
    return React.createElement("span", { style: { color: theme.textFaint } }, "null");
  }
  if (data === undefined) {
    return React.createElement("span", { style: { color: theme.textFaint } }, "undefined");
  }
  if (typeof data === "string") {
    const display = data.length > 200 ? data.slice(0, 200) + "\u2026" : data;
    return React.createElement("span", { style: { color: theme.success } }, `"${display}"`);
  }
  if (typeof data === "number") {
    return React.createElement("span", { style: { color: "#60a5fa" } }, String(data));
  }
  if (typeof data === "boolean") {
    return React.createElement("span", { style: { color: theme.warning } }, String(data));
  }

  if (typeof data === "object") {
    if (ancestors.has(data)) {
      return React.createElement("span", { style: { color: theme.textFaint, fontStyle: "italic" } }, "[Circular]");
    }

    const isArray = Array.isArray(data);
    const entries = isArray
      ? (data as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(data as Record<string, unknown>);
    const bracket = isArray ? ["[", "]"] : ["{", "}"];
    const summary = isArray ? `Array(${entries.length})` : `Object(${entries.length})`;

    if (depth >= maxDepth) {
      return React.createElement("span", { style: { color: theme.textFaint } }, summary);
    }

    // Create a new set that includes this object for children to check against.
    // This is immutable-style: no mutation during render.
    const childAncestors = new Set(ancestors);
    childAncestors.add(data);

    return React.createElement(CollapsibleNode, {
      entries,
      bracket,
      summary,
      theme,
      depth,
      maxDepth,
      defaultCollapsed,
      ancestors: childAncestors,
      isArray,
    });
  }

  return React.createElement("span", { style: { color: theme.textFaint } }, String(data));
}

interface CollapsibleNodeProps {
  entries: [string, unknown][];
  bracket: string[];
  summary: string;
  theme: ThemeTokens;
  depth: number;
  maxDepth: number;
  defaultCollapsed: boolean;
  ancestors: ReadonlySet<object>;
  isArray: boolean;
}

function CollapsibleNode({
  entries,
  bracket,
  summary,
  theme,
  depth,
  maxDepth,
  defaultCollapsed,
  ancestors,
  isArray,
}: CollapsibleNodeProps): React.ReactElement {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  const toggleStyle: CSSProperties = {
    cursor: "pointer",
    userSelect: "none",
    background: "none",
    border: "none",
    color: theme.textMuted,
    padding: 0,
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
    fontSize: 11,
  };

  if (collapsed) {
    return React.createElement(
      "span",
      null,
      React.createElement(
        "button",
        { type: "button" as const, style: toggleStyle, onClick: () => setCollapsed(false) },
        "\u25b6 "
      ),
      React.createElement("span", { style: { color: theme.textFaint } }, `${bracket[0]} ${summary} ${bracket[1]}`)
    );
  }

  const childrenEls = entries.map(([key, val], i) =>
    React.createElement(
      "div",
      { key, style: { marginLeft: 16 } as CSSProperties },
      !isArray
        ? React.createElement("span", { style: { color: theme.text } }, `${key}: `)
        : null,
      renderNode(val, theme, depth + 1, maxDepth, defaultCollapsed, ancestors),
      i < entries.length - 1 ? "," : null
    )
  );

  return React.createElement(
    "span",
    null,
    React.createElement(
      "button",
      { type: "button" as const, style: toggleStyle, onClick: () => setCollapsed(true) },
      "\u25bc "
    ),
    bracket[0],
    React.createElement("div", null, ...childrenEls),
    bracket[1]
  );
}

export function JsonViewer({ data, theme, maxDepth = 4, collapsed = false }: JsonViewerProps): React.ReactElement {
  const containerStyle: CSSProperties = {
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
    fontSize: 11,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  };

  return React.createElement(
    "div",
    { style: containerStyle },
    renderNode(data, theme, 0, maxDepth, collapsed, new Set<object>())
  );
}
