import React from "react";
import type { CSSProperties } from "react";
import type { ThemeTokens } from "../theme";

export interface JsonViewerProps {
  data: unknown;
  theme: ThemeTokens;
  maxDepth?: number;
  collapsed?: boolean;
}

function renderNode(
  data: unknown,
  theme: ThemeTokens,
  depth: number,
  maxDepth: number,
  defaultCollapsed: boolean,
  seen: WeakSet<object>
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
    if (seen.has(data)) {
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

    // Add to seen for circular detection in descendants only.
    // The seen set is mutated here; this is safe because renderNode is called
    // synchronously during render and each object only appears once in a
    // non-circular tree. For true circular refs, the check above catches it.
    seen.add(data);

    return React.createElement(CollapsibleNode, {
      entries,
      bracket,
      summary,
      theme,
      depth,
      maxDepth,
      defaultCollapsed,
      seen,
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
  seen: WeakSet<object>;
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
  seen,
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
      renderNode(val, theme, depth + 1, maxDepth, defaultCollapsed, seen),
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
  // Fresh WeakSet per render — must not persist across renders or the same
  // object would be flagged as circular on re-render.
  const seen = new WeakSet<object>();

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
    renderNode(data, theme, 0, maxDepth, collapsed, seen)
  );
}
