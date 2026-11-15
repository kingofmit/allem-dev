export { AllemDev } from "./AllemDev";
export type { AllemDevProps } from "./AllemDev";
export { useAllemDev } from "./useAllemDev";
export { useAllemDevCtx, AllemDevCtx } from "./context";
export type { AllemDevContextValue } from "./context";

// Integration components
export { AllemDevProvider } from "./integration/AllemDevProvider";
export type { AllemDevProviderProps } from "./integration/AllemDevProvider";
export { AllemDevErrorBoundary } from "./integration/ErrorBoundary";
export type { AllemDevErrorBoundaryProps } from "./integration/ErrorBoundary";
export { AllemDevProfiler } from "./integration/ProfilerWrapper";
export type { AllemDevProfilerProps } from "./integration/ProfilerWrapper";
export { useTrackedState } from "./integration/useTrackedState";

// Plugin API
export { PluginManager } from "./plugins/PluginManager";
export type { AllemDevPlugin } from "./plugins/PluginManager";
export { useAllemDevPlugin } from "./plugins/usePlugin";

// Mocking API
export { MockStore } from "./mocking/MockStore";
export type { MockRule } from "./mocking/MockStore";

// Console store
export { ConsoleStore } from "./console/ConsoleStore";
export type { ConsoleEntry, ConsoleLevel } from "./console/ConsoleStore";

// Re-export stores for advanced usage
export { NetworkStore } from "@allem-dev/network";
export { RenderStore } from "@allem-dev/renders";
export { StateStore } from "@allem-dev/state";
export { ErrorStore } from "@allem-dev/errors";
export type { PanelConfig, NetworkEntry, RenderEntry, StateEntry, ErrorEntry, PerfMetric } from "@allem-dev/core";
