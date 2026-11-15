import type { CSSProperties } from "react";

export interface ThemeTokens {
  bg: string;
  bgAlt: string;
  surface: string;
  border: string;
  borderLight: string;
  text: string;
  textMuted: string;
  textFaint: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export const DARK_THEME: ThemeTokens = {
  bg: "rgba(15, 15, 15, 0.97)",
  bgAlt: "#1a1a1a",
  surface: "#262626",
  border: "rgba(255,255,255,0.1)",
  borderLight: "rgba(255,255,255,0.06)",
  text: "#e5e5e5",
  textMuted: "#a3a3a3",
  textFaint: "#737373",
  accent: "#14b8a6",
  success: "#22c55e",
  warning: "#eab308",
  error: "#ef4444",
};

export const LIGHT_THEME: ThemeTokens = {
  bg: "rgba(255, 255, 255, 0.97)",
  bgAlt: "#f5f5f5",
  surface: "#e5e5e5",
  border: "rgba(0,0,0,0.12)",
  borderLight: "rgba(0,0,0,0.06)",
  text: "#171717",
  textMuted: "#525252",
  textFaint: "#a3a3a3",
  accent: "#0d9488",
  success: "#16a34a",
  warning: "#ca8a04",
  error: "#dc2626",
};

export const METHOD_COLORS: Record<string, string> = {
  GET: "#60a5fa",
  POST: "#22c55e",
  PUT: "#f59e0b",
  DELETE: "#ef4444",
  PATCH: "#a78bfa",
  HEAD: "#737373",
  OPTIONS: "#737373",
};

export function getTheme(mode: "dark" | "light" | "auto"): ThemeTokens {
  if (mode === "dark") return DARK_THEME;
  if (mode === "light") return LIGHT_THEME;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches) {
    return LIGHT_THEME;
  }
  return DARK_THEME;
}

export function panelFont(): CSSProperties {
  return {
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
    fontSize: 12,
  };
}

export function monoText(): CSSProperties {
  return {
    fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
    fontSize: 11,
  };
}

export function cardStyle(theme: ThemeTokens): CSSProperties {
  return {
    background: theme.surface,
    border: `1px solid ${theme.borderLight}`,
    borderRadius: 6,
    padding: "8px 12px",
  };
}

export function rowStyle(theme: ThemeTokens): CSSProperties {
  return {
    borderBottom: `1px solid ${theme.borderLight}`,
    padding: "6px 8px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  };
}

export function badgeStyle(color: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    padding: "0 5px",
    fontSize: 10,
    fontWeight: "bold",
    background: color,
    color: "#fff",
  };
}

/** Rating color for Web Vitals */
export function ratingColor(rating: "good" | "needs-improvement" | "poor", theme: ThemeTokens): string {
  if (rating === "good") return theme.success;
  if (rating === "needs-improvement") return theme.warning;
  return theme.error;
}

/** Status color for HTTP status codes */
export function statusColor(status: number | null, theme: ThemeTokens): string {
  if (status === null) return theme.textFaint; // pending
  if (status === 0) return theme.error; // network error
  if (status < 300) return theme.success;
  if (status < 400) return "#60a5fa"; // redirect
  if (status < 500) return theme.warning;
  return theme.error;
}

/** Duration color for render times */
export function durationColor(ms: number, theme: ThemeTokens): string {
  if (ms < 2) return theme.success;
  if (ms <= 16) return theme.warning;
  return theme.error;
}
