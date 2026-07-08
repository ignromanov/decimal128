import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.{test,spec}.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["node_modules/", "dist/", "**/*.d.ts"],
    },
  },
  resolve: {
    alias: { "@": "/src", "~": "/tests" },
  },
});
