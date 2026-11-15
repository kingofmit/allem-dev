import { useEffect, useRef } from "react";
import type { AllemDevPlugin } from "./PluginManager";
import { useAllemDevCtx } from "../context";

/**
 * Hook to register a plugin tab in the Allem Dev panel.
 * Automatically unregisters on unmount.
 *
 * Usage:
 * ```tsx
 * function MyCustomTab() {
 *   useAllemDevPlugin({
 *     id: "my-tab",
 *     label: "My Tab",
 *     icon: "🔧",
 *     render: () => createElement("div", null, "Custom content"),
 *   });
 * }
 * ```
 */
export function useAllemDevPlugin(plugin: AllemDevPlugin): void {
  const ctx = useAllemDevCtx() as any;
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!ctx.plugins || registeredRef.current) return;
    registeredRef.current = true;
    const unregister = ctx.plugins.register(plugin);
    return () => {
      registeredRef.current = false;
      unregister();
    };
  }, [plugin.id]);
}
