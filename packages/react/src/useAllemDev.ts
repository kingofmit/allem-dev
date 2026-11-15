import { useEffect, useRef, useCallback, useSyncExternalStore } from "react";
import { PanelManager, PanelConfig, DEFAULT_CONFIG, registerShortcut } from "@allem-dev/core";
import { NetworkStore, interceptFetch, interceptXHR } from "@allem-dev/network";
import { RenderStore } from "@allem-dev/renders";
import { StateStore } from "@allem-dev/state";
import { ErrorStore, installErrorCatcher, interceptConsoleErrors } from "@allem-dev/errors";
import { observeWebVitals, trackFPS, trackMemory, MemorySnapshot } from "@allem-dev/perf";
import type { PerfMetric } from "@allem-dev/core";
import { SimpleStore } from "./SimpleStore";
import { getTheme, ThemeTokens } from "./theme";
import { ConsoleStore } from "./console/ConsoleStore";
import { interceptConsole } from "./console/interceptor";
import { MockStore } from "./mocking/MockStore";
import { installMockInterceptor } from "./mocking/mockInterceptor";
import { PluginManager } from "./plugins/PluginManager";
import { trackRouteChanges } from "./routing/routeTracker";
import type { AllemDevContextValue } from "./context";

/** Hook that initializes all Allem Dev subsystems */
export function useAllemDev(config: Partial<PanelConfig> = {}): AllemDevContextValue {
  const fullConfig = useRef({ ...DEFAULT_CONFIG, ...config }).current;

  const panelRef = useRef(new PanelManager(fullConfig));
  const networkRef = useRef(new NetworkStore(fullConfig.maxEntries));
  const rendersRef = useRef(new RenderStore(fullConfig.maxEntries));
  const stateRef = useRef(new StateStore(fullConfig.maxEntries));
  const errorsRef = useRef(new ErrorStore(fullConfig.maxEntries));
  const consoleRef = useRef(new ConsoleStore(fullConfig.maxEntries));
  const mocksRef = useRef(new MockStore());
  const pluginsRef = useRef(new PluginManager());
  const vitalsStore = useRef(new SimpleStore<PerfMetric[]>([])).current;
  const fpsStore = useRef(new SimpleStore<number>(0)).current;
  const memoryStore = useRef(new SimpleStore<MemorySnapshot | null>(null)).current;

  const isVisible = useSyncExternalStore(
    (cb) => panelRef.current.subscribe(cb),
    () => panelRef.current.isVisible(),
  );

  const activeTab = useSyncExternalStore(
    (cb) => panelRef.current.subscribe(cb),
    () => panelRef.current.getActiveTab(),
  );

  const vitals = useSyncExternalStore(vitalsStore.subscribe, vitalsStore.get);
  const fps = useSyncExternalStore(fpsStore.subscribe, fpsStore.get);
  const memory = useSyncExternalStore(memoryStore.subscribe, memoryStore.get);

  const theme = getTheme(fullConfig.theme);
  const toggle = useCallback(() => panelRef.current.toggle(), []);

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // Keyboard shortcut
    cleanups.push(registerShortcut(fullConfig.shortcut, toggle));

    // Mock interceptor (must be before network interceptors so mocked
    // responses are also logged by the network store)
    cleanups.push(installMockInterceptor(mocksRef.current));

    // Network interceptors
    cleanups.push(interceptFetch(networkRef.current));
    cleanups.push(interceptXHR(networkRef.current));

    // Error catchers
    cleanups.push(installErrorCatcher(errorsRef.current));
    cleanups.push(interceptConsoleErrors(errorsRef.current));

    // Console interceptor (captures log/info/warn/debug in addition to errors)
    cleanups.push(interceptConsole(consoleRef.current));

    // Web Vitals
    cleanups.push(observeWebVitals((metric) => {
      vitalsStore.set([...vitalsStore.get().filter((v) => v.name !== metric.name), metric]);
    }));

    // FPS tracking
    cleanups.push(trackFPS((value) => { fpsStore.set(value); }));

    // Memory tracking
    cleanups.push(trackMemory((snapshot) => { memoryStore.set(snapshot); }));

    // Route change tracking
    cleanups.push(trackRouteChanges(stateRef.current));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return {
    panel: panelRef.current,
    network: networkRef.current,
    renders: rendersRef.current,
    state: stateRef.current,
    errors: errorsRef.current,
    console: consoleRef.current,
    mocks: mocksRef.current,
    plugins: pluginsRef.current,
    vitals,
    fps,
    memory,
    theme,
    toggle,
    isVisible,
    activeTab,
  };
}
