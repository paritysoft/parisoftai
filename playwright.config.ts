import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against an already-running app (E2E_BASE_URL, default http://localhost:3200).
 * Admin/CMS tests additionally need the local Supabase-compatible stack (see scripts/e2e-local.mjs),
 * signalled by STACK_PG_PORT; without it they are skipped.
 */
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3200",
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : undefined,
  },
  // Public suites run first; the admin suite mutates content (publishes, edits the homepage).
  projects: [
    { name: "public", testMatch: /(public|contact|a11y)\.spec\.ts/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "admin", testMatch: /admin\.spec\.ts/, dependencies: ["public"], use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
});
