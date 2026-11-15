import React, { useState, useEffect, useRef } from "react";
import type { ThemeTokens } from "../theme";
import { Zap } from "lucide-react";

export interface FabProps {
  onClick: () => void;
  errorCount: number;
  theme: ThemeTokens;
  shortcut?: string;
}

export function Fab({ onClick, errorCount, theme, shortcut }: FabProps): React.ReactElement {
  const [pulse, setPulse] = useState(false);
  const prevErrorCount = useRef(errorCount);

  useEffect(() => {
    if (errorCount > prevErrorCount.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }
    prevErrorCount.current = errorCount;
  }, [errorCount]);

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
      transform: pulse ? "scale(1.15)" : "scale(1)",
      transition: "transform 0.15s ease",
      pointerEvents: "auto" as const,
    },
    onClick,
    title: `Toggle Allem Dev${shortcut ? ` (${shortcut})` : ""}`,
  },
    React.createElement(Zap, { size: 16, strokeWidth: 2.5, fill: "currentColor" }),
    // Error count badge
    errorCount > 0
      ? React.createElement("span", {
          style: {
            position: "absolute" as const,
            top: -4,
            right: -4,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            background: theme.error,
            color: "#fff",
            fontSize: 9,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
          },
        }, errorCount > 99 ? "99+" : String(errorCount))
      : null,
  );
}
