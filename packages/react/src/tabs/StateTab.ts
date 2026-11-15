import React, { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import type { StateEntry } from "@allem-dev/core";
import { timeAgo } from "@allem-dev/core";
import { shallowDiff } from "@allem-dev/state";
import type { DiffResult } from "@allem-dev/state";
import { useAllemDevCtx } from "../context";
import { useThrottledStore } from "../hooks/useThrottledStore";
import { badgeStyle, rowStyle } from "../theme";
import { ScrollList } from "../primitives/ScrollList";
import { ExpandableRow } from "../primitives/ExpandableRow";
import { JsonViewer } from "../primitives/JsonViewer";

const h = React.createElement;

/* ---------- DiffViewer ---------- */

function DiffViewer({ entry, theme }: { entry: StateEntry; theme: any }) {
  const diffs = useMemo(() => shallowDiff(entry.previousValue, entry.nextValue), [entry.previousValue, entry.nextValue]);

  const headerStyle: CSSProperties = {
    fontSize: 10,
    fontWeight: "bold",
    color: theme.textMuted,
    padding: "4px 8px",
    borderBottom: `1px solid ${theme.borderLight}`,
  };

  const cellStyle: CSSProperties = {
    flex: 1,
    padding: "2px 8px",
    overflow: "hidden",
    fontSize: 11,
    minWidth: 0,
  };

  const bgAdded = theme.success + "20";
  const bgRemoved = theme.error + "20";
  const bgChanged = theme.warning + "20";

  const rows = diffs.map((diff: DiffResult, i: number) => {
    let prevBg = "transparent";
    let nextBg = "transparent";
    let prevContent: React.ReactElement | null = null;
    let nextContent: React.ReactElement | null = null;

    if (diff.type === "added") {
      nextBg = bgAdded;
      nextContent = h(JsonViewer, { data: diff.newValue, theme, maxDepth: 2, collapsed: true });
    } else if (diff.type === "removed") {
      prevBg = bgRemoved;
      prevContent = h(JsonViewer, { data: diff.oldValue, theme, maxDepth: 2, collapsed: true });
    } else if (diff.type === "changed") {
      prevBg = bgChanged;
      nextBg = bgChanged;
      prevContent = h(JsonViewer, { data: diff.oldValue, theme, maxDepth: 2, collapsed: true });
      nextContent = h(JsonViewer, { data: diff.newValue, theme, maxDepth: 2, collapsed: true });
    } else {
      // unchanged
      prevContent = h(JsonViewer, { data: diff.oldValue ?? diff.newValue, theme, maxDepth: 2, collapsed: true });
      nextContent = h(JsonViewer, { data: diff.newValue ?? diff.oldValue, theme, maxDepth: 2, collapsed: true });
    }

    return h(
      "div",
      {
        key: diff.path + i,
        style: { display: "flex", borderBottom: `1px solid ${theme.borderLight}` } as CSSProperties,
      },
      h("div", { style: { width: 80, padding: "2px 4px", fontSize: 10, color: theme.textMuted, flexShrink: 0 } as CSSProperties }, diff.path),
      h("div", { style: { ...cellStyle, background: prevBg } as CSSProperties }, prevContent),
      h("div", { style: { ...cellStyle, background: nextBg } as CSSProperties }, nextContent)
    );
  });

  return h(
    "div",
    { style: { margin: "4px 0 4px 24px", border: `1px solid ${theme.borderLight}`, borderRadius: 4, overflow: "hidden" } as CSSProperties },
    h(
      "div",
      { style: { display: "flex" } as CSSProperties },
      h("div", { style: { ...headerStyle, width: 80, flexShrink: 0 } as CSSProperties }, "Path"),
      h("div", { style: { ...headerStyle, flex: 1 } as CSSProperties }, "Previous"),
      h("div", { style: { ...headerStyle, flex: 1 } as CSSProperties }, "Next")
    ),
    ...rows
  );
}

/* ---------- StateRow ---------- */

function StateRow({ entry, theme }: { entry: StateEntry; theme: any }) {
  // Hash-based color for store badge
  const storeColors = [
    "#14b8a6", "#60a5fa", "#a78bfa", "#f472b6", "#fb923c", "#34d399", "#fbbf24",
  ];
  let hash = 0;
  for (let i = 0; i < entry.store.length; i++) hash = (hash * 31 + entry.store.charCodeAt(i)) | 0;
  const storeColor = storeColors[Math.abs(hash) % storeColors.length];

  const header = h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flex: 1,
        overflow: "hidden",
      } as CSSProperties,
    },
    h("span", { style: badgeStyle(storeColor) }, entry.store),
    h("span", { style: { color: theme.text, fontWeight: "bold" } as CSSProperties }, entry.key),
    entry.action
      ? h("span", { style: { color: theme.textFaint, fontSize: 10 } as CSSProperties }, entry.action)
      : null,
    h("span", { style: { color: theme.textFaint, fontSize: 10, marginLeft: "auto", flexShrink: 0 } as CSSProperties }, timeAgo(entry.timestamp))
  );

  const details = h(DiffViewer, { entry, theme });

  return h(ExpandableRow, { header, children: details });
}

/* ---------- main component ---------- */

function StateTab() {
  const ctx = useAllemDevCtx();
  const { theme } = ctx;

  const [filterStore, setFilterStore] = useState<string>("");

  const entries = useThrottledStore<StateEntry[]>(ctx.state.subscribe, ctx.state.getAll);

  const storeNames = useMemo(() => {
    const names = new Set(entries.map((e) => e.store));
    return Array.from(names).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    const list = filterStore ? entries.filter((e) => e.store === filterStore) : entries;
    return [...list].reverse();
  }, [entries, filterStore]);

  // Top bar
  const topBar = h(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderBottom: `1px solid ${theme.borderLight}`,
      } as CSSProperties,
    },
    h(
      "select",
      {
        value: filterStore,
        onChange: (e: any) => setFilterStore(e.target.value),
        style: {
          background: theme.surface,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: 4,
          padding: "3px 8px",
          fontSize: 11,
          fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
          outline: "none",
        } as CSSProperties,
      },
      h("option", { value: "" }, "All stores"),
      ...storeNames.map((name) => h("option", { key: name, value: name }, name))
    ),
    filterStore
      ? h(
          "button",
          {
            type: "button" as const,
            onClick: () => setFilterStore(""),
            style: {
              background: "none",
              border: "none",
              color: theme.textMuted,
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
              padding: "2px 6px",
            } as CSSProperties,
          },
          "Clear"
        )
      : null,
    h("span", { style: { marginLeft: "auto", color: theme.textFaint, fontSize: 10 } as CSSProperties }, `${filtered.length} entries`)
  );

  const renderRow = (entry: StateEntry, _index: number) => h(StateRow, { entry, theme, key: entry.id });

  return h(
    "div",
    { style: { height: "100%", display: "flex", flexDirection: "column" } as CSSProperties },
    topBar,
    h(
      "div",
      { style: { flex: 1, minHeight: 0 } as CSSProperties },
      filtered.length === 0
        ? h(
            "div",
            { style: { color: theme.textFaint, textAlign: "center", paddingTop: 40, fontSize: 12 } as CSSProperties },
            "No state changes recorded. Use the useTrackedState() hook to track values, or navigate to record route changes."
          )
        : h(ScrollList, { items: filtered, renderRow, height: "100%" })
    )
  );
}

export default StateTab;
