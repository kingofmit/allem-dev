import React, { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import type { RenderEntry } from "@allem-dev/core";
import { formatMs, timeAgo } from "@allem-dev/core";
import { useAllemDevCtx } from "../context";
import { useThrottledStore } from "../hooks/useThrottledStore";
import { durationColor, badgeStyle, rowStyle } from "../theme";
import { VirtualList } from "../primitives/VirtualList";
import { ExpandableRow } from "../primitives/ExpandableRow";

const h = React.createElement;

/* ---------- sub-components ---------- */

function RenderRow({ entry, theme }: { entry: RenderEntry; theme: any }) {
  const durColor = durationColor(entry.duration, theme);

  const reasonColorMap: Record<string, string> = {
    mount: theme.accent,
    update: theme.warning,
    "nested-update": theme.error,
  };
  const reasonColor = reasonColorMap[entry.reason] ?? theme.textFaint;

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
    h("span", { style: { fontWeight: "bold", color: theme.text, whiteSpace: "nowrap" } as CSSProperties }, entry.component),
    h(
      "span",
      {
        style: {
          fontSize: 10,
          background: theme.textFaint,
          color: "#fff",
          borderRadius: 8,
          padding: "1px 5px",
          flexShrink: 0,
        } as CSSProperties,
      },
      `x${entry.renderCount}`
    ),
    h("span", { style: { color: durColor, fontSize: 11, flexShrink: 0 } as CSSProperties }, formatMs(entry.duration)),
    h("span", { style: badgeStyle(reasonColor) }, entry.reason),
    h("span", { style: { color: theme.textFaint, fontSize: 10, marginLeft: "auto", flexShrink: 0 } as CSSProperties }, timeAgo(entry.timestamp))
  );

  const details = h(
    "div",
    { style: { padding: "4px 8px 4px 24px", fontSize: 11, color: theme.textMuted } as CSSProperties },
    entry.changedProps.length > 0
      ? h("div", null, h("span", { style: { color: theme.text } as CSSProperties }, "Changed props: "), entry.changedProps.join(", "))
      : null,
    entry.changedState.length > 0
      ? h("div", null, h("span", { style: { color: theme.text } as CSSProperties }, "Changed state: "), entry.changedState.join(", "))
      : null,
    entry.changedProps.length === 0 && entry.changedState.length === 0
      ? h("div", { style: { color: theme.textFaint, fontStyle: "italic" } as CSSProperties }, "No changed props or state recorded")
      : null
  );

  return h(ExpandableRow, { header, children: details });
}

function HeatmapBar({ proportion, theme }: { proportion: number; theme: any }) {
  const pct = Math.max(0, Math.min(1, proportion));
  // gradient from success -> warning -> error based on proportion
  const color = pct < 0.33 ? theme.success : pct < 0.66 ? theme.warning : theme.error;
  return h("div", {
    style: {
      width: `${pct * 100}%`,
      minWidth: 4,
      height: 20,
      borderRadius: 3,
      background: `linear-gradient(90deg, ${theme.success}, ${color})`,
    } as CSSProperties,
  });
}

/* ---------- main component ---------- */

function RendersTab() {
  const ctx = useAllemDevCtx();
  const { theme } = ctx;

  const [view, setView] = useState<"timeline" | "hot">("timeline");

  const entries = useThrottledStore<RenderEntry[]>(ctx.renders.subscribe, ctx.renders.getAll);

  const sorted = useMemo(() => [...entries].reverse(), [entries]);
  const hotComponents = useMemo(() => ctx.renders.getHotComponents(20), [entries]);

  const pillStyle = (active: boolean): CSSProperties => ({
    padding: "4px 12px",
    fontSize: 11,
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    background: active ? theme.accent : theme.surface,
    color: active ? "#fff" : theme.textMuted,
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
  });

  const toggleBar = h(
    "div",
    { style: { display: "flex", gap: 6, padding: "6px 8px" } as CSSProperties },
    h("button", { type: "button" as const, style: pillStyle(view === "timeline"), onClick: () => setView("timeline") }, "Timeline"),
    h("button", { type: "button" as const, style: pillStyle(view === "hot"), onClick: () => setView("hot") }, "Hot Components")
  );

  if (view === "hot") {
    const maxCount = hotComponents.length > 0 ? hotComponents[0].count : 1;

    const rows = hotComponents.map((hc, i) =>
      h(
        "div",
        {
          key: hc.component,
          style: {
            padding: "6px 8px",
            borderBottom: `1px solid ${theme.borderLight}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          } as CSSProperties,
        },
        h("span", { style: { fontWeight: "bold", color: theme.text, minWidth: 120 } as CSSProperties }, hc.component),
        h("span", { style: { color: theme.textMuted, fontSize: 11, minWidth: 40 } as CSSProperties }, `${hc.count}`),
        h("div", { style: { flex: 1 } as CSSProperties }, h(HeatmapBar, { proportion: hc.count / maxCount, theme }))
      )
    );

    return h("div", { style: { height: "100%", display: "flex", flexDirection: "column" } as CSSProperties }, toggleBar, h("div", { style: { flex: 1, overflow: "auto" } as CSSProperties }, ...rows));
  }

  // Timeline view
  const renderRow = (entry: RenderEntry, _index: number) => h(RenderRow, { entry, theme, key: entry.id });

  return h(
    "div",
    { style: { height: "100%", display: "flex", flexDirection: "column" } as CSSProperties },
    toggleBar,
    h(
      "div",
      { style: { flex: 1, minHeight: 0 } as CSSProperties },
      sorted.length === 0
        ? h(
            "div",
            { style: { color: theme.textFaint, textAlign: "center", paddingTop: 40, fontSize: 12 } as CSSProperties },
            "No renders tracked yet. Wrap components with <AllemDevProfiler> to start tracking."
          )
        : h(VirtualList, { items: sorted, rowHeight: 36, renderRow, height: 280 } as any)
    )
  );
}

export default RendersTab;
