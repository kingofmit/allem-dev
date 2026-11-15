import React, { useState, useCallback, useMemo, Suspense, lazy } from "react";
import { createPortal } from "react-dom";
import { AllemDevCtx } from "../context";
import { getTheme } from "../theme";
import { getPortalContainer } from "../portal";
import { PanelShell } from "../chrome/PanelShell";
import { TabBar, TAB_DEFS } from "../chrome/TabBar";
import type { TabDef } from "../chrome/TabBar";
import { ResizeHandle } from "../chrome/ResizeHandle";
import { Fab } from "../chrome/Fab";
import { loadPanelState, savePanelState } from "../chrome/PanelPersistence";
import { usePanelResize } from "../hooks/usePanelResize";
import { useStoreSubscription } from "../hooks/useStoreSubscription";

const NetworkTab = lazy(() => import("../tabs/NetworkTab"));
const ErrorsTab = lazy(() => import("../tabs/ErrorsTab"));
const RendersTab = lazy(() => import("../tabs/RendersTab"));
const PerfTab = lazy(() => import("../tabs/PerfTab"));
const StateTab = lazy(() => import("../tabs/StateTab"));
const ConsoleTab = lazy(() => import("../tabs/ConsoleTab"));
const StorageTab = lazy(() => import("../tabs/StorageTab"));

const TAB_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  network: NetworkTab,
  errors: ErrorsTab,
  renders: RendersTab,
  perf: PerfTab,
  state: StateTab,
  console: ConsoleTab,
  storage: StorageTab,
};

const ALL_TAB_DEFS: TabDef[] = [
  ...TAB_DEFS,
  { id: "console", label: "Console", icon: "terminal" },
  { id: "storage", label: "Storage", icon: "hard-drive" },
];

/**
 * Renders the Allem Dev panel UI. Must be rendered inside an AllemDevCtx.Provider.
 * Used internally by both AllemDev and AllemDevProvider.
 */
export function AllemDevPanel(): React.ReactElement | null {
  const ctx = React.useContext(AllemDevCtx)!;
  const { panel, isVisible, activeTab, toggle, fps, memory, theme } = ctx;
  const panelConfig = panel.getConfig();

  const pluginList = useStoreSubscription(
    ctx.plugins.subscribe,
    ctx.plugins.getAll,
  );

  const allTabs = useMemo(() => {
    const pluginTabs: TabDef[] = pluginList.map((p) => ({
      id: p.id,
      label: p.label,
      icon: p.icon || "plug",
    }));
    return [...ALL_TAB_DEFS, ...pluginTabs];
  }, [pluginList]);

  const persisted = useMemo(() => loadPanelState(), []);
  const [position, setPosition] = useState<"bottom" | "right" | "floating">(
    persisted.position || panelConfig.position,
  );

  const [themeMode, setThemeMode] = useState<"dark" | "light" | "auto">(
    persisted.theme || panelConfig.theme,
  );
  const currentTheme = useMemo(() => getTheme(themeMode), [themeMode]);

  const initialSize = position === "right"
    ? (persisted.width || panelConfig.width)
    : (persisted.height || panelConfig.height);
  const { size, onPointerDown } = usePanelResize(position, initialSize);

  const badges = useMemo(() => ({
    network: ctx.network.getCount(),
    renders: ctx.renders.getCount(),
    state: ctx.state.getCount(),
    perf: ctx.vitals.length,
    errors: ctx.errors.getCount(),
    console: ctx.console.getCount(),
    storage: 0,
  }), [ctx.network.getCount(), ctx.renders.getCount(), ctx.state.getCount(), ctx.vitals.length, ctx.errors.getCount(), ctx.console.getCount()]);

  const handleTabChange = useCallback((tabId: string) => {
    panel.setActiveTab(tabId);
    savePanelState({ activeTab: tabId });
  }, [panel]);

  const handlePositionCycle = useCallback(() => {
    const positions: Array<"bottom" | "right" | "floating"> = ["bottom", "right", "floating"];
    const next = positions[(positions.indexOf(position) + 1) % positions.length];
    setPosition(next);
    savePanelState({ position: next });
  }, [position]);

  const handleThemeToggle = useCallback(() => {
    const modes: Array<"dark" | "light" | "auto"> = ["dark", "light", "auto"];
    const next = modes[(modes.indexOf(themeMode) + 1) % modes.length];
    setThemeMode(next);
    savePanelState({ theme: next });
  }, [themeMode]);

  if (!isVisible) {
    return createPortal(
      React.createElement(Fab, {
        onClick: toggle,
        errorCount: ctx.errors.getCount(),
        theme: currentTheme,
        shortcut: panelConfig.shortcut,
      }),
      getPortalContainer(),
    );
  }

  let ActiveTabComponent = TAB_COMPONENTS[activeTab];
  let pluginRender: (() => React.ReactElement) | null = null;
  if (!ActiveTabComponent) {
    const plugin = ctx.plugins.get(activeTab);
    if (plugin) pluginRender = plugin.render;
  }

  const memoryMB = memory ? Math.round(memory.usedJSHeapSize / 1048576) : null;

  return createPortal(
    React.createElement(PanelShell, {
      position,
      size,
      theme: currentTheme,
      opacity: panelConfig.opacity,
    },
      React.createElement(ResizeHandle, {
        position,
        onPointerDown,
        theme: currentTheme,
      }),
      React.createElement(TabBar, {
        activeTab,
        onTabChange: handleTabChange,
        badges,
        fps,
        memory: memoryMB,
        theme: currentTheme,
        onClose: toggle,
        onPositionCycle: handlePositionCycle,
        onThemeToggle: handleThemeToggle,
        tabs: allTabs,
      }),
      React.createElement("div", {
        style: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" as const },
      },
        ActiveTabComponent
          ? React.createElement(Suspense, {
              fallback: React.createElement("div", {
                style: { padding: 20, textAlign: "center", color: currentTheme.textFaint },
              }, "Loading\u2026"),
            },
              React.createElement(ActiveTabComponent, null),
            )
          : pluginRender
            ? pluginRender()
            : React.createElement("div", {
                style: { padding: 20, textAlign: "center", color: currentTheme.textFaint },
              }, `Unknown tab: ${activeTab}`),
      ),
    ),
    getPortalContainer(),
  );
}
