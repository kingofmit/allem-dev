import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { PanelManager, PanelConfig, DEFAULT_CONFIG, registerShortcut } from "@allem-dev/core";
import { NetworkStore, interceptFetch, interceptXHR } from "@allem-dev/network";
import { RenderStore } from "@allem-dev/renders";
import { StateStore } from "@allem-dev/state";
import { ErrorStore, installErrorCatcher, interceptConsoleErrors } from "@allem-dev/errors";
import { observeWebVitals, trackFPS, trackMemory, MemorySnapshot } from "@allem-dev/perf";
import type { PerfMetric } from "@allem-dev/core";

export interface AllemDevContext {
  panel: PanelManager;
  network: NetworkStore;
  renders: RenderStore;
  state: StateStore;
  errors: ErrorStore;
  vitals: PerfMetric[];
  fps: number;
  memory: MemorySnapshot | null;
  toggle: () => void;
  isVisible: boolean;
}

/** Hook that initializes all Allem Dev subsystems */
export function useAllemDev(config: Partial<PanelConfig> = {}): AllemDevContext {
  const panelRef = useRef<PanelManager>(new PanelManager({ ...DEFAULT_CONFIG, ...config }));
  const networkRef = useRef<NetworkStore>(new NetworkStore(config.maxEntries));
  const rendersRef = useRef<RenderStore>(new RenderStore(config.maxEntries));
  const stateRef = useRef<StateStore>(new StateStore(config.maxEntries));
  const errorsRef = useRef<ErrorStore>(new ErrorStore(config.maxEntries));
  const vitalsRef = useRef<PerfMetric[]>([]);
  const fpsRef = useRef(0);
  const memoryRef = useRef<MemorySnapshot | null>(null);

  const isVisible = useSyncExternalStore(
    (cb) => panelRef.current.subscribe(cb),
    () => panelRef.current.isVisible(),
  );

  const toggle = useCallback(() => panelRef.current.toggle(), []);

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // Keyboard shortcut
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    cleanups.push(registerShortcut(fullConfig.shortcut, toggle));

    // Network interceptors
    cleanups.push(interceptFetch(networkRef.current));
    cleanups.push(interceptXHR(networkRef.current));

    // Error catchers
    cleanups.push(installErrorCatcher(errorsRef.current));
    cleanups.push(interceptConsoleErrors(errorsRef.current));

    // Web Vitals
    cleanups.push(observeWebVitals((metric) => {
      vitalsRef.current = [...vitalsRef.current.filter((v) => v.name !== metric.name), metric];
    }));

    // FPS tracking
    cleanups.push(trackFPS((fps) => { fpsRef.current = fps; }));

    // Memory tracking
    cleanups.push(trackMemory((snapshot) => { memoryRef.current = snapshot; }));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return {
    panel: panelRef.current,
    network: networkRef.current,
    renders: rendersRef.current,
    state: stateRef.current,
    errors: errorsRef.current,
    vitals: vitalsRef.current,
    fps: fpsRef.current,
    memory: memoryRef.current,
    toggle,
    isVisible,
  };
}
