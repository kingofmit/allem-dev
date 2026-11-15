import { PerfMetric } from "@allem-dev/core";

type VitalsCallback = (metric: PerfMetric) => void;

/** Observe Core Web Vitals using PerformanceObserver */
export function observeWebVitals(callback: VitalsCallback): () => void {
  const observers: PerformanceObserver[] = [];

  // LCP — Largest Contentful Paint
  try {
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as any;
      if (last) {
        callback({
          name: "LCP",
          value: last.startTime,
          unit: "ms",
          rating: last.startTime < 2500 ? "good" : last.startTime < 4000 ? "needs-improvement" : "poor",
          timestamp: Date.now(),
        });
      }
    });
    lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
    observers.push(lcpObs);
  } catch { /* unsupported */ }

  // FID — First Input Delay
  try {
    const fidObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        callback({
          name: "FID",
          value: fid,
          unit: "ms",
          rating: fid < 100 ? "good" : fid < 300 ? "needs-improvement" : "poor",
          timestamp: Date.now(),
        });
      }
    });
    fidObs.observe({ type: "first-input", buffered: true });
    observers.push(fidObs);
  } catch { /* unsupported */ }

  // CLS — Cumulative Layout Shift
  try {
    let clsValue = 0;
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          callback({
            name: "CLS",
            value: clsValue,
            unit: "",
            rating: clsValue < 0.1 ? "good" : clsValue < 0.25 ? "needs-improvement" : "poor",
            timestamp: Date.now(),
          });
        }
      }
    });
    clsObs.observe({ type: "layout-shift", buffered: true });
    observers.push(clsObs);
  } catch { /* unsupported */ }

  // INP — Interaction to Next Paint
  try {
    const inpObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = entry.duration;
        callback({
          name: "INP",
          value: duration,
          unit: "ms",
          rating: duration < 200 ? "good" : duration < 500 ? "needs-improvement" : "poor",
          timestamp: Date.now(),
        });
      }
    });
    inpObs.observe({ type: "event", buffered: true });
    observers.push(inpObs);
  } catch { /* unsupported */ }

  // TTFB — Time to First Byte
  try {
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const ttfb = navEntries[0].responseStart - navEntries[0].requestStart;
      callback({
        name: "TTFB",
        value: ttfb,
        unit: "ms",
        rating: ttfb < 800 ? "good" : ttfb < 1800 ? "needs-improvement" : "poor",
        timestamp: Date.now(),
      });
    }
  } catch { /* unsupported */ }

  return () => observers.forEach((o) => o.disconnect());
}
