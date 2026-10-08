#!/usr/bin/env node
/**
 * End-to-end test of the Git-backed admin → public site publishing flow.
 *
 * Copies the repo to a temp folder, then for each phase builds + starts the production server
 * (a rebuild simulates the Vercel redeploy that a GitHub commit triggers):
 *   A  empty site checks, admin login, create/publish/draft products & projects, validation
 *   B  published content appears; drafts hidden; SEO + JSON-LD in initial HTML; admin protected
 *   C  unpublish + slug change via admin
 *   D  unpublished item gone (404, listing, sitemap); old slug 308-redirects
 *
 *   npm run test:e2e:git-cms        (needs Playwright's Chromium; set PW_CHROMIUM_PATH if custom)
 */
import { execSync, spawn } from "node:child_process";
import { cpSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const repo = process.cwd();
const dir = mkdtempSync(path.join(tmpdir(), "psai-git-cms-"));
const port = process.env.PORT ?? "3300";
const base = `http://localhost:${port}`;
console.log(`→ working copy: ${dir}`);
cpSync(repo, dir, { recursive: true, filter: (src) => !/[\\/](\.next|\.git|node_modules)([\\/]|$)/.test(src.slice(repo.length)) && !/[\\/]content[\\/](projects|products)[\\/].+\.json$/.test(src) && !src.includes(`${path.sep}public${path.sep}uploads`) });
writeFileSync(path.join(dir, "content", "redirects.json"), "[]\n");
console.log("→ installing dependencies (npm ci)");
execSync("npm ci --prefer-offline --no-audit --no-fund", { cwd: dir, stdio: "ignore" });

const hash = execSync("node scripts/hash-admin-password.mjs", { cwd: dir, input: "Very-Long-Test-Passw0rd!" }).toString();
const env = Object.fromEntries(hash.split("\n").filter((l) => l.startsWith("ADMIN_")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const runEnv = { ...process.env, ...env, ADMIN_EMAIL: "admin@example.com", CMS_FILESYSTEM_WRITES: "true", NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", E2E_BASE_URL: base };

let server;
const portBusy = async () => { try { await fetch(`${base}/robots.txt`); return true; } catch { return false; } };
const stop = () => { if (server) { try { process.kill(-server.pid, "SIGTERM"); } catch {} server = undefined; } };
async function start() {
  stop();
  for (let i = 0; i < 20 && (await portBusy()); i++) await new Promise((r) => setTimeout(r, 250));
  if (await portBusy()) throw new Error(`Port ${port} is already in use by another server. Stop it or set PORT.`);
  execSync("npx next build", { cwd: dir, env: runEnv, stdio: "ignore" });
  server = spawn(path.join(dir, "node_modules", ".bin", "next"), ["start", "-p", port], { cwd: dir, env: runEnv, stdio: "ignore", detached: true });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${base}/robots.txt`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("server did not start");
}
const phase = (name) => execSync(`node ${path.join(repo, "tests/git-cms", `phase-${name}.mjs`)}`, { cwd: repo, env: runEnv, stdio: "inherit" });

let failed = false;
try {
  await start(); phase("a");
  await start(); phase("b");
  phase("c");
  await start();
  const check = async (p, expect) => {
    const r = await fetch(base + p, { redirect: "manual" });
    const pass = expect(r, r.status === 200 ? await r.text() : "");
    console.log(`${pass ? "PASS" : "FAIL"}: ${p} → ${r.status}`);
    if (!pass) failed = true;
  };
  await check("/products/focus-timer", (r) => r.status === 404);
  await check("/work/habit-tracker", (r) => r.status === 308 && r.headers.get("location")?.endsWith("/work/habit-tracker-app"));
  await check("/work/habit-tracker-app", (r) => r.status === 200);
  await check("/sitemap.xml", (r, t) => r.status === 200 && !t.includes("focus-timer") && t.includes("habit-tracker-app"));
  await check("/products", (r, t) => r.status === 200 && !t.includes("Focus Timer"));
} catch (e) {
  failed = true;
  console.error(e.message);
} finally {
  stop();
  if (!process.env.KEEP) rmSync(dir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
