import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@": path.resolve(dirname, "./src"),
          },
        },
        test: {
          include: ["__tests__/**/*.test.ts"],
          environment: "node",
          globals: true,
          pool: "forks",
          poolOptions: {
            forks: {
              singleFork: true,
            },
          },
        },
      },
      {
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
