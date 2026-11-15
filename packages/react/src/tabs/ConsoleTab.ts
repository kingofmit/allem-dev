import React from "react";
import type { CSSProperties } from "react";
import { Info, AlertTriangle, XCircle, Bug, MessageSquare } from "lucide-react";
import type { ConsoleEntry, ConsoleLevel, ConsoleStore } from "../console/ConsoleStore";
import { useAllemDevCtx } from "../context";
import { badgeStyle, monoText } from "../theme";

const LEVEL_ICONS: Record<ConsoleLevel, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  log: MessageSquare,
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
  debug: Bug,
};
import { useThrottledStore } from "../hooks/useThrottledStore";
import { FilterBar } from "../primitives/FilterBar";
import type { FilterItem } from "../primitives/FilterBar";
import { SearchInput } from "../primitives/SearchInput";
import { ScrollList } from "../primitives/ScrollList";
import { ExpandableRow } from "../primitives/ExpandableRow";
import { JsonViewer } from "../primitives/JsonViewer";

/* ---------- constants ---------- */

const LEVEL_FILTERS: ConsoleLevel[] = ["log", "info", "warn", "error", "debug"];

const LEVEL_COLORS: Record<ConsoleLevel, (theme: any) => string> = {
  log: (t) => t.textMuted,
  info: (t) => t.accent,
  warn: (t) => t.warning,
  error: (t) => t.error,
  debug: (t) => t.textFaint,
};

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "\u2026" : s;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  const ms = String(d.getMilliseconds()).padStart(3, "0");
  return `${h}:${m}:${s}.${ms}`;
}

/* ---------- ConsoleRow ---------- */

function ConsoleRow({ entry }: { entry: ConsoleEntry }): React.ReactElement {
  const { theme } = useAllemDevCtx();
  const levelColor = LEVEL_COLORS[entry.level](theme);

  const header = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flex: 1,
        minWidth: 0,
        height: 28,
        ...monoText(),
      } as CSSProperties,
    },
    React.createElement(
      "span",
      {
        style: {
          ...badgeStyle(levelColor),
          fontSize: 9,
          minWidth: 36,
          textAlign: "center",
          textTransform: "uppercase",
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
        } as CSSProperties,
      },
      React.createElement(LEVEL_ICONS[entry.level], { size: 11, strokeWidth: 2 }),
      entry.level
    ),
    React.createElement(
      "span",
      {
        style: {
          color: theme.textFaint,
          fontSize: 10,
          flexShrink: 0,
        } as CSSProperties,
      },
      formatTime(entry.timestamp)
    ),
    React.createElement(
      "span",
      {
        style: {
          color: theme.text,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          wordBreak: "break-word",
        } as CSSProperties,
      },
      truncate(entry.message, 100)
    )
  );

  /* expanded detail */
  const expanded = React.createElement(
    "div",
    {
      style: {
        padding: "8px 12px 8px 24px",
        background: theme.bgAlt,
        borderBottom: `1px solid ${theme.borderLight}`,
      } as CSSProperties,
    },
    /* full args rendered via JsonViewer */
    React.createElement(
      "div",
      {
        style: {
          color: theme.textMuted,
          fontSize: 10,
          marginBottom: 4,
          fontWeight: "bold",
        } as CSSProperties,
      },
      "Arguments"
    ),
    ...entry.args.map((arg, i) =>
      React.createElement(
        "div",
        {
          key: i,
          style: { marginBottom: 4 } as CSSProperties,
        },
        React.createElement(JsonViewer, { data: arg, theme, maxDepth: 3, collapsed: false })
      )
    ),
    /* stack trace */
    entry.stack
      ? React.createElement(
          "div",
          { style: { marginTop: 8 } as CSSProperties },
          React.createElement(
            "div",
            {
              style: {
                color: theme.textMuted,
                fontSize: 10,
                marginBottom: 4,
                fontWeight: "bold",
              } as CSSProperties,
            },
            "Stack Trace"
          ),
          React.createElement(
            "pre",
            {
              style: {
                color: theme.textFaint,
                fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
                fontSize: 11,
                whiteSpace: "pre-wrap",
                margin: 0,
                maxHeight: 200,
                overflow: "auto",
              } as CSSProperties,
            },
            entry.stack
          )
        )
      : null
  );

  return React.createElement(ExpandableRow, { header, children: expanded });
}

/* ---------- ConsoleTab (default export) ---------- */

function ConsoleTab(): React.ReactElement {
  const ctx = useAllemDevCtx() as any;
  const { theme } = ctx;
  const consoleStore: ConsoleStore = ctx.console;

  const allEntries = useThrottledStore(
    consoleStore.subscribe,
    consoleStore.getAll,
  );

  const [activeLevelFilters, setActiveLevelFilters] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");

  const toggleLevel = React.useCallback((id: string) => {
    setActiveLevelFilters((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const levelFilters: FilterItem[] = LEVEL_FILTERS.map((l) => ({
    id: l,
    label: l,
    active: activeLevelFilters.has(l),
  }));

  const filtered = React.useMemo(() => {
    let entries = allEntries;
    if (activeLevelFilters.size > 0) {
      entries = entries.filter((e) => activeLevelFilters.has(e.level));
    }
    if (search) {
      const lower = search.toLowerCase();
      entries = entries.filter((e) => e.message.toLowerCase().includes(lower));
    }
    // newest first
    return [...entries].reverse();
  }, [allEntries, activeLevelFilters, search]);

  const handleClear = React.useCallback(() => {
    consoleStore.clear();
  }, [consoleStore]);

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
      { style: { flexShrink: 0 } as CSSProperties },
      React.createElement(FilterBar, { filters: levelFilters, onToggle: toggleLevel, theme })
    ),
    React.createElement(
      "div",
      { style: { flex: 1, minWidth: 80 } as CSSProperties },
      React.createElement(SearchInput, {
        value: search,
        onSearch: setSearch,
        placeholder: "Filter messages\u2026",
        theme,
      })
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
    (entry: ConsoleEntry) => React.createElement(ConsoleRow, { entry, key: entry.id }),
    []
  );

  return React.createElement(
    "div",
    { style: { display: "flex", flexDirection: "column", height: "100%" } as CSSProperties },
    topBar,
    React.createElement(
      "div",
      { style: { flex: 1, minHeight: 0 } as CSSProperties },
      filtered.length === 0
        ? React.createElement(
            "div",
            { style: { color: theme.textFaint, textAlign: "center", paddingTop: 40, fontSize: 12 } as CSSProperties },
            "No console output captured. Calls to console.log, info, warn, error, and debug will appear here."
          )
        : React.createElement(ScrollList, {
            items: filtered,
            renderRow,
            height: "100%",
          })
    )
  );
}

export default ConsoleTab;
