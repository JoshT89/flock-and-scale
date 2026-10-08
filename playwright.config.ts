import { defineConfig, devices } from "@playwright/test";
const target = process.env.TEST_BASE_URL;
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  timeout: 30000,
  use: {
    baseURL: target ?? "http://localhost:3108",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1100 },
      },
    },
  ],
  webServer: target
    ? undefined
    : {
        command: "npm run start -- --port 3108",
        url: "http://localhost:3108",
        reuseExistingServer: false,
        timeout: 60000,
      },
});
