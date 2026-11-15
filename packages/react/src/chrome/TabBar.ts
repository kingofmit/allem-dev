import React from "react";
import type { ThemeTokens } from "../theme";
import { panelFont } from "../theme";
import {
  Globe, RotateCw, Database, Zap, AlertCircle, Terminal, HardDrive, Plug,
  LayoutGrid, Moon, X,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  globe: Globe,
  "rotate-cw": RotateCw,
  database: Database,
  zap: Zap,
  "alert-circle": AlertCircle,
  terminal: Terminal,
  "hard-drive": HardDrive,
  plug: Plug,
};

export interface TabDef {
  id: string;
  label: string;
  icon: string;
}

export const TAB_DEFS: TabDef[] = [
  { id: "network", label: "Network", icon: "globe" },
  { id: "renders", label: "Renders", icon: "rotate-cw" },
  { id: "state", label: "State", icon: "database" },
  { id: "perf", label: "Perf", icon: "zap" },
  { id: "errors", label: "Errors", icon: "alert-circle" },
];

export interface TabBarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  badges: Record<string, number>;
  fps: number;
  memory: number | null; // usedJSHeapSize in MB, or null
  theme: ThemeTokens;
  onClose: () => void;
  onPositionCycle: () => void;
  onThemeToggle: () => void;
  /** Override the tab definitions (used when plugins add custom tabs) */
  tabs?: TabDef[];
}

function TabButton({
  tab,
  isActive,
  isError,
  count,
  theme,
  onTabChange,
}: {
  tab: TabDef;
  isActive: boolean;
  isError: boolean;
  count: number;
  theme: ThemeTokens;
  onTabChange: (id: string) => void;
}): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);

  return React.createElement("button", {
    onClick: () => onTabChange(tab.id),
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      background: hovered ? theme.bgAlt : "none",
      border: "none",
      color: isError ? theme.error : isActive ? theme.text : theme.textMuted,
      cursor: "pointer",
      padding: "6px 10px",
      fontSize: 12,
      fontFamily: "inherit",
      borderBottom: isActive ? `2px solid ${theme.accent}` : "2px solid transparent",
      marginBottom: -1,
      display: "flex",
      alignItems: "center",
      gap: 4,
      borderRadius: "4px 4px 0 0",
      transition: "background 0.1s",
      whiteSpace: "nowrap" as const,
      flexShrink: 0,
    },
  },
    ICON_MAP[tab.icon]
      ? React.createElement(ICON_MAP[tab.icon], { size: 13, strokeWidth: 2 })
      : null,
    tab.label,
    count > 0
      ? React.createElement("span", {
          style: {
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            background: isError ? theme.error : theme.textFaint,
            color: "#fff",
            fontSize: 9,
            fontWeight: "bold",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          },
        }, count > 999 ? "999+" : String(count))
      : null,
  );
}

function ControlButton({
  icon,
  onClick,
  title,
  theme,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  theme: ThemeTokens;
}): React.ReactElement {
  const [hovered, setHovered] = React.useState(false);

  return React.createElement("button", {
    onClick,
    title,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: {
      background: "none",
      border: "none",
      color: hovered ? theme.text : theme.textMuted,
      cursor: "pointer",
      fontSize: 14,
      padding: 4,
      lineHeight: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "color 0.1s",
    },
  }, icon);
}

export function TabBar({
  activeTab,
  onTabChange,
  badges,
  fps,
  memory,
  theme,
  onClose,
  onPositionCycle,
  onThemeToggle,
  tabs,
}: TabBarProps): React.ReactElement {
  return React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      borderBottom: `1px solid ${theme.border}`,
      padding: "0 12px",
      height: 36,
      gap: 2,
      ...panelFont(),
      flexShrink: 0,
    },
  },
    // Logo
    React.createElement("span", {
      style: { color: theme.accent, fontWeight: "bold", marginRight: 16, fontSize: 13, display: "flex", alignItems: "center", gap: 4, flexShrink: 0 },
    },
      React.createElement(Zap, { size: 14, strokeWidth: 2.5 }),
      "Allem Dev",
    ),

    // Tab buttons wrapper (scrollable)
    React.createElement("div", {
      style: {
        display: "flex",
        gap: 2,
        flex: 1,
        minWidth: 0,
        overflow: "auto",
        scrollbarWidth: "none" as any,
        msOverflowStyle: "none" as any,
      },
    },
      ...(tabs || TAB_DEFS).map((tab) => {
        const isActive = activeTab === tab.id;
        const count = badges[tab.id] || 0;
        const isError = tab.id === "errors" && count > 0;

        return React.createElement(TabButton, {
          key: tab.id,
          tab,
          isActive,
          isError,
          count,
          theme,
          onTabChange,
        });
      }),
    ),

    // Right side controls
    React.createElement("div", {
      style: { marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 },
    },
      React.createElement("span", { style: { color: theme.textFaint, fontSize: 11 } },
        `${fps} FPS`,
      ),
      memory !== null
        ? React.createElement("span", { style: { color: theme.textFaint, fontSize: 11 } },
            `${memory}MB`,
          )
        : null,
      React.createElement(ControlButton, { icon: React.createElement(LayoutGrid, { size: 14, strokeWidth: 2 }), onClick: onPositionCycle, title: "Cycle position", theme }),
      React.createElement(ControlButton, { icon: React.createElement(Moon, { size: 14, strokeWidth: 2 }), onClick: onThemeToggle, title: "Toggle theme", theme }),
      React.createElement(ControlButton, { icon: React.createElement(X, { size: 14, strokeWidth: 2 }), onClick: onClose, title: "Close panel", theme }),
    ),
  );
}
