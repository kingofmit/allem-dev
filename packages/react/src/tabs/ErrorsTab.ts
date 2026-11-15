import React from "react";
import type { CSSProperties } from "react";
import type { ErrorEntry } from "@allem-dev/core";
import { timeAgo } from "@allem-dev/core";
import { parseStack } from "@allem-dev/errors";
import type { StackFrame } from "@allem-dev/errors";
import { AlertTriangle, Link2Off, Shield, Terminal } from "lucide-react";
import { useAllemDevCtx } from "../context";
import { badgeStyle, monoText } from "../theme";
import { useThrottledStore } from "../hooks/useThrottledStore";
import { FilterBar } from "../primitives/FilterBar";
import type { FilterItem } from "../primitives/FilterBar";
import { ScrollList } from "../primitives/ScrollList";
import { ExpandableRow } from "../primitives/ExpandableRow";
import { CopyButton } from "../primitives/CopyButton";

/* ---------- constants ---------- */

const SOURCE_FILTERS = ["runtime", "unhandled-rejection", "boundary", "console"] as const;

const SOURCE_COLORS: Record<string, string> = {
  runtime: "#60a5fa",
  "unhandled-rejection": "#f59e0b",
  boundary: "#ef4444",
  console: "#eab308",
};

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "\u2026" : s;
}

/* ---------- grouped entry type ---------- */

interface GroupedError {
  key: string;
  entry: ErrorEntry;
  count: number;
  all: ErrorEntry[];
}

function groupErrors(entries: ErrorEntry[]): GroupedError[] {
  const map = new Map<string, ErrorEntry[]>();
  for (const e of entries) {
    const existing = map.get(e.message);
    if (existing) {
      existing.push(e);
    } else {
      map.set(e.message, [e]);
    }
  }
  const groups: GroupedError[] = [];
  for (const [key, all] of map) {
    groups.push({ key, entry: all[0], count: all.length, all });
  }
  // newest group first (by latest entry timestamp)
  groups.sort((a, b) => {
    const aLatest = a.all[a.all.length - 1].timestamp;
    const bLatest = b.all[b.all.length - 1].timestamp;
    return bLatest - aLatest;
  });
  return groups;
}

/* ---------- StackFrameView ---------- */

function StackFrameView({ frame, theme }: { frame: StackFrame; theme: ReturnType<typeof useAllemDevCtx>["theme"] }): React.ReactElement {
  const fnName = frame.functionName ?? "<anonymous>";
  const hasLocation = frame.fileName && frame.lineNumber != null;

  const locationText = hasLocation
    ? `${frame.fileName}:${frame.lineNumber}${frame.columnNumber != null ? `:${frame.columnNumber}` : ""}`
    : frame.fileName ?? "";

  const href =
    hasLocation && frame.fileName
      ? `vscode://file/${frame.fileName}:${frame.lineNumber}${frame.columnNumber != null ? `:${frame.columnNumber}` : ""}`
      : null;

  return React.createElement(
    "div",
    { style: { display: "flex", gap: 8, fontSize: 11, lineHeight: 1.8, ...monoText() } as CSSProperties },
    React.createElement("span", { style: { color: theme.text } as CSSProperties }, fnName),
    href
      ? React.createElement(
          "a",
          {
            href,
            style: { color: theme.accent, textDecoration: "none" } as CSSProperties,
          },
          locationText
        )
      : React.createElement("span", { style: { color: theme.textFaint } as CSSProperties }, locationText)
  );
}

/* ---------- ErrorRow ---------- */

function ErrorRow({ group }: { group: GroupedError }): React.ReactElement {
  const { theme } = useAllemDevCtx();
  const { entry, count } = group;

  const sourceColor = SOURCE_COLORS[entry.source] ?? theme.textMuted;

  const header = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flex: 1,
        minWidth: 0,
        height: 36,
        ...monoText(),
      } as CSSProperties,
    },
    React.createElement(
      "span",
      { style: { ...badgeStyle(sourceColor), fontSize: 9, minWidth: 48, textAlign: "center", display: "inline-flex", alignItems: "center", gap: 3 } as CSSProperties },
      entry.source === "runtime" ? React.createElement(AlertTriangle, { size: 12 })
        : entry.source === "unhandled-rejection" ? React.createElement(Link2Off, { size: 12 })
        : entry.source === "boundary" ? React.createElement(Shield, { size: 12 })
        : entry.source === "console" ? React.createElement(Terminal, { size: 12 })
        : null,
      entry.source
    ),
    React.createElement(
      "span",
      { style: { color: theme.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as CSSProperties },
      truncate(entry.message, 80)
    ),
    React.createElement("span", { style: { color: theme.textFaint, flexShrink: 0, fontSize: 10 } as CSSProperties }, timeAgo(entry.timestamp)),
    count > 1
      ? React.createElement(
          "span",
          { style: { ...badgeStyle(theme.error), fontSize: 10 } as CSSProperties },
          String(count)
        )
      : null
  );

  /* expanded detail */
  const frames = entry.stack ? parseStack(entry.stack) : [];

  const expanded = React.createElement(
    "div",
    {
      style: {
        padding: "8px 12px 8px 24px",
        background: theme.bgAlt,
        borderBottom: `1px solid ${theme.borderLight}`,
      } as CSSProperties,
    },
    /* full message */
    React.createElement(
      "div",
      { style: { color: theme.text, fontSize: 12, marginBottom: 8, whiteSpace: "pre-wrap", wordBreak: "break-word" } as CSSProperties },
      entry.message
    ),
    /* stack frames */
    frames.length > 0
      ? React.createElement(
          "div",
          { style: { marginBottom: 8 } as CSSProperties },
          React.createElement("div", { style: { color: theme.textMuted, fontSize: 10, marginBottom: 4, fontWeight: "bold" } as CSSProperties }, "Stack Trace"),
          ...frames.map((f, i) =>
            React.createElement(StackFrameView, { key: i, frame: f, theme })
          )
        )
      : null,
    /* component stack */
    entry.componentStack
      ? React.createElement(
          "div",
          { style: { marginBottom: 8 } as CSSProperties },
          React.createElement("div", { style: { color: theme.textMuted, fontSize: 10, marginBottom: 4, fontWeight: "bold" } as CSSProperties }, "Component Stack"),
          React.createElement(
            "pre",
            {
              style: {
                color: theme.textFaint,
                fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
                fontSize: 11,
                whiteSpace: "pre-wrap",
                margin: 0,
              } as CSSProperties,
            },
            entry.componentStack
          )
        )
      : null,
    /* copy raw stack */
    entry.stack
      ? React.createElement(
          "div",
          { style: { marginTop: 4 } as CSSProperties },
          React.createElement(CopyButton, { text: entry.stack, label: "Copy Stack", theme })
        )
      : null
  );

  return React.createElement(ExpandableRow, { header, children: expanded });
}

/* ---------- ErrorsTab (default export) ---------- */

function ErrorsTab(): React.ReactElement {
  const ctx = useAllemDevCtx();
  const { theme } = ctx;

  const allEntries = useThrottledStore(
    ctx.errors.subscribe,
    ctx.errors.getAll,
  );

  const [activeSourceFilters, setActiveSourceFilters] = React.useState<Set<string>>(new Set());

  const toggleSource = React.useCallback((id: string) => {
    setActiveSourceFilters((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const sourceFilters: FilterItem[] = SOURCE_FILTERS.map((s) => ({
    id: s,
    label: s,
    active: activeSourceFilters.has(s),
  }));

  const groups = React.useMemo(() => {
    const filtered =
      activeSourceFilters.size === 0
        ? allEntries
        : allEntries.filter((e) => activeSourceFilters.has(e.source));
    return groupErrors(filtered);
  }, [allEntries, activeSourceFilters]);

  const handleClear = React.useCallback(() => {
    ctx.errors.clear();
  }, [ctx.errors]);

  /* top bar */
  const topBar = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "8px 8px 4px 8px",
        borderBottom: `1px solid ${theme.border}`,
      } as CSSProperties,
    },
    React.createElement(
      "div",
      { style: { flex: 1 } as CSSProperties },
      React.createElement(FilterBar, { filters: sourceFilters, onToggle: toggleSource, theme })
    ),
    React.createElement(
      "button",
      {
        type: "button" as const,
        onClick: handleClear,
        style: {
          background: "none",
          border: `1px solid ${theme.border}`,
          color: theme.textMuted,
          cursor: "pointer",
          padding: "4px 10px",
          borderRadius: 4,
          fontSize: 11,
          fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
          flexShrink: 0,
        } as CSSProperties,
      },
      "Clear"
    )
  );

  const renderRow = React.useCallback(
    (group: GroupedError) => React.createElement(ErrorRow, { group, key: group.key }),
    []
  );

  return React.createElement(
    "div",
    { style: { display: "flex", flexDirection: "column", height: "100%" } as CSSProperties },
    topBar,
    React.createElement(
      "div",
      { style: { flex: 1, minHeight: 0 } as CSSProperties },
      groups.length === 0
        ? React.createElement(
            "div",
            { style: { color: theme.textFaint, textAlign: "center", paddingTop: 40, fontSize: 12 } as CSSProperties },
            "No errors captured. Runtime errors, unhandled rejections, and console.error calls will appear here."
          )
        : React.createElement(ScrollList, {
            items: groups,
            renderRow,
            height: "100%",
          })
    )
  );
}

export default ErrorsTab;
