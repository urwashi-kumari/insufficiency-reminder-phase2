// @ts-check
const { defineConfig } = require("@playwright/test");

const PORT = process.env.UI_TEST_PORT || 4056;

module.exports = defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.js",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure"
  },
  // Playwright starts the real app itself before the tests run, and tears it
  // down afterwards - so `npm run test:ui` needs nothing else running.
  webServer: {
    command: "node server.js",
    port: Number(PORT),
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
    timeout: 15000
  }
});
