import React, { useRef, useEffect, useState, useCallback } from "react";
import type { CSSProperties } from "react";
import type { PerfMetric } from "@allem-dev/core";
import type { MemorySnapshot } from "@allem-dev/perf";
import { useAllemDevCtx } from "../context";
import { useFpsHistory } from "../hooks/useFpsHistory";
import { ratingColor, cardStyle } from "../theme";
import { MAX_MEMORY_SAMPLES } from "../constants";

const h = React.createElement;

/* ---------- VitalsCards ---------- */

function VitalsCards({ vitals, theme }: { vitals: PerfMetric[]; theme: any }) {
  if (vitals.length === 0) {
    return h(
      "div",
      {
        style: {
          display: "flex",
          gap: 8,
          padding: "8px",
          flexWrap: "wrap",
        } as CSSProperties,
      },
      h(
        "div",
        {
          style: {
            ...cardStyle(theme),
            minWidth: 100,
            textAlign: "center",
          } as CSSProperties,
        },
        h("div", { style: { fontSize: 10, color: theme.textMuted } as CSSProperties }, "Web Vitals"),
        h("div", { style: { fontSize: 14, color: theme.textFaint, marginTop: 4 } as CSSProperties }, "Waiting\u2026")
      )
    );
  }

  const cards = vitals.map((metric) => {
    const color = ratingColor(metric.rating, theme);
    return h(
      "div",
      {
        key: metric.name,
        style: {
          ...cardStyle(theme),
          minWidth: 100,
          textAlign: "center",
        } as CSSProperties,
      },
      h("div", { style: { fontSize: 10, color: theme.textMuted } as CSSProperties }, metric.name),
      h(
        "div",
        { style: { fontSize: 18, fontWeight: "bold", color, marginTop: 2 } as CSSProperties },
        `${metric.value.toFixed(metric.unit === "ms" ? 0 : 2)}`,
        h("span", { style: { fontSize: 10, fontWeight: "normal", marginLeft: 2 } as CSSProperties }, metric.unit)
      )
    );
  });

  return h("div", { style: { display: "flex", gap: 8, padding: "8px", flexWrap: "wrap" } as CSSProperties }, ...cards);
}

/* ---------- FpsGraph ---------- */

function FpsGraph({ fps, theme }: { fps: number; theme: any }) {
  const history = useFpsHistory(fps);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const W = width;
    const H = 100;
    canvas.width = W;
    canvas.height = H;

    ctx2d.clearRect(0, 0, W, H);

    // reference lines
    ctx2d.setLineDash([4, 4]);
    ctx2d.lineWidth = 1;
    ctx2d.strokeStyle = theme.borderLight;

    // 60 FPS line
    const y60 = H - (60 / 120) * H;
    ctx2d.beginPath();
    ctx2d.moveTo(0, y60);
    ctx2d.lineTo(W, y60);
    ctx2d.stroke();

    // 30 FPS line
    const y30 = H - (30 / 120) * H;
    ctx2d.beginPath();
    ctx2d.moveTo(0, y30);
    ctx2d.lineTo(W, y30);
    ctx2d.stroke();

    ctx2d.setLineDash([]);

    // plot FPS line
    if (history.length > 1) {
      const step = W / 59; // 60 samples
      for (let i = 1; i < history.length; i++) {
        const prevFps = Math.min(history[i - 1], 120);
        const curFps = Math.min(history[i], 120);
        const avgSeg = (prevFps + curFps) / 2;

        let color: string;
        if (avgSeg > 50) color = theme.success;
        else if (avgSeg >= 30) color = theme.warning;
        else color = theme.error;

        const x1 = (i - 1) * step;
        const y1 = H - (prevFps / 120) * H;
        const x2 = i * step;
        const y2 = H - (curFps / 120) * H;

        ctx2d.beginPath();
        ctx2d.strokeStyle = color;
        ctx2d.lineWidth = 2;
        ctx2d.moveTo(x1, y1);
        ctx2d.lineTo(x2, y2);
        ctx2d.stroke();
      }
    }

    // labels
    ctx2d.font = "10px monospace";
    ctx2d.fillStyle = theme.textMuted;
    ctx2d.fillText("FPS", 4, 12);

    const currentFps = history.length > 0 ? history[history.length - 1] : 0;
    const fpsText = `${Math.round(currentFps)}`;
    const textWidth = ctx2d.measureText(fpsText).width;
    ctx2d.fillStyle = currentFps > 50 ? theme.success : currentFps >= 30 ? theme.warning : theme.error;
    ctx2d.font = "bold 12px monospace";
    ctx2d.fillText(fpsText, W - textWidth - 6, 14);
  }, [history, width, theme]);

  return h(
    "div",
    {
      ref: wrapRef,
      style: { padding: "4px 8px", width: "100%" } as CSSProperties,
    },
    h("canvas", { ref: canvasRef, style: { width: "100%", height: 100, display: "block" } as CSSProperties })
  );
}

/* ---------- MemoryChart ---------- */

function MemoryChart({ memory, theme }: { memory: MemorySnapshot | null; theme: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const samplesRef = useRef<MemorySnapshot[]>([]);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Append memory snapshot
  useEffect(() => {
    if (!memory) return;
    const buf = samplesRef.current;
    buf.push(memory);
    if (buf.length > MAX_MEMORY_SAMPLES) buf.shift();
  }, [memory]);

  // Draw
  useEffect(() => {
    if (!memory) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const W = width;
    const H = 80;
    canvas.width = W;
    canvas.height = H;
    ctx2d.clearRect(0, 0, W, H);

    const samples = samplesRef.current;
    if (samples.length === 0) return;

    const maxHeap = Math.max(...samples.map((s) => s.jsHeapSizeLimit));
    const step = W / (MAX_MEMORY_SAMPLES - 1);

    // Area fill for usedJSHeapSize
    ctx2d.beginPath();
    ctx2d.moveTo(0, H);
    for (let i = 0; i < samples.length; i++) {
      const x = i * step;
      const y = H - (samples[i].usedJSHeapSize / maxHeap) * H;
      ctx2d.lineTo(x, y);
    }
    ctx2d.lineTo((samples.length - 1) * step, H);
    ctx2d.closePath();
    ctx2d.fillStyle = theme.accent + "40"; // semi-transparent
    ctx2d.fill();

    // Line for totalJSHeapSize
    ctx2d.beginPath();
    ctx2d.strokeStyle = theme.textMuted;
    ctx2d.lineWidth = 1;
    ctx2d.setLineDash([3, 3]);
    for (let i = 0; i < samples.length; i++) {
      const x = i * step;
      const y = H - (samples[i].totalJSHeapSize / maxHeap) * H;
      if (i === 0) ctx2d.moveTo(x, y);
      else ctx2d.lineTo(x, y);
    }
    ctx2d.stroke();
    ctx2d.setLineDash([]);

    // Line for usedJSHeapSize
    ctx2d.beginPath();
    ctx2d.strokeStyle = theme.accent;
    ctx2d.lineWidth = 2;
    for (let i = 0; i < samples.length; i++) {
      const x = i * step;
      const y = H - (samples[i].usedJSHeapSize / maxHeap) * H;
      if (i === 0) ctx2d.moveTo(x, y);
      else ctx2d.lineTo(x, y);
    }
    ctx2d.stroke();

    // Text overlay
    const latest = samples[samples.length - 1];
    const usedMB = (latest.usedJSHeapSize / 1048576).toFixed(1);
    const totalMB = (latest.totalJSHeapSize / 1048576).toFixed(1);
    const pct = ((latest.usedJSHeapSize / latest.totalJSHeapSize) * 100).toFixed(0);
    const text = `${usedMB} MB / ${totalMB} MB (${pct}%)`;
    ctx2d.font = "bold 11px monospace";
    ctx2d.fillStyle = theme.text;
    ctx2d.fillText(text, 6, 14);
  }, [memory, width, theme]);

  if (memory === null) {
    return h(
      "div",
      { style: { padding: "8px", color: theme.textFaint, fontSize: 11 } as CSSProperties },
      "Memory tracking not available (Chrome only)"
    );
  }

  return h(
    "div",
    {
      ref: wrapRef,
      style: { padding: "4px 8px", width: "100%" } as CSSProperties,
    },
    h("div", { style: { fontSize: 10, color: theme.textMuted, marginBottom: 2 } as CSSProperties }, "Memory"),
    h("canvas", { ref: canvasRef, style: { width: "100%", height: 80, display: "block" } as CSSProperties })
  );
}

/* ---------- main component ---------- */

function PerfTab() {
  const ctx = useAllemDevCtx();
  const { theme } = ctx;

  return h(
    "div",
    { style: { height: "100%", overflow: "auto" } as CSSProperties },
    h(VitalsCards, { vitals: ctx.vitals, theme }),
    h(FpsGraph, { fps: ctx.fps, theme }),
    h(MemoryChart, { memory: ctx.memory, theme })
  );
}

export default PerfTab;
