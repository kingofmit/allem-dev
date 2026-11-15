<p align="center">
  <img src=".github/AllemDev.png" alt="Allem Dev" />
</p>

<p align="center">
  <a href="https://doi.org/10.5281/zenodo.24244565"><img src="https://zenodo.org/badge/DOI/10.5281/zenodo.24244565.svg" alt="DOI" /></a>
  <a href="https://www.npmjs.com/package/allem-dev"><img src="https://img.shields.io/npm/v/allem-dev.svg" alt="npm version" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/react-%3E%3D18-61dafb" alt="React 18+" />
  <img src="https://img.shields.io/badge/typescript-strict-blue" alt="TypeScript" />
</p>

The floating dev panel for React. API inspector, re-render tracker, state timeline, performance profiler, and error catcher -- all in one import.

## Quick Start

```bash
npm install allem-dev
```

```tsx
import { AllemDev } from "allem-dev";

function App() {
  return (
    <>
      <YourApp />
      <AllemDev />
    </>
  );
}
```

**Toggle with `Ctrl+Shift+D`** (or `Cmd+Shift+D` on Mac). That's it.

## What You Get

| Tab | What It Does |
|-----|-------------|
| **Network** | Intercepts `fetch()` and `XMLHttpRequest`. Shows method, URL, status, timing, headers, request/response bodies. Expandable rows with JSON viewer. Filter by method, status, or URL. Copy as cURL. |
| **Renders** | Tracks React component re-renders via the Profiler API. Timeline view and hot components heatmap. Shows render count, duration, and reason (mount/update). |
| **State** | Timeline of state changes with previous/next value diffs. Auto-tracks route changes via `history.pushState`. Manual tracking with `useTrackedState()` hook. |
| **Perf** | Core Web Vitals (LCP, FID, CLS, INP, TTFB) with color-coded ratings. Live FPS graph (60-second history). JS heap memory chart (Chrome). |
| **Errors** | Catches runtime errors, unhandled rejections, and `console.error`. Parses stack traces with clickable `vscode://` file links. Groups duplicate errors. |
| **Console** | Intercepts `console.log`, `info`, `warn`, `error`, `debug`. Filter by level. Expandable entries with full argument inspection. |
| **Storage** | Browse and inspect `localStorage` and `sessionStorage`. Filter by key. Expand entries to see parsed JSON. Copy or delete values. |

## Provider Pattern

If you need access to Allem Dev stores from your own components, wrap your app with `AllemDevProvider`:

```tsx
import { AllemDevProvider, useAllemDevCtx } from "allem-dev";

function App() {
  return (
    <AllemDevProvider>
      <YourApp />
    </AllemDevProvider>
  );
}

// Access stores anywhere inside the provider:
function MyComponent() {
  const { network, errors, renders } = useAllemDevCtx();
  // ...
}
```

## Configuration

```tsx
<AllemDev
  config={{
    shortcut: "ctrl+shift+d",   // keyboard shortcut to toggle
    position: "bottom",          // "bottom" | "right" | "floating"
    height: 350,                 // panel height in pixels (bottom/floating)
    width: 520,                  // panel width in pixels (right)
    theme: "dark",               // "dark" | "light" | "auto"
    maxEntries: 500,             // max entries per store
    enableInProduction: false,   // auto-disabled in production
  }}
/>
```

## Error Boundary

Wrap components to catch React rendering errors and report them to the Errors tab:

```tsx
import { AllemDevErrorBoundary, useAllemDevCtx } from "allem-dev";

function App() {
  const { errors } = useAllemDevCtx();
  return (
    <AllemDevErrorBoundary errorStore={errors} fallback={<p>Something broke</p>}>
      <RiskyComponent />
    </AllemDevErrorBoundary>
  );
}
```

## Render Profiling

Wrap components to auto-track their renders in the Renders tab:

```tsx
import { AllemDevProfiler, useAllemDevCtx } from "allem-dev";

function App() {
  const { renders } = useAllemDevCtx();
  return (
    <AllemDevProfiler id="Dashboard" renderStore={renders}>
      <Dashboard />
    </AllemDevProfiler>
  );
}
```

## State Tracking

Track any value and see diffs in the State tab:

```tsx
import { useTrackedState } from "allem-dev";

function Counter() {
  const [count, setCount] = useState(0);
  useTrackedState("Counter", "count", count);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

Route changes are tracked automatically via `history.pushState` and `popstate`.

## Request Mocking

Mock API responses programmatically:

```tsx
const { mocks } = useAllemDevCtx();

mocks.addRule({
  urlPattern: "/api/users",
  method: "GET",
  status: 200,
  body: [{ id: 1, name: "Alice" }],
  delay: 100,
  enabled: true,
});
```

Mocked responses are logged in the Network tab like real requests.

## Plugin API

Add custom tabs to the panel:

```tsx
import { useAllemDevPlugin } from "allem-dev";

function MyPlugin() {
  useAllemDevPlugin({
    id: "my-tab",
    label: "My Tab",
    icon: "plug",
    render: () => <div>Custom content here</div>,
  });
  return null;
}
```

## Panel Features

- **Resizable** -- drag the edge to resize
- **Three positions** -- bottom, right, or floating (cycle with the position button)
- **Theme toggle** -- dark, light, or auto (follows system preference)
- **Keyboard shortcut** -- `Ctrl+Shift+D` to toggle (configurable)
- **Persistence** -- panel position, size, theme, and active tab saved to localStorage
- **SSR-safe** -- returns null on server, no window access during SSR
- **Portal isolation** -- panel renders in a separate DOM root, won't cause re-renders in your app

## Packages

| Package | Description |
|---------|-------------|
| `allem-dev` | The `<AllemDev />` React component -- one import to get everything |
| `@allem-dev/core` | Panel shell, keyboard shortcuts, event bus, types |
| `@allem-dev/network` | Fetch/XHR interceptor and request store |
| `@allem-dev/renders` | Re-render tracker and profiler callbacks |
| `@allem-dev/state` | State change timeline and value differ |
| `@allem-dev/perf` | Web Vitals, FPS counter, memory tracker |
| `@allem-dev/errors` | Error catcher, console interceptor, stack parser |

## Zero Overhead in Production

Allem Dev automatically disables itself when `NODE_ENV === "production"`. No interceptors, no DOM, no bundle impact. To force-enable, set `enableInProduction: true`.

## Development

```bash
git clone https://github.com/kingofmit/allem-dev.git
cd allem-dev
pnpm install
pnpm build
pnpm test         # 174 tests
pnpm --filter allem-dev-demo dev   # demo at localhost:3000
```

## Tech Stack

- [React](https://react.dev/) 18+ (hooks, `useSyncExternalStore`, portals)
- [TypeScript](https://www.typescriptlang.org/) (strict mode)
- [Turborepo](https://turbo.build/) + [pnpm](https://pnpm.io/) workspaces
- [Lucide](https://lucide.dev/) icons
- Zero CSS -- all inline styles
- Zero runtime dependencies beyond React peer dep + Lucide

## Support

If you find Allem Dev useful, consider supporting its development:

<a href="https://buymeacoffee.com/kingofmit" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" /></a>

## License

[MIT](./LICENSE) - [Ahmed Allem](https://kingallem.com)
