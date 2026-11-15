import React from "react";
import type { PanelConfig } from "@allem-dev/core";
import { useAllemDev } from "../useAllemDev";
import { AllemDevCtx } from "../context";
import { AllemDevPanel } from "./AllemDevPanel";

export interface AllemDevProviderProps {
  children: React.ReactNode;
  config?: Partial<PanelConfig>;
  disabled?: boolean;
}

/**
 * Provider that wraps children with the Allem Dev context and renders the panel.
 * Use this instead of <AllemDev /> when you need access to stores from child components
 * via useAllemDevCtx().
 *
 * ```tsx
 * <AllemDevProvider>
 *   <App />
 * </AllemDevProvider>
 * ```
 */
export function AllemDevProvider({ children, config, disabled }: AllemDevProviderProps): React.ReactElement {
  const ctx = useAllemDev(config);

  if (disabled) {
    return React.createElement(React.Fragment, null, children);
  }

  return React.createElement(AllemDevCtx.Provider, { value: ctx },
    children,
    React.createElement(AllemDevPanel, null),
  );
}
