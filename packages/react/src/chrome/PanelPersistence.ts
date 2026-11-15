import { LS_KEY_POSITION, LS_KEY_HEIGHT, LS_KEY_WIDTH, LS_KEY_THEME, LS_KEY_TAB } from "../constants";

export interface PanelPersistedState {
  position?: "bottom" | "right" | "floating";
  height?: number;
  width?: number;
  theme?: "dark" | "light" | "auto";
  activeTab?: string;
}

export function savePanelState(state: Partial<PanelPersistedState>): void {
  try {
    if (state.position !== undefined) localStorage.setItem(LS_KEY_POSITION, state.position);
    if (state.height !== undefined) localStorage.setItem(LS_KEY_HEIGHT, String(state.height));
    if (state.width !== undefined) localStorage.setItem(LS_KEY_WIDTH, String(state.width));
    if (state.theme !== undefined) localStorage.setItem(LS_KEY_THEME, state.theme);
    if (state.activeTab !== undefined) localStorage.setItem(LS_KEY_TAB, state.activeTab);
  } catch {
    // localStorage unavailable (private browsing, SSR)
  }
}

export function loadPanelState(): PanelPersistedState {
  const state: PanelPersistedState = {};
  try {
    const pos = localStorage.getItem(LS_KEY_POSITION);
    if (pos === "bottom" || pos === "right" || pos === "floating") state.position = pos;

    const h = localStorage.getItem(LS_KEY_HEIGHT);
    if (h) { const n = parseInt(h, 10); if (!isNaN(n)) state.height = n; }

    const w = localStorage.getItem(LS_KEY_WIDTH);
    if (w) { const n = parseInt(w, 10); if (!isNaN(n)) state.width = n; }

    const theme = localStorage.getItem(LS_KEY_THEME);
    if (theme === "dark" || theme === "light" || theme === "auto") state.theme = theme;

    const tab = localStorage.getItem(LS_KEY_TAB);
    if (tab) state.activeTab = tab;
  } catch {
    // localStorage unavailable
  }
  return state;
}
