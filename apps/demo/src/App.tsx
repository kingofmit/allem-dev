import React, { useState, useCallback, useEffect } from "react";
import {
  AllemDevProvider,
  AllemDevErrorBoundary,
  AllemDevProfiler,
  useAllemDevCtx,
  useTrackedState,
  useAllemDevPlugin,
} from "allem-dev";

// ─── Styles ────────────────────────────────────────────────
const page: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "32px 24px 400px",
};

const h1: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  marginBottom: 8,
  color: "#14b8a6",
};

const subtitle: React.CSSProperties = {
  color: "#737373",
  fontSize: 14,
  marginBottom: 32,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
  marginBottom: 24,
};

const card: React.CSSProperties = {
  background: "#171717",
  border: "1px solid #262626",
  borderRadius: 8,
  padding: 16,
};

const cardTitle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#a3a3a3",
  marginBottom: 12,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const btn: React.CSSProperties = {
  background: "#262626",
  border: "1px solid #404040",
  color: "#e5e5e5",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "inherit",
  transition: "background 0.15s",
};

const btnAccent: React.CSSProperties = {
  ...btn,
  background: "#14b8a6",
  border: "1px solid #14b8a6",
  color: "#fff",
};

const btnDanger: React.CSSProperties = {
  ...btn,
  background: "#dc2626",
  border: "1px solid #dc2626",
  color: "#fff",
};

const btnRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap" as const,
};

const badge: React.CSSProperties = {
  display: "inline-block",
  background: "#262626",
  border: "1px solid #404040",
  borderRadius: 12,
  padding: "2px 10px",
  fontSize: 12,
  color: "#a3a3a3",
  marginTop: 8,
};

const hint: React.CSSProperties = {
  color: "#525252",
  fontSize: 11,
  marginTop: 8,
};

// ─── Demo Components ───────────────────────────────────────

/** Network: fires real fetch calls the panel can intercept */
function NetworkDemo() {
  const [lastStatus, setLastStatus] = useState<string>("");

  const fire = useCallback(async (url: string, opts?: RequestInit) => {
    try {
      const res = await fetch(url, opts);
      setLastStatus(`${res.status} ${res.statusText}`);
    } catch (err: any) {
      setLastStatus(`Error: ${err.message}`);
    }
  }, []);

  return (
    <div style={card}>
      <div style={cardTitle}>Network</div>
      <div style={btnRow}>
        <button style={btn} onClick={() => fire("https://jsonplaceholder.typicode.com/posts/1")}>
          GET /posts/1
        </button>
        <button style={btn} onClick={() => fire("https://jsonplaceholder.typicode.com/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Hello", body: "World", userId: 1 }),
        })}>
          POST /posts
        </button>
        <button style={btn} onClick={() => fire("https://jsonplaceholder.typicode.com/404")}>
          GET /404
        </button>
        <button style={btn} onClick={() => fire("https://this-will-fail.invalid/api")}>
          Network Error
        </button>
      </div>
      {lastStatus && <div style={badge}>{lastStatus}</div>}
      <div style={hint}>Open the Network tab to see requests, headers, and timing</div>
    </div>
  );
}

/** Renders: components that re-render frequently */
function RenderDemo() {
  const [counter, setCounter] = useState(0);
  const ctx = useAllemDevCtx();

  return (
    <AllemDevProfiler id="RenderDemo" renderStore={ctx.renders}>
      <div style={card}>
        <div style={cardTitle}>Renders</div>
        <div style={btnRow}>
          <button style={btn} onClick={() => setCounter((c) => c + 1)}>
            Re-render ({counter})
          </button>
          <button style={btn} onClick={() => {
            for (let i = 0; i < 10; i++) setCounter((c) => c + 1);
          }}>
            Burst 10x
          </button>
        </div>
        <ExpensiveChild value={counter} />
        <div style={hint}>Open the Renders tab to see component render frequency and hot components</div>
      </div>
    </AllemDevProfiler>
  );
}

function ExpensiveChild({ value }: { value: number }) {
  return <div style={{ ...badge, background: value % 2 === 0 ? "#1a3a2a" : "#3a1a2a" }}>
    Child value: {value}
  </div>;
}

/** State: tracked state changes */
function StateDemo() {
  const [user, setUser] = useState({ name: "Alice", role: "admin" });
  const [items, setItems] = useState<string[]>(["apple", "banana"]);

  useTrackedState("StateDemo", "user", user);
  useTrackedState("StateDemo", "items", items);

  return (
    <div style={card}>
      <div style={cardTitle}>State</div>
      <div style={btnRow}>
        <button style={btn} onClick={() => setUser({ ...user, name: user.name === "Alice" ? "Bob" : "Alice" })}>
          Toggle Name
        </button>
        <button style={btn} onClick={() => setUser({ ...user, role: user.role === "admin" ? "viewer" : "admin" })}>
          Toggle Role
        </button>
        <button style={btn} onClick={() => setItems([...items, `item-${items.length}`])}>
          Add Item
        </button>
      </div>
      <div style={badge}>{user.name} ({user.role}) · {items.length} items</div>
      <div style={hint}>Open the State tab to see diffs between previous and next values</div>
    </div>
  );
}

/** Console: fires console methods */
function ConsoleDemo() {
  return (
    <div style={card}>
      <div style={cardTitle}>Console</div>
      <div style={btnRow}>
        <button style={btn} onClick={() => console.log("Hello from demo!", { timestamp: Date.now() })}>
          console.log
        </button>
        <button style={btn} onClick={() => console.info("ℹ️ Info message")}>
          console.info
        </button>
        <button style={{ ...btn, borderColor: "#eab308" }} onClick={() => console.warn("⚠️ Warning!", { code: 42 })}>
          console.warn
        </button>
        <button style={btnDanger} onClick={() => console.error("💥 Error!", new Error("Demo error"))}>
          console.error
        </button>
        <button style={btn} onClick={() => console.debug("🔍 Debug data", [1, 2, 3])}>
          console.debug
        </button>
      </div>
      <div style={hint}>Open the Console tab to see intercepted console output</div>
    </div>
  );
}

/** Errors: triggers different error types */
function ErrorDemo() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) throw new Error("React boundary error from demo!");

  return (
    <div style={card}>
      <div style={cardTitle}>Errors</div>
      <div style={btnRow}>
        <button style={btnDanger} onClick={() => {
          try { throw new Error("Caught runtime error"); } catch (e) { (window as any).__errorForDemo = e; }
          window.dispatchEvent(new ErrorEvent("error", {
            message: "Uncaught runtime error",
            error: new Error("Uncaught runtime error"),
            filename: "demo/App.tsx",
            lineno: 42,
            colno: 10,
          }));
        }}>
          Runtime Error
        </button>
        <button style={btnDanger} onClick={() => {
          Promise.reject(new Error("Unhandled promise rejection"));
        }}>
          Promise Rejection
        </button>
        <button style={btnDanger} onClick={() => setShouldThrow(true)}>
          Boundary Error
        </button>
      </div>
      <div style={hint}>Open the Errors tab to see stack traces and vscode:// links</div>
    </div>
  );
}

/** Perf: nothing to trigger — vitals are collected automatically */
function PerfDemo() {
  return (
    <div style={card}>
      <div style={cardTitle}>Performance</div>
      <p style={{ color: "#a3a3a3", fontSize: 13, lineHeight: 1.6 }}>
        Web Vitals (LCP, FID, CLS, INP, TTFB) are collected automatically.
        FPS and memory are tracked in real-time.
      </p>
      <div style={{ ...btnRow, marginTop: 8 }}>
        <button style={btn} onClick={() => {
          // Force a long task to see it affect FPS
          const start = performance.now();
          while (performance.now() - start < 200) { /* block */ }
        }}>
          Block Main Thread (200ms)
        </button>
        <button style={btn} onClick={() => {
          // Create layout thrashing
          const el = document.createElement("div");
          el.style.cssText = "width:100px;height:100px;background:red;position:fixed;top:0;left:0;z-index:999999";
          document.body.appendChild(el);
          setTimeout(() => el.remove(), 500);
        }}>
          Layout Shift
        </button>
      </div>
      <div style={hint}>Open the Perf tab to see vitals cards, FPS graph, and memory chart</div>
    </div>
  );
}

/** Storage: manages localStorage/sessionStorage */
function StorageDemo() {
  return (
    <div style={card}>
      <div style={cardTitle}>Storage</div>
      <div style={btnRow}>
        <button style={btn} onClick={() => {
          localStorage.setItem("demo:user", JSON.stringify({ id: 1, name: "Alice", role: "admin" }));
          localStorage.setItem("demo:prefs", JSON.stringify({ theme: "dark", lang: "en" }));
          localStorage.setItem("demo:token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo");
        }}>
          Set localStorage Items
        </button>
        <button style={btn} onClick={() => {
          sessionStorage.setItem("demo:session", JSON.stringify({ started: Date.now() }));
          sessionStorage.setItem("demo:cart", JSON.stringify([{ item: "Widget", qty: 2 }]));
        }}>
          Set sessionStorage Items
        </button>
        <button style={btn} onClick={() => {
          localStorage.removeItem("demo:user");
          localStorage.removeItem("demo:prefs");
          localStorage.removeItem("demo:token");
          sessionStorage.removeItem("demo:session");
          sessionStorage.removeItem("demo:cart");
        }}>
          Clear Demo Items
        </button>
      </div>
      <div style={hint}>Open the Storage tab to browse and edit localStorage/sessionStorage</div>
    </div>
  );
}

/** Routing: simulates navigation */
function RoutingDemo() {
  const [path, setPath] = useState(window.location.pathname);

  const navigate = useCallback((to: string) => {
    history.pushState(null, "", to);
    setPath(to);
  }, []);

  return (
    <div style={card}>
      <div style={cardTitle}>Routing</div>
      <div style={btnRow}>
        <button style={btn} onClick={() => navigate("/")}>/ (Home)</button>
        <button style={btn} onClick={() => navigate("/dashboard")}>/ dashboard</button>
        <button style={btn} onClick={() => navigate("/settings")}>/ settings</button>
        <button style={btn} onClick={() => navigate("/users/42")}>/ users/42</button>
        <button style={btn} onClick={() => history.back()}>← Back</button>
      </div>
      <div style={badge}>Current: {path}</div>
      <div style={hint}>Open the State tab and filter by "router" to see navigation history</div>
    </div>
  );
}

/** Mocking: sets up mock rules */
function MockingDemo() {
  const [status, setStatus] = useState("");

  return (
    <div style={card}>
      <div style={cardTitle}>Request Mocking</div>
      <div style={btnRow}>
        <button style={btnAccent} onClick={() => {
          try {
            const ctx = (window as any).__allemDevCtx;
            if (ctx?.mocks) {
              ctx.mocks.addRule({
                urlPattern: "jsonplaceholder.typicode.com/posts/1",
                method: "GET",
                status: 200,
                body: { id: 1, title: "Mocked!", body: "This response came from Allem Dev mock rules" },
                delay: 100,
                enabled: true,
              });
              setStatus("Mock rule added! Try GET /posts/1 now");
            }
          } catch { setStatus("Open the panel first"); }
        }}>
          Mock GET /posts/1
        </button>
        <button style={btn} onClick={() => {
          try {
            const ctx = (window as any).__allemDevCtx;
            if (ctx?.mocks) { ctx.mocks.clear(); setStatus("Mocks cleared"); }
          } catch { /* ignore */ }
        }}>
          Clear Mocks
        </button>
      </div>
      {status && <div style={badge}>{status}</div>}
      <div style={hint}>Add a mock rule, then fire the corresponding request to see it intercepted</div>
    </div>
  );
}

/** Plugin: registers a custom tab */
function PluginDemo() {
  useAllemDevPlugin({
    id: "demo-plugin",
    label: "Demo Plugin",
    icon: "plug",
    render: () => (
      <div style={{ padding: 20, color: "#a3a3a3", fontFamily: "monospace", fontSize: 13 }}>
        <h3 style={{ color: "#14b8a6", marginBottom: 12 }}>Custom Plugin Tab</h3>
        <p>This tab was added via the <code style={{ color: "#60a5fa" }}>useAllemDevPlugin</code> hook.</p>
        <p style={{ marginTop: 8 }}>
          Plugins can render any React content here — charts, logs, custom inspectors, etc.
        </p>
        <pre style={{ background: "#1a1a1a", padding: 12, borderRadius: 6, marginTop: 16, fontSize: 11 }}>
{`useAllemDevPlugin({
  id: "my-plugin",
  label: "My Tab",
  icon: "plug",
  render: () => <MyCustomContent />,
});`}
        </pre>
      </div>
    ),
  });

  return (
    <div style={card}>
      <div style={cardTitle}>Plugin API</div>
      <p style={{ color: "#a3a3a3", fontSize: 13 }}>
        A custom "Demo Plugin" tab has been registered in the panel.
      </p>
      <div style={hint}>Look for the "Demo Plugin" tab in the panel</div>
    </div>
  );
}

/** Exposes context to window for mocking demo */
function ContextExposer() {
  const ctx = useAllemDevCtx();
  useEffect(() => {
    (window as any).__allemDevCtx = ctx;
    return () => { delete (window as any).__allemDevCtx; };
  }, [ctx]);
  return null;
}

// ─── Error Boundary Wrapper ───────────────────────────────
function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const ctx = useAllemDevCtx();
  return (
    <AllemDevErrorBoundary errorStore={ctx.errors}>
      {children}
    </AllemDevErrorBoundary>
  );
}

// ─── Main App ──────────────────────────────────────────────
export default function App() {
  return (
    <AllemDevProvider>
      <div style={page}>
        <h1 style={h1}>Allem Dev — Demo</h1>
        <p style={subtitle}>
          Press <kbd style={{ background: "#262626", padding: "2px 6px", borderRadius: 4, border: "1px solid #404040" }}>Ctrl+Shift+D</kbd> to
          toggle the dev panel, or click the button in the bottom-right corner.
        </p>

        <div style={grid}>
          <NetworkDemo />
          <ConsoleDemo />
          <ErrorBoundaryWrapper>
            <ErrorDemo />
          </ErrorBoundaryWrapper>
          <RenderDemo />
          <StateDemo />
          <PerfDemo />
          <RoutingDemo />
          <StorageDemo />
          <MockingDemo />
          <PluginDemo />
        </div>

        <div style={{ ...card, background: "#0d1117", borderColor: "#1a3a2a" }}>
          <div style={{ ...cardTitle, color: "#14b8a6" }}>Quick Start</div>
          <pre style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: "#a3a3a3",
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            overflow: "auto",
          }}>
{`npm install allem-dev

// In your app:
import { AllemDevProvider } from "allem-dev";

function App() {
  return (
    <AllemDevProvider>
      <YourApp />
    </AllemDevProvider>
  );
}`}
          </pre>
        </div>
      </div>

      <ContextExposer />
    </AllemDevProvider>
  );
}
