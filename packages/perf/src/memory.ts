export interface MemorySnapshot {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercent: number;
  timestamp: number;
}

/** Get current memory usage (Chrome only) */
export function getMemorySnapshot(): MemorySnapshot | null {
  const perf = performance as any;
  if (!perf.memory) return null;
  return {
    usedJSHeapSize: perf.memory.usedJSHeapSize,
    totalJSHeapSize: perf.memory.totalJSHeapSize,
    jsHeapSizeLimit: perf.memory.jsHeapSizeLimit,
    usagePercent: (perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit) * 100,
    timestamp: Date.now(),
  };
}

/** Track memory usage over time */
export function trackMemory(callback: (snapshot: MemorySnapshot) => void, interval = 2000): () => void {
  const timer = setInterval(() => {
    const snapshot = getMemorySnapshot();
    if (snapshot) callback(snapshot);
  }, interval);
  return () => clearInterval(timer);
}
