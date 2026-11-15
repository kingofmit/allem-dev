import React from "react";
import type { ErrorStore } from "@allem-dev/errors";

export interface AllemDevErrorBoundaryProps {
  children: React.ReactNode;
  errorStore: ErrorStore;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class AllemDevErrorBoundary extends React.Component<AllemDevErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: AllemDevErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.errorStore.add({
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack || null,
      source: "boundary",
      componentStack: errorInfo.componentStack || undefined,
    });
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return React.createElement("div", {
        style: {
          padding: 20,
          margin: 10,
          border: "1px solid #ef4444",
          borderRadius: 8,
          background: "rgba(239, 68, 68, 0.05)",
          fontFamily: "monospace",
          fontSize: 13,
        },
      },
        React.createElement("div", {
          style: { color: "#ef4444", fontWeight: "bold", marginBottom: 8 },
        }, "Something went wrong"),
        React.createElement("div", {
          style: { color: "#a3a3a3", marginBottom: 12, whiteSpace: "pre-wrap", fontSize: 11 },
        }, this.state.error?.message || "Unknown error"),
        React.createElement("button", {
          onClick: this.reset,
          style: {
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "monospace",
          },
        }, "Reset"),
      );
    }

    return this.props.children;
  }
}
