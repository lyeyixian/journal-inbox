import { defineConfig } from "vitest/config";

// Four projects, one per test layer. `pnpm test` runs unit and acceptance; the
// rest run on demand through their own scripts. See docs/DEVELOPMENT.md.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "acceptance",
          include: ["test/acceptance/**/*.test.ts"],
          setupFiles: ["test/harness/no-network.ts"],
        },
      },
      {
        test: {
          name: "contract",
          include: ["test/contract/**/*.contract.test.ts"],
          testTimeout: 30_000,
        },
      },
    ],
  },
});
