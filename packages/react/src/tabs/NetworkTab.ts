import React from "react";
import type { CSSProperties } from "react";
import type { NetworkEntry } from "@allem-dev/core";
import { formatMs, timeAgo } from "@allem-dev/core";
import { FileText, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";
import { useAllemDevCtx } from "../context";
import { statusColor, METHOD_COLORS, badgeStyle, monoText } from "../theme";
import { useThrottledStore } from "../hooks/useThrottledStore";
import { SearchInput } from "../primitives/SearchInput";
import { FilterBar } from "../primitives/FilterBar";
import type { FilterItem } from "../primitives/FilterBar";
import { VirtualList } from "../primitives/VirtualList";
import { StatusDot } from "../primitives/StatusDot";
import { ExpandableRow } from "../primitives/ExpandableRow";
import { JsonViewer } from "../primitives/JsonViewer";
import { CopyButton } from "../primitives/CopyButton";

/* ---------- helpers ---------- */

const METHOD_FILTERS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const STATUS_FILTERS = [
  { id: "2xx", label: "2xx" },
  { id: "4xx", label: "4xx" },
  { id: "5xx", label: "5xx" },
  { id: "pending", label: "Pending" },
] as const;

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "\u2026" : s;
}

function matchesStatus(entry: NetworkEntry, activeStatus: Set<string>): boolean {
  if (activeStatus.size === 0) return true;
  const st = entry.status;
  if (st === null) return activeStatus.has("pending");
  if (st >= 200 && st < 300) return activeStatus.has("2xx");
  if (st >= 400 && st < 500) return activeStatus.has("4xx");
  if (st >= 500) return activeStatus.has("5xx");
  return false;
}

function buildCurl(entry: NetworkEntry): string {
  const parts: string[] = [`curl -X ${entry.method} '${entry.url}'`];
  for (const [k, v] of Object.entries(entry.requestHeaders ?? {})) {
    parts.push(`-H '${k}: ${v}'`);
  }
  if (entry.requestBody != null) {
    const body =
      typeof entry.requestBody === "string"
        ? entry.requestBody
        : JSON.stringify(entry.requestBody);
    parts.push(`--data-raw '${body}'`);
  }
  return parts.join(" \\\n  ");
}

/* ---------- detail tabs inside expanded row ---------- */

type DetailTab = "Headers" | "Request" | "Response" | "Timing";
const DETAIL_TABS: DetailTab[] = ["Headers", "Request", "Response", "Timing"];

const DETAIL_TAB_ICONS: Record<DetailTab, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Headers: FileText,
  Request: ArrowUpRight,
  Response: ArrowDownLeft,
  Timing: Clock,
};

function HeadersDetail(entry: NetworkEntry, theme: ReturnType<typeof useAllemDevCtx>["theme"]): React.ReactElement {
  const headerTable = (title: string, headers: Record<string, string>) => {
    const entries = Object.entries(headers ?? {});
    return React.createElement(
      "div",
      { style: { marginBottom: 8 } as CSSProperties },
      React.createElement("div", { style: { fontWeight: "bold", color: theme.text, marginBottom: 4, fontSize: 11 } as CSSProperties }, title),
      entries.length === 0
        ? React.createElement("div", { style: { color: theme.textFaint, fontSize: 11 } as CSSProperties }, "No headers")
        : React.createElement(
            "div",
            null,
            ...entries.map(([k, v]) =>
              React.createElement(
                "div",
                { key: k, style: { display: "flex", gap: 8, fontSize: 11, lineHeight: 1.6, ...monoText() } as CSSProperties },
                React.createElement("span", { style: { color: theme.accent, minWidth: 120, flexShrink: 0 } as CSSProperties }, k),
                React.createElement("span", { style: { color: theme.text, wordBreak: "break-all" } as CSSProperties }, v)
              )
            )
          )
    );
  };

  return React.createElement(
    "div",
    null,
    headerTable("Request Headers", entry.requestHeaders),
    headerTable("Response Headers", entry.responseHeaders)
  );
}

function RequestDetail(entry: NetworkEntry, theme: ReturnType<typeof useAllemDevCtx>["theme"]): React.ReactElement {
  if (entry.requestBody == null) {
    return React.createElement("div", { style: { color: theme.textFaint, fontSize: 11 } as CSSProperties }, "No body");
  }
  if (typeof entry.requestBody === "object") {
    return React.createElement(JsonViewer, { data: entry.requestBody, theme });
  }
  return React.createElement("pre", { style: { ...monoText(), color: theme.text, whiteSpace: "pre-wrap", margin: 0 } as CSSProperties }, String(entry.requestBody));
}

function ResponseDetail(entry: NetworkEntry, theme: ReturnType<typeof useAllemDevCtx>["theme"]): React.ReactElement {
  if (entry.responseBody == null) {
    return React.createElement("div", { style: { color: theme.textFaint, fontSize: 11 } as CSSProperties }, "No response body");
  }
  if (typeof entry.responseBody === "object") {
    return React.createElement(JsonViewer, { data: entry.responseBody, theme });
  }
  return React.createElement("pre", { style: { ...monoText(), color: theme.text, whiteSpace: "pre-wrap", margin: 0 } as CSSProperties }, String(entry.responseBody));
}

function TimingDetail(entry: NetworkEntry, theme: ReturnType<typeof useAllemDevCtx>["theme"]): React.ReactElement {
  const pct = `${Math.min(100, (entry.duration || 0) / 10)}%`;
  return React.createElement(
    "div",
    { style: { padding: "4px 0" } as CSSProperties },
    React.createElement(
      "div",
      {
        style: {
          height: 16,
          background: theme.bgAlt,
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
        } as CSSProperties,
      },
      React.createElement("div", {
        style: {
          height: "100%",
          width: pct,
          background: theme.accent,
          borderRadius: 4,
          transition: "width 0.2s",
        } as CSSProperties,
      })
    ),
    React.createElement(
      "div",
      { style: { color: theme.textMuted, fontSize: 11, marginTop: 4 } as CSSProperties },
      entry.duration != null ? formatMs(entry.duration) : "Pending\u2026"
    )
  );
}

/* ---------- NetworkRow ---------- */

function NetworkRow({ entry }: { entry: NetworkEntry }): React.ReactElement {
  const { theme } = useAllemDevCtx();
  const [activeDetail, setActiveDetail] = React.useState<DetailTab>("Headers");

  const methodColor = METHOD_COLORS[entry.method.toUpperCase()] ?? theme.textMuted;

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
    React.createElement(StatusDot, { color: statusColor(entry.status, theme) }),
    React.createElement(
      "span",
      { style: { ...badgeStyle(methodColor), fontSize: 10, minWidth: 42, textAlign: "center" } as CSSProperties },
      entry.method.toUpperCase()
    ),
    React.createElement(
      "span",
      { style: { color: theme.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as CSSProperties },
      truncate(entry.url, 60)
    ),
    entry.duration != null
      ? React.createElement("span", { style: { color: theme.textMuted, flexShrink: 0 } as CSSProperties }, formatMs(entry.duration))
      : React.createElement("span", { style: { color: theme.textFaint, flexShrink: 0 } as CSSProperties }, "pending"),
    React.createElement("span", { style: { color: theme.textFaint, flexShrink: 0, fontSize: 10 } as CSSProperties }, timeAgo(entry.startTime))
  );

  /* detail mini-tab bar */
  const tabBar = React.createElement(
    "div",
    { style: { display: "flex", gap: 2, marginBottom: 8, borderBottom: `1px solid ${theme.borderLight}`, paddingBottom: 4 } as CSSProperties },
    ...DETAIL_TABS.map((t) =>
      React.createElement(
        "button",
        {
          key: t,
          type: "button" as const,
          onClick: (e: React.MouseEvent) => { e.stopPropagation(); setActiveDetail(t); },
          style: {
            background: t === activeDetail ? theme.surface : "transparent",
            border: "none",
            color: t === activeDetail ? theme.text : theme.textMuted,
            padding: "3px 10px",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 11,
            fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
            display: "flex",
            alignItems: "center",
            gap: 4,
          } as CSSProperties,
        },
        React.createElement(DETAIL_TAB_ICONS[t], { size: 12, strokeWidth: 2 }),
        t
      )
    )
  );

  let detailContent: React.ReactElement;
  switch (activeDetail) {
    case "Headers":
      detailContent = HeadersDetail(entry, theme);
      break;
    case "Request":
      detailContent = RequestDetail(entry, theme);
      break;
    case "Response":
      detailContent = ResponseDetail(entry, theme);
      break;
    case "Timing":
      detailContent = TimingDetail(entry, theme);
      break;
  }

  const expanded = React.createElement(
    "div",
    {
      style: {
        padding: "8px 12px 8px 24px",
        background: theme.bgAlt,
        borderBottom: `1px solid ${theme.borderLight}`,
      } as CSSProperties,
    },
    tabBar,
    detailContent,
    React.createElement(
      "div",
      { style: { marginTop: 8 } as CSSProperties },
      React.createElement(CopyButton, { text: buildCurl(entry), label: "Copy as cURL", theme })
    )
  );

  return React.createElement(ExpandableRow, { header, children: expanded });
}

/* ---------- NetworkTab (default export) ---------- */

function NetworkTab(): React.ReactElement {
  const ctx = useAllemDevCtx();
  const { theme } = ctx;

  const allEntries = useThrottledStore(
    ctx.network.subscribe,
    ctx.network.getAll,
  );

  const [search, setSearch] = React.useState("");
  const [activeMethodFilters, setActiveMethodFilters] = React.useState<Set<string>>(new Set());
  const [activeStatusFilters, setActiveStatusFilters] = React.useState<Set<string>>(new Set());

  const toggleMethod = React.useCallback((id: string) => {
    setActiveMethodFilters((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleStatus = React.useCallback((id: string) => {
    setActiveStatusFilters((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const methodFilters: FilterItem[] = METHOD_FILTERS.map((m) => ({
    id: m,
    label: m,
    active: activeMethodFilters.has(m),
  }));

  const statusFilters: FilterItem[] = STATUS_FILTERS.map((s) => ({
    id: s.id,
    label: s.label,
    active: activeStatusFilters.has(s.id),
  }));

  const filtered = React.useMemo(() => {
    const term = search.toLowerCase();
    return allEntries
      .filter((e) => {
        if (term && !e.url.toLowerCase().includes(term)) return false;
        if (activeMethodFilters.size > 0 && !activeMethodFilters.has(e.method.toUpperCase())) return false;
        if (activeStatusFilters.size > 0 && !matchesStatus(e, activeStatusFilters)) return false;
        return true;
      })
      .reverse();
  }, [allEntries, search, activeMethodFilters, activeStatusFilters]);

  const handleClear = React.useCallback(() => {
    ctx.network.clear();
  }, [ctx.network]);

  /* top bar */
  const topBar = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 8px 4px 8px",
        borderBottom: `1px solid ${theme.border}`,
      } as CSSProperties,
    },
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, alignItems: "center" } as CSSProperties },
      React.createElement(
        "div",
        { style: { flex: 1 } as CSSProperties },
        React.createElement(SearchInput, { value: search, onSearch: setSearch, placeholder: "Filter by URL\u2026", theme })
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
    ),
    React.createElement(
      "div",
      { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" } as CSSProperties },
      React.createElement(FilterBar, { filters: methodFilters, onToggle: toggleMethod, theme }),
      React.createElement("span", { style: { width: 1, height: 16, background: theme.border } as CSSProperties }),
      React.createElement(FilterBar, { filters: statusFilters, onToggle: toggleStatus, theme })
    )
  );

  const renderRow = React.useCallback(
    (entry: NetworkEntry) => React.createElement(NetworkRow, { entry, key: entry.id }),
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
            "No network requests captured yet. Make a fetch() or XMLHttpRequest call to see it here."
          )
        : React.createElement(VirtualList, {
            items: filtered,
            rowHeight: 36,
            renderRow,
            height: 280,
          })
    )
  );
}

export default NetworkTab;
