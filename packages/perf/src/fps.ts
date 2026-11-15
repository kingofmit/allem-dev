type FPSCallback = (fps: number) => void;

/** Track frames per second */
export function trackFPS(callback: FPSCallback, interval = 1000): () => void {
  let frameCount = 0;
  let lastTime = performance.now();
  let rafId: number;
  let running = true;

  function tick() {
    if (!running) return;
    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= interval) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      callback(fps);
      frameCount = 0;
      lastTime = currentTime;
    }
    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  return () => {
    running = false;
    cancelAnimationFrame(rafId);
  };
}
