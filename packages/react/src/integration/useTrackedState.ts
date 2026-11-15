import { useEffect, useRef } from "react";
import { useAllemDevCtx } from "../context";

/**
 * Hook for manual state tracking. Records state changes to the Allem Dev
 * state store whenever the value changes.
 *
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   useTrackedState("Counter", "count", count);
 *   return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
 * }
 * ```
 */
export function useTrackedState(storeName: string, key: string, value: unknown): void {
  const { state } = useAllemDevCtx();
  const prevRef = useRef<unknown>(value);
  const initialRef = useRef(true);

  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      prevRef.current = value;
      return;
    }

    if (!Object.is(prevRef.current, value)) {
      state.record({
        store: storeName,
        key,
        timestamp: Date.now(),
        previousValue: prevRef.current,
        nextValue: value,
      });
      prevRef.current = value;
    }
  }, [value, storeName, key, state]);
}
