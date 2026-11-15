/** A tab in the dev panel */
export interface DevTab {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
  render: () => string;
}

/** Severity level for entries */
export type Severity = "info" | "warn" | "error" | "debug";

/** A timestamped log entry */
export interface LogEntry {
  id: string;
  timestamp: number;
  severity: Severity;
  source: string;
  message: string;
  data?: unknown;
}

/** Network request entry */
export interface NetworkEntry {
  id: string;
  method: string;
  url: string;
  status: number | null;
  startTime: number;
  endTime: number | null;
  duration: number | null;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody: unknown;
  responseBody: unknown;
  error: string | null;
}

/** Component render entry */
export interface RenderEntry {
  id: string;
  component: string;
  timestamp: number;
  duration: number;
  reason: string;
  changedProps: string[];
  changedState: string[];
  renderCount: number;
}

/** State change entry */
export interface StateEntry {
  id: string;
  store: string;
  key: string;
  timestamp: number;
  previousValue: unknown;
  nextValue: unknown;
  action?: string;
}

/** Performance metric */
export interface PerfMetric {
  name: string;
  value: number;
  unit: string;
  rating: "good" | "needs-improvement" | "poor";
  timestamp: number;
}

/** Error entry */
export interface ErrorEntry {
  id: string;
  timestamp: number;
  message: string;
  stack: string | null;
  source: "runtime" | "unhandled-rejection" | "boundary" | "console";
  componentStack?: string;
  url?: string;
  line?: number;
  column?: number;
}

/** Panel configuration */
export interface PanelConfig {
  shortcut: string;
  position: "bottom" | "right" | "floating";
  defaultTab: string;
  height: number;
  width: number;
  opacity: number;
  theme: "dark" | "light" | "auto";
  maxEntries: number;
  enableInProduction: boolean;
}

export const DEFAULT_CONFIG: PanelConfig = {
  shortcut: "ctrl+shift+d",
  position: "bottom",
  defaultTab: "network",
  height: 350,
  width: 420,
  opacity: 0.95,
  theme: "dark",
  maxEntries: 500,
  enableInProduction: false,
};
