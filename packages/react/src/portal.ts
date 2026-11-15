import { Z_INDEX } from "./constants";

let container: HTMLElement | null = null;

/** Lazily creates and returns the portal container for the dev panel. SSR-safe. */
export function getPortalContainer(): HTMLElement {
  if (container) return container;
  const el = document.createElement("div");
  el.id = "allem-dev-root";
  el.style.position = "fixed";
  el.style.zIndex = String(Z_INDEX);
  el.style.top = "0";
  el.style.left = "0";
  el.style.width = "0";
  el.style.height = "0";
  el.style.overflow = "visible";
  el.style.pointerEvents = "none";
  document.body.appendChild(el);
  container = el;
  return el;
}
