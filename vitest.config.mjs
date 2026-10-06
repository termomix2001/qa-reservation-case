import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: ["src/main.ts"],
      include: ["src/**/*.ts"],
      provider: "v8",
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    globals: true,
    include: ["test/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
    pool: "forks",
  },
});
