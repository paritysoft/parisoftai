#!/usr/bin/env node
/**
 * Full local end-to-end run on a fresh database:
 *   1. start the Supabase-compatible test stack (tests/integration/stack.mjs)
 *   2. build the app against it and start it on port 3200
 *   3. run Playwright (all specs)
 *   4. tear everything down
 *
 * Requirements: PostgreSQL 15+ server binaries (PG_BIN) and PostgREST (POSTGREST_BIN).
 * Optional: PW_CHROMIUM_PATH to use a preinstalled Chromium.
 */
import { spawn } from "node:child_process";
import { startStack } from "../tests/integration/stack.mjs";

const PORT = 3200;
const stack = await startStack();
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: stack.url,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: stack.anonKey,
  SUPABASE_SECRET_KEY: stack.serviceKey,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
  RATE_LIMIT_SALT: "e2e-salt",
  STACK_PG_PORT: String(stack.pgPort),
  E2E_BASE_URL: `http://localhost:${PORT}`,
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_DIST_DIR: undefined,
};

// Must be async: the test gateway runs in this process, so blocking calls would deadlock it.
const run = (cmd, args) =>
  new Promise((resolve) => {
    const p = spawn(cmd, args, { env, stdio: "inherit" });
    p.on("exit", (c) => resolve(c ?? 1));
  });

let server;
let code = 1;
try {
  console.log("Building app against the test stack…");
  if ((await run("npx", ["next", "build"])) !== 0) throw new Error("build failed");
  server = spawn("npx", ["next", "start", "-p", String(PORT)], { env, stdio: "ignore", detached: true });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${PORT}/`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  const args = ["playwright", "test", ...process.argv.slice(2)];
  code = await run("npx", args);
} catch (e) {
  console.error(e);
} finally {
  if (server) {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
  }
  await stack.stop();
}
process.exit(code);
