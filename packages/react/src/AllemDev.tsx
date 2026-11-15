import React from "react";
import { PanelConfig } from "@allem-dev/core";
import { useAllemDev } from "./useAllemDev";

export interface AllemDevProps {
  /** Override default panel configuration */
  config?: Partial<PanelConfig>;
  /** Completely disable the panel (useful for production builds) */
  disabled?: boolean;
}

/**
 * Drop-in dev panel for React apps.
 *
 * ```tsx
 * import { AllemDev } from "allem-dev";
 *
 * function App() {
 *   return (
 *     <>
 *       <YourApp />
 *       <AllemDev />
 *     </>
 *   );
 * }
 * ```
 *
 * Toggle with Ctrl+Shift+D (or Cmd+Shift+D on Mac).
 */
export function AllemDev({ config, disabled }: AllemDevProps): React.ReactElement | null {
  const ctx = useAllemDev(config);

  if (disabled) return null;
  if (typeof window === "undefined") return null;
  if (!config?.enableInProduction && process.env.NODE_ENV === "production") return null;

  if (!ctx.isVisible) {
    return React.createElement("div", {
      style: {
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 99999,
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(20, 184, 166, 0.9)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        fontSize: 16,
        color: "#fff",
        fontFamily: "monospace",
        fontWeight: "bold",
      },
      onClick: ctx.toggle,
      title: "Toggle Allem Dev (Ctrl+Shift+D)",
    }, "⚡");
  }

  const panelConfig = ctx.panel.getConfig();
  const networkEntries = ctx.network.getAll();
  const errorEntries = ctx.errors.getAll();
  const renderEntries = ctx.renders.getAll();

  return React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: panelConfig.height,
      zIndex: 99999,
      background: "rgba(15, 15, 15, 0.97)",
      color: "#e5e5e5",
      fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
      fontSize: 12,
      borderTop: "1px solid rgba(255,255,255,0.1)",
      display: "flex",
      flexDirection: "column",
      backdropFilter: "blur(12px)",
    },
  },
    // Tab bar
    React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 12px",
        height: 36,
        gap: 2,
      },
    },
      React.createElement("span", { style: { color: "#14b8a6", fontWeight: "bold", marginRight: 16, fontSize: 13 } }, "⚡ Allem Dev"),
      tabButton("Network", networkEntries.length),
      tabButton("Renders", renderEntries.length),
      tabButton("State", ctx.state.getCount()),
      tabButton("Perf", ctx.vitals.length),
      tabButton("Errors", errorEntries.length, errorEntries.length > 0),
      React.createElement("div", { style: { marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" } },
        React.createElement("span", { style: { color: "#737373" } }, `${ctx.fps} FPS`),
        ctx.memory && React.createElement("span", { style: { color: "#737373" } }, `${Math.round(ctx.memory.usedJSHeapSize / 1048576)}MB`),
        React.createElement("button", {
          onClick: ctx.toggle,
          style: { background: "none", border: "none", color: "#737373", cursor: "pointer", fontSize: 16, padding: 4 },
        }, "✕"),
      ),
    ),
    // Content area
    React.createElement("div", {
      style: { flex: 1, overflow: "auto", padding: "8px 12px" },
    },
      React.createElement("div", { style: { color: "#737373", textAlign: "center", paddingTop: 40 } },
        `${networkEntries.length} requests · ${renderEntries.length} renders · ${errorEntries.length} errors`,
      ),
    ),
  );
}

function tabButton(label: string, count: number, isError = false) {
  return React.createElement("button", {
    style: {
      background: "none",
      border: "none",
      color: isError && count > 0 ? "#ef4444" : "#a3a3a3",
      cursor: "pointer",
      padding: "6px 12px",
      fontSize: 12,
      fontFamily: "inherit",
      borderBottom: "2px solid transparent",
    },
  }, `${label}${count > 0 ? ` (${count})` : ""}`);
}
