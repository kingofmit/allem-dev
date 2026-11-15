import React from "react";
import type { CSSProperties } from "react";
import { useAllemDevCtx } from "../context";
import { monoText } from "../theme";
import { SearchInput } from "../primitives/SearchInput";
import { ScrollList } from "../primitives/ScrollList";
import { ExpandableRow } from "../primitives/ExpandableRow";
import { JsonViewer } from "../primitives/JsonViewer";
import { CopyButton } from "../primitives/CopyButton";

/* ---------- types ---------- */

interface StorageItem {
  key: string;
  value: string;
  size: number;
  parsed: unknown;
  isJson: boolean;
}

/* ---------- helpers ---------- */

function readStorage(storage: Storage): StorageItem[] {
  const items: StorageItem[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key === null) continue;
      const value = storage.getItem(key) ?? "";
      const size = new Blob([value]).size;
      let parsed: unknown = value;
      let isJson = false;
      try {
        parsed = JSON.parse(value);
        isJson = true;
      } catch {
        /* not JSON, keep raw string */
      }
      items.push({ key, value, size, parsed, isJson });
    }
  } catch {
    /* SSR or access denied */
  }
  items.sort((a, b) => a.key.localeCompare(b.key));
  return items;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + "\u2026" : s;
}

/* ---------- StorageRow ---------- */

function StorageRow({
  item,
  storageType,
  onDelete,
}: {
  item: StorageItem;
  storageType: "localStorage" | "sessionStorage";
  onDelete: (key: string) => void;
}): React.ReactElement {
  const { theme } = useAllemDevCtx();

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
      {
        style: {
          color: theme.text,
          fontWeight: "bold",
          flexShrink: 0,
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        } as CSSProperties,
      },
      item.key
    ),
    React.createElement(
      "span",
      {
        style: {
          color: theme.textMuted,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        } as CSSProperties,
      },
      truncate(item.value, 60)
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
      formatBytes(item.size)
    )
  );

  const handleDelete = React.useCallback(() => {
    try {
      const storage = storageType === "localStorage" ? window.localStorage : window.sessionStorage;
      storage.removeItem(item.key);
      onDelete(item.key);
    } catch {
      /* ignore */
    }
  }, [item.key, storageType, onDelete]);

  const expanded = React.createElement(
    "div",
    {
      style: {
        padding: "8px 12px 8px 24px",
        background: theme.bgAlt,
        borderBottom: `1px solid ${theme.borderLight}`,
      } as CSSProperties,
    },
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
      item.isJson ? "Value (parsed JSON)" : "Value (raw string)"
    ),
    React.createElement(
      "div",
      { style: { marginBottom: 8 } as CSSProperties },
      React.createElement(JsonViewer, { data: item.parsed, theme, maxDepth: 4, collapsed: false })
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          gap: 8,
          alignItems: "center",
        } as CSSProperties,
      },
      React.createElement(CopyButton, { text: item.value, label: "Copy Value", theme }),
      React.createElement(
        "button",
        {
          type: "button" as const,
          onClick: handleDelete,
          style: {
            background: "none",
            border: `1px solid ${theme.error}`,
            color: theme.error,
            cursor: "pointer",
            padding: "2px 8px",
            borderRadius: 4,
            fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
            fontSize: 11,
          } as CSSProperties,
        },
        "Delete"
      )
    )
  );

  return React.createElement(ExpandableRow, { header, children: expanded });
}

/* ---------- StorageTab (default export) ---------- */

function StorageTab(): React.ReactElement {
  const { theme } = useAllemDevCtx();

  const [storageType, setStorageType] = React.useState<"localStorage" | "sessionStorage">("localStorage");
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<StorageItem[]>([]);
  const [revision, setRevision] = React.useState(0);

  // Read storage on mount, on type change, and on refresh
  React.useEffect(() => {
    try {
      const storage = storageType === "localStorage" ? window.localStorage : window.sessionStorage;
      setItems(readStorage(storage));
    } catch {
      setItems([]);
    }
  }, [storageType, revision]);

  const handleRefresh = React.useCallback(() => {
    setRevision((r) => r + 1);
  }, []);

  const handleDelete = React.useCallback((_key: string) => {
    // re-read storage after deletion
    setRevision((r) => r + 1);
  }, []);

  const filtered = React.useMemo(() => {
    if (!search) return items;
    const lower = search.toLowerCase();
    return items.filter((i) => i.key.toLowerCase().includes(lower));
  }, [items, search]);

  /* toggle pills */
  const pillStyle = (active: boolean): CSSProperties => ({
    padding: "4px 12px",
    borderRadius: 10,
    fontSize: 11,
    cursor: "pointer",
    background: active ? theme.accent : "transparent",
    color: active ? "#fff" : theme.textMuted,
    border: active ? "1px solid transparent" : `1px solid ${theme.border}`,
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
    lineHeight: 1.4,
  });

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
      "button",
      {
        type: "button" as const,
        onClick: () => setStorageType("localStorage"),
        style: pillStyle(storageType === "localStorage"),
      },
      "localStorage"
    ),
    React.createElement(
      "button",
      {
        type: "button" as const,
        onClick: () => setStorageType("sessionStorage"),
        style: pillStyle(storageType === "sessionStorage"),
      },
      "sessionStorage"
    ),
    React.createElement(
      "div",
      { style: { flex: 1, minWidth: 80 } as CSSProperties },
      React.createElement(SearchInput, {
        value: search,
        onSearch: setSearch,
        placeholder: "Filter by key\u2026",
        theme,
      })
    ),
    React.createElement(
      "button",
      {
        type: "button" as const,
        onClick: handleRefresh,
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
      "Refresh"
    )
  );

  const renderRow = React.useCallback(
    (item: StorageItem) =>
      React.createElement(StorageRow, {
        item,
        storageType,
        onDelete: handleDelete,
        key: item.key,
      }),
    [storageType, handleDelete]
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
            { style: { color: theme.textFaint, textAlign: "center", padding: 24, fontSize: 12 } as CSSProperties },
            items.length === 0
              ? `No items in ${storageType}`
              : "No matching keys"
          )
        : React.createElement(ScrollList, {
            items: filtered,
            renderRow,
            height: "100%",
          })
    )
  );
}

export default StorageTab;
