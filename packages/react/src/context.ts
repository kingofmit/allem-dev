import { createContext, useContext } from "react";
import type { PanelManager, PerfMetric } from "@allem-dev/core";
import type { NetworkStore } from "@allem-dev/network";
import type { RenderStore } from "@allem-dev/renders";
import type { StateStore } from "@allem-dev/state";
import type { ErrorStore } from "@allem-dev/errors";
import type { MemorySnapshot } from "@allem-dev/perf";
import type { ThemeTokens } from "./theme";
import type { ConsoleStore } from "./console/ConsoleStore";
import type { MockStore } from "./mocking/MockStore";
import type { PluginManager } from "./plugins/PluginManager";

export interface AllemDevContextValue {
  panel: PanelManager;
  network: NetworkStore;
  renders: RenderStore;
  state: StateStore;
  errors: ErrorStore;
  console: ConsoleStore;
  mocks: MockStore;
  plugins: PluginManager;
  vitals: PerfMetric[];
  fps: number;
  memory: MemorySnapshot | null;
  theme: ThemeTokens;
  toggle: () => void;
  isVisible: boolean;
  activeTab: string;
}

export const AllemDevCtx = createContext<AllemDevContextValue | null>(null);

export function useAllemDevCtx(): AllemDevContextValue {
  const ctx = useContext(AllemDevCtx);
  if (!ctx) throw new Error("useAllemDevCtx must be used within <AllemDev /> or <AllemDevProvider />");
  return ctx;
}
