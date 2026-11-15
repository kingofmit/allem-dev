import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    pool: "threads",
    include: ["packages/**/*.test.ts"],
  },
});
