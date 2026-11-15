/** localStorage keys for panel persistence */
export const LS_KEY_POSITION = "allem-dev:position";
export const LS_KEY_HEIGHT = "allem-dev:height";
export const LS_KEY_WIDTH = "allem-dev:width";
export const LS_KEY_THEME = "allem-dev:theme";
export const LS_KEY_TAB = "allem-dev:tab";

/** Panel z-index */
export const Z_INDEX = 99999;

/** FPS history ring buffer size (60 = 60 seconds at 1 sample/sec) */
export const MAX_FPS_SAMPLES = 60;

/** Memory history ring buffer size */
export const MAX_MEMORY_SAMPLES = 30;

/** Throttle interval for store-to-UI updates (ms) */
export const THROTTLE_MS = 100;

/** Default row height for virtual lists */
export const VIRTUAL_ROW_HEIGHT = 32;

/** Panel resize constraints */
export const MIN_PANEL_SIZE = 200;
export const MAX_PANEL_RATIO = 0.8;
