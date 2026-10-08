#!/usr/bin/env node
/**
 * Local Supabase-compatible test stack (no Docker required):
 *   PostgreSQL (throwaway cluster) + PostgREST + a small gateway that implements the subset of
 *   Supabase Auth and Storage the app uses. RLS policies are the real ones from supabase/migrations.
 *
 * This is a TEST HARNESS ONLY. It is not a Supabase replacement and is never used in production.
 *
 * Usage: node tests/integration/stack.mjs   (prints env vars, keeps running until Ctrl+C)
 * Requires: PostgreSQL server binaries (PG_BIN) and a PostgREST binary (POSTGREST_BIN).
 */
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir, userInfo } from "node:os";
import { join, resolve } from "node:path";
import { SignJWT, jwtVerify } from "jose";
import pg from "pg";

const root = resolve(import.meta.dirname, "../..");
const JWT_SECRET = "local-test-jwt-secret-that-is-at-least-32-characters";
const secretKey = new TextEncoder().encode(JWT_SECRET);
export const TEST_PASSWORD = "Test-password-123!";
export const TEST_USERS = {
  superadmin: { email: "owner@test.local", role: "super_admin", name: "Olivia Owner" },
  admin: { email: "admin@test.local", role: "admin", name: "Adam Admin" },
  editor: { email: "editor@test.local", role: "editor", name: "Erin Editor" },
};

const debianPg = existsSync("/usr/lib/postgresql") ? readdirSync("/usr/lib/postgresql").sort((a, b) => Number(b) - Number(a)).map((v) => `/usr/lib/postgresql/${v}/bin`) : [];
const pgBinCandidates = [process.env.PG_BIN, ...debianPg, "/opt/homebrew/bin", "/usr/local/bin", "/Applications/Postgres.app/Contents/Versions/latest/bin"].filter(Boolean);
const pgBin = pgBinCandidates.find((d) => existsSync(join(d, "initdb"))) ?? "";
const postgrestBin = process.env.POSTGREST_BIN ?? "postgrest";
const asRoot = userInfo().uid === 0;

function runPg(cmd, args, dataDir) {
  const full = pgBin ? join(pgBin, cmd) : cmd;
  if (asRoot) {
    execFileSync("chown", ["-R", "postgres:postgres", dataDir]);
    const r = spawnSync("su", ["postgres", "-s", "/bin/sh", "-c", [full, ...args].map((a) => `'${a}'`).join(" ")], { stdio: "pipe" });
    if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr}`);
  } else execFileSync(full, args, { stdio: "pipe" });
}

export const sign = (claims, expiresIn = "1h") => new SignJWT(claims).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setIssuedAt().setExpirationTime(expiresIn).sign(secretKey);

export async function startStack({ pgPort = 54400 + Math.floor(Math.random() * 500), restPort = pgPort + 1000, gatewayPort = pgPort + 2000 } = {}) {
  const dataDir = mkdtempSync(join(tmpdir(), "psai-stack-"));
  const storageDir = join(dataDir, "storage");
  runPg("initdb", ["-D", join(dataDir, "pg"), "-U", "postgres", "--auth=trust", "-E", "UTF8"], dataDir);
  runPg("pg_ctl", ["-D", join(dataDir, "pg"), "-o", `-p ${pgPort} -k ${dataDir} -c listen_addresses=127.0.0.1`, "-l", join(dataDir, "pg.log"), "-w", "start"], dataDir);

  const admin = new pg.Client({ host: "127.0.0.1", port: pgPort, user: "postgres", database: "postgres" });
  await admin.connect();
  await admin.query(readFileSync(join(root, "tests/rls/supabase-stub.sql"), "utf8"));
  await admin.query("alter table auth.users add column if not exists password_hash text");
  for (const f of readdirSync(join(root, "supabase/migrations")).filter((x) => x.endsWith(".sql")).sort()) {
    await admin.query(readFileSync(join(root, "supabase/migrations", f), "utf8"));
  }
  await admin.query(readFileSync(join(root, "supabase/seed.sql"), "utf8"));
  await admin.query("create role authenticator login noinherit; grant anon, authenticated, service_role to authenticator;");

  const hash = (p) => createHash("sha256").update(p).digest("hex");
  const ids = {};
  for (const [key, u] of Object.entries(TEST_USERS)) {
    const { rows } = await admin.query("insert into auth.users (email, password_hash, raw_user_meta_data) values ($1, $2, $3) returning id", [u.email, hash(TEST_PASSWORD), { full_name: u.name }]);
    ids[key] = rows[0].id;
    await admin.query("update public.profiles set role = $1 where id = $2", [u.role, rows[0].id]);
  }

  // PostgREST
  const conf = join(dataDir, "postgrest.conf");
  writeFileSync(
    conf,
    [
      `db-uri = "postgres://authenticator@127.0.0.1:${pgPort}/postgres"`,
      `db-schemas = "public"`,
      `db-anon-role = "anon"`,
      `jwt-secret = "${JWT_SECRET}"`,
      `server-port = ${restPort}`,
      `server-host = "127.0.0.1"`,
      `db-pool = 10`,
    ].join("\n"),
  );
  const rest = spawn(postgrestBin, [conf], { stdio: ["ignore", "pipe", "pipe"] });
  let restLog = "";
  rest.stdout.on("data", (d) => (restLog += d));
  rest.stderr.on("data", (d) => (restLog += d));
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${restPort}/`);
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }

  const anonKey = await sign({ role: "anon", iss: "local" }, "10y");
  const serviceKey = await sign({ role: "service_role", iss: "local" }, "10y");

  mkdirSync(storageDir, { recursive: true });
  const storagePool = new pg.Pool({ host: "127.0.0.1", port: pgPort, user: "postgres", database: "postgres", max: 4 });

  async function claimsFrom(req) {
    const auth = req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? req.headers.apikey;
    if (!auth) return null;
    try {
      return (await jwtVerify(auth, secretKey)).payload;
    } catch {
      return null;
    }
  }

  /** Run a statement as the requesting role so storage RLS policies apply. */
  async function asRole(claims, sql, params) {
    const c = await storagePool.connect();
    try {
      await c.query("begin");
      const role = claims?.role === "service_role" ? "service_role" : claims?.role === "authenticated" ? "authenticated" : "anon";
      await c.query(`set local role ${role}`);
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims ?? {})]);
      const r = await c.query(sql, params);
      await c.query("commit");
      return r;
    } catch (e) {
      await c.query("rollback");
      throw e;
    } finally {
      c.release();
    }
  }

  async function session(userId, email) {
    const access_token = await sign({ sub: userId, email, role: "authenticated", aud: "authenticated", session_id: randomUUID() }, "1h");
    const refresh_token = await sign({ sub: userId, email, typ: "refresh" }, "7d");
    const now = Math.floor(Date.now() / 1000);
    return { access_token, refresh_token, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, user: userObj(userId, email) };
  }
  const userObj = (id, email) => ({ id, email, aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString() });
  const json = (res, status, body) => {
    res.writeHead(status, { "content-type": "application/json", "access-control-allow-origin": "*" });
    res.end(JSON.stringify(body));
  };
  const readBody = (req) => new Promise((r) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => r(Buffer.concat(chunks)));
  });

  const gateway = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (req.method === "OPTIONS") {
        res.writeHead(204, {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "authorization, apikey, content-type, x-client-info, x-upsert, cache-control, x-supabase-api-version, prefer, range, accept-profile, content-profile",
          "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS",
        });
        return res.end();
      }

      /* ---- REST: proxy to PostgREST ---- */
      if (url.pathname.startsWith("/rest/v1")) {
        const body = await readBody(req);
        const headers = { ...req.headers };
        delete headers.host;
        if (!headers.authorization && headers.apikey) headers.authorization = `Bearer ${headers.apikey}`;
        const upstream = await fetch(`http://127.0.0.1:${restPort}${url.pathname.slice(8)}${url.search}`, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : body });
        const out = Buffer.from(await upstream.arrayBuffer());
        const h = Object.fromEntries(upstream.headers);
        delete h["content-encoding"];
        delete h["content-length"];
        delete h["transfer-encoding"];
        res.writeHead(upstream.status, { ...h, "access-control-allow-origin": "*", "access-control-expose-headers": "content-range" });
        return res.end(out);
      }

      /* ---- AUTH (minimal) ---- */
      if (url.pathname === "/auth/v1/token") {
        const body = JSON.parse((await readBody(req)).toString() || "{}");
        if (url.searchParams.get("grant_type") === "password") {
          const { rows } = await admin.query("select id, email from auth.users where lower(email) = lower($1) and password_hash = $2", [body.email ?? "", hash(body.password ?? "")]);
          if (!rows[0]) return json(res, 400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" });
          return json(res, 200, await session(rows[0].id, rows[0].email));
        }
        if (url.searchParams.get("grant_type") === "refresh_token") {
          try {
            const { payload } = await jwtVerify(body.refresh_token, secretKey);
            return json(res, 200, await session(payload.sub, payload.email));
          } catch {
            return json(res, 400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" });
          }
        }
      }
      if (url.pathname === "/auth/v1/user") {
        const claims = await claimsFrom(req);
        if (!claims?.sub) return json(res, 401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
        if (req.method === "PUT") return json(res, 200, userObj(claims.sub, claims.email));
        return json(res, 200, userObj(claims.sub, claims.email));
      }
      if (url.pathname === "/auth/v1/logout") {
        res.writeHead(204);
        return res.end();
      }
      if (url.pathname === "/auth/v1/recover") return json(res, 200, {});
      if (url.pathname === "/auth/v1/.well-known/jwks.json") return json(res, 200, { keys: [] });

      /* ---- STORAGE (minimal, RLS enforced through storage.objects) ---- */
      const pub = url.pathname.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      if (pub && req.method === "GET") {
        const file = join(storageDir, pub[1], decodeURIComponent(pub[2]));
        if (!existsSync(file)) return json(res, 404, { error: "not_found" });
        const meta = JSON.parse(readFileSync(`${file}.meta`, "utf8"));
        res.writeHead(200, { "content-type": meta.contentType, "access-control-allow-origin": "*" });
        return res.end(readFileSync(file));
      }
      const del = url.pathname.match(/^\/storage\/v1\/object\/([^/]+)$/);
      if (del && req.method === "DELETE") {
        const claims = await claimsFrom(req);
        const { prefixes = [] } = JSON.parse((await readBody(req)).toString() || "{}");
        const removed = [];
        for (const p of prefixes) {
          const r = await asRole(claims, "delete from storage.objects where bucket_id = $1 and name = $2 returning name", [del[1], p]);
          if (r.rowCount) {
            rmSync(join(storageDir, del[1], p), { force: true });
            removed.push({ name: p });
          }
        }
        return json(res, 200, removed);
      }
      const obj = url.pathname.match(/^\/storage\/v1\/object\/([^/]+)\/(.+)$/);
      if (obj) {
        const [, bucket, rawPath] = obj;
        const path = decodeURIComponent(rawPath);
        const claims = await claimsFrom(req);
        if (req.method === "POST" || req.method === "PUT") {
          const body = await readBody(req);
          let bytes = body;
          let contentType = req.headers["content-type"] ?? "application/octet-stream";
          if (contentType.startsWith("multipart/form-data")) {
            const fd = await new Request("http://x", { method: "POST", headers: { "content-type": contentType }, body }).formData();
            for (const [, v] of fd) if (typeof v === "object") {
              bytes = Buffer.from(await v.arrayBuffer());
              contentType = v.type || contentType;
              break;
            }
          }
          const { rows: b } = await admin.query("select file_size_limit, allowed_mime_types from storage.buckets where id = $1", [bucket]);
          if (!b[0]) return json(res, 404, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
          if (b[0].file_size_limit && bytes.length > Number(b[0].file_size_limit)) return json(res, 413, { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" });
          if (b[0].allowed_mime_types && !b[0].allowed_mime_types.includes(contentType)) return json(res, 415, { statusCode: "415", error: "invalid_mime_type", message: `mime type ${contentType} is not supported` });
          try {
            await asRole(claims, "insert into storage.objects (bucket_id, name, owner) values ($1, $2, $3)", [bucket, path, claims?.sub ?? null]);
          } catch (e) {
            return json(res, 403, { statusCode: "403", error: "Unauthorized", message: String(e.message) });
          }
          const file = join(storageDir, bucket, path);
          mkdirSync(join(file, ".."), { recursive: true });
          writeFileSync(file, bytes);
          writeFileSync(`${file}.meta`, JSON.stringify({ contentType }));
          return json(res, 200, { Id: randomUUID(), Key: `${bucket}/${path}` });
        }
        if (req.method === "GET") {
          const r = await asRole(claims, "select name from storage.objects where bucket_id = $1 and name = $2", [bucket, path]).catch(() => ({ rowCount: 0 }));
          const file = join(storageDir, bucket, path);
          if (!r.rowCount || !existsSync(file)) return json(res, 404, { statusCode: "404", error: "not_found", message: "Object not found" });
          const meta = JSON.parse(readFileSync(`${file}.meta`, "utf8"));
          res.writeHead(200, { "content-type": meta.contentType });
          return res.end(readFileSync(file));
        }
      }
      json(res, 404, { error: "not implemented in test gateway", path: url.pathname });
    } catch (e) {
      json(res, 500, { error: String(e) });
    }
  });
  await new Promise((r) => gateway.listen(gatewayPort, "127.0.0.1", r));

  const stop = async () => {
    gateway.close();
    rest.kill();
    await storagePool.end().catch(() => {});
    await admin.end().catch(() => {});
    try {
      runPg("pg_ctl", ["-D", join(dataDir, "pg"), "-m", "immediate", "stop"], dataDir);
    } catch {}
    rmSync(dataDir, { recursive: true, force: true });
  };

  return {
    url: `http://127.0.0.1:${gatewayPort}`,
    anonKey,
    serviceKey,
    pgPort,
    ids,
    db: admin,
    restLog: () => restLog,
    stop,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const stack = await startStack({ pgPort: Number(process.env.STACK_PG_PORT) || undefined, gatewayPort: Number(process.env.STACK_PORT) || undefined, restPort: Number(process.env.STACK_REST_PORT) || undefined });
  const envOut = [
    `NEXT_PUBLIC_SUPABASE_URL=${stack.url}`,
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${stack.anonKey}`,
    `SUPABASE_SECRET_KEY=${stack.serviceKey}`,
    `STACK_PG_PORT=${stack.pgPort}`,
  ].join("\n");
  if (process.env.STACK_ENV_FILE) writeFileSync(process.env.STACK_ENV_FILE, envOut + "\n");
  console.log(envOut);
  console.log("Stack running. Ctrl+C to stop.");
  const shutdown = async () => {
    await stack.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
