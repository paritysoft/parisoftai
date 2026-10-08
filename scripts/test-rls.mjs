#!/usr/bin/env node
/**
 * Row Level Security test suite.
 *
 * Creates a throwaway PostgreSQL cluster, installs minimal Supabase stubs
 * (auth.users, auth.uid(), storage, anon/authenticated/service_role), applies
 * every migration in supabase/migrations plus supabase/seed.sql, then checks
 * what each role can and cannot do.
 *
 * Requirements: PostgreSQL 15+ server binaries (initdb, pg_ctl).
 * Set PG_BIN if they are not on PATH, e.g. PG_BIN=/usr/lib/postgresql/16/bin
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir, userInfo } from "node:os";
import { join, resolve } from "node:path";
import pg from "pg";

const root = resolve(import.meta.dirname, "..");
const debianPg = existsSync("/usr/lib/postgresql") ? readdirSync("/usr/lib/postgresql").sort((a, b) => Number(b) - Number(a)).map((v) => `/usr/lib/postgresql/${v}/bin`) : [];
const candidates = [process.env.PG_BIN, ...debianPg, "/opt/homebrew/bin", "/usr/local/bin", "/Applications/Postgres.app/Contents/Versions/latest/bin"].filter(Boolean);
const pgBin = candidates.find((dir) => existsSync(join(dir, "initdb"))) ?? "";
const bin = (name) => (pgBin ? join(pgBin, name) : name);

const dataDir = mkdtempSync(join(tmpdir(), "psai-rls-"));
const port = 54000 + Math.floor(Math.random() * 900);
const runAsRoot = userInfo().uid === 0;
const pgUser = "postgres";

function sh(cmd, args) {
  if (runAsRoot) {
    // initdb/postgres refuse to run as root; use the postgres OS user when available
    execFileSync("chown", ["-R", "postgres:postgres", dataDir]);
    const r = spawnSync("su", ["postgres", "-s", "/bin/sh", "-c", [cmd, ...args].map((a) => `'${a}'`).join(" ")], { stdio: "pipe" });
    if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr}`);
    return;
  }
  execFileSync(cmd, args, { stdio: "pipe" });
}

let passed = 0;
let failed = 0;
const results = [];

async function main() {
  sh(bin("initdb"), ["-D", dataDir, "-U", pgUser, "--auth=trust", "-E", "UTF8"]);
  sh(bin("pg_ctl"), ["-D", dataDir, "-o", `-p ${port} -k ${dataDir} -c listen_addresses=''`, "-l", join(dataDir, "server.log"), "-w", "start"]);

  const client = new pg.Client({ host: dataDir, port, user: pgUser, database: "postgres" });
  await client.connect();

  try {
    await client.query(readFileSync(join(root, "tests/rls/supabase-stub.sql"), "utf8"));
    const migrations = readdirSync(join(root, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
    for (const file of migrations) {
      await client.query(readFileSync(join(root, "supabase/migrations", file), "utf8"));
    }
    await client.query(readFileSync(join(root, "supabase/seed.sql"), "utf8"));

    // Users
    const ids = {};
    for (const name of ["superadmin", "admin", "editor", "visitor", "inactive", "superadmin2"]) {
      const { rows } = await client.query("insert into auth.users (email) values ($1) returning id", [`${name}@example.test`]);
      ids[name] = rows[0].id;
    }
    await client.query("update public.profiles set role = 'super_admin' where id = $1", [ids.superadmin]);
    await client.query("update public.profiles set role = 'admin' where id = $1", [ids.admin]);
    await client.query("update public.profiles set role = 'editor' where id = $1", [ids.editor]);
    await client.query("update public.profiles set role = 'admin', is_active = false where id = $1", [ids.inactive]);

    const as = async (who, sql, params = []) => {
      await client.query("begin");
      try {
        if (who === "anon") {
          await client.query("set local role anon");
        } else if (who === "service") {
          await client.query("set local role service_role");
        } else {
          await client.query("set local role authenticated");
          await client.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: ids[who], role: "authenticated" })]);
        }
        const res = await client.query(sql, params);
        await client.query("commit");
        return { ok: true, rows: res.rows, rowCount: res.rowCount };
      } catch (error) {
        await client.query("rollback");
        return { ok: false, error: String(error.message) };
      }
    };

    const check = (name, condition, detail = "") => {
      if (condition) passed++;
      else failed++;
      results.push(`${condition ? "PASS" : "FAIL"}  ${name}${!condition && detail ? `  -> ${detail}` : ""}`);
    };

    // ---------------- Anonymous visitors ----------------
    let r = await as("anon", "select slug from public.services");
    check("anon reads published services", r.ok && r.rows.length === 8, JSON.stringify(r));
    r = await as("anon", "insert into public.services (slug,title,short_description) values ('x-hack','Hack','x')");
    check("anon cannot insert services", !r.ok);
    r = await as("anon", "update public.services set title = 'Defaced'");
    check("anon cannot update services", !r.ok || r.rowCount === 0);
    r = await as("anon", "select * from public.leads");
    check("anon cannot read leads", !r.ok);
    r = await as("anon", "insert into public.leads (submission_id, full_name, email, service_required, project_description) values (gen_random_uuid(),'Spam','s@x.io','x','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')");
    check("anon cannot insert leads directly", !r.ok);
    r = await as("anon", "select key from public.site_settings");
    check("anon cannot see notification settings", r.ok && !r.rows.some((x) => x.key === "notifications") && r.rows.length === 4, JSON.stringify(r.rows));
    r = await as("anon", "select * from public.page_revisions");
    check("anon cannot read page revisions", !r.ok);
    r = await as("anon", "select * from public.audit_logs");
    check("anon cannot read audit logs", !r.ok);
    r = await as("anon", "select * from public.rate_limit_events");
    check("anon cannot read rate limit table", !r.ok);
    r = await as("anon", "select public.set_staff_role($1, 'super_admin')", [ids.visitor]);
    check("anon cannot call set_staff_role", !r.ok);
    r = await as("anon", "insert into storage.objects (bucket_id, name) values ('media','uploads/evil.png')");
    check("anon cannot upload media", !r.ok);

    // Draft content invisible publicly
    await as("admin", "insert into public.products (slug,name,tagline,category,status) values ('secret-app','Secret App','Unreleased','Utility','draft')");
    r = await as("anon", "select * from public.products where slug = 'secret-app'");
    check("anon cannot see draft products", r.ok && r.rows.length === 0);
    r = await as("editor", "select * from public.products where slug = 'secret-app'");
    check("editor can see draft products", r.ok && r.rows.length === 1);

    // ---------------- Signed-in user without a role ----------------
    r = await as("visitor", "select * from public.products where slug = 'secret-app'");
    check("signed-in non-staff cannot see drafts", r.ok && r.rows.length === 0);
    r = await as("visitor", "update public.profiles set role = 'super_admin' where id = auth.uid()");
    check("non-staff cannot self-promote via update", !r.ok);
    r = await as("visitor", "update public.profiles set full_name = 'Visitor' where id = auth.uid()");
    check("user can update own name", r.ok && r.rowCount === 1, JSON.stringify(r));

    // ---------------- Inactive admin ----------------
    r = await as("inactive", "select * from public.leads");
    check("deactivated admin cannot read leads", r.ok && r.rows.length === 0);

    // ---------------- Editor ----------------
    r = await as("editor", "insert into public.services (slug,title,short_description,status) values ('editor-draft','Editor draft','Short','draft') returning id");
    check("editor can create draft service", r.ok, r.error);
    r = await as("editor", "insert into public.services (slug,title,short_description,status) values ('editor-pub','Editor pub','Short','published')");
    check("editor cannot create published service", !r.ok);
    r = await as("editor", "update public.services set status = 'published' where slug = 'editor-draft'");
    check("editor cannot publish draft", !r.ok || r.rowCount === 0);
    r = await as("editor", "update public.services set title = 'Changed' where slug = 'ios-app-development'");
    check("editor cannot edit published service", r.ok && r.rowCount === 0);
    r = await as("editor", "update public.services set title = 'Editor draft v2' where slug = 'editor-draft'");
    check("editor can edit own draft", r.ok && r.rowCount === 1);
    r = await as("editor", "delete from public.services where slug = 'editor-draft'");
    check("editor cannot delete content", r.ok && r.rowCount === 0);
    r = await as("editor", "select * from public.leads");
    check("editor cannot read leads", r.ok && r.rows.length === 0);
    r = await as("editor", "select public.set_staff_role($1, 'admin')", [ids.editor]);
    check("editor cannot change roles", !r.ok);
    r = await as("editor", "update public.site_settings set value = '{}' where key = 'general'");
    check("editor cannot change settings", r.ok && r.rowCount === 0);
    const { rows: homeRows } = await client.query("select id from public.pages where key = 'home'");
    const homeId = homeRows[0].id;
    r = await as("editor", "insert into public.page_revisions (page_id, kind, content, created_by) values ($1, 'draft', '{}', $2)", [homeId, ids.editor]);
    check("editor can save page draft revision", r.ok, r.error);
    r = await as("editor", "insert into public.page_revisions (page_id, kind, content, created_by) values ($1, 'published', '{}', $2)", [homeId, ids.editor]);
    check("editor cannot record a publish revision", !r.ok);
    r = await as("editor", "update public.pages set published_content = '{}' where key = 'home'");
    check("editor cannot publish pages", r.ok && r.rowCount === 0);
    r = await as("editor", "insert into public.page_revisions (page_id, kind, content, created_by) values ($1, 'draft', '{}', $2)", [homeId, ids.admin]);
    check("editor cannot forge revision author", !r.ok);
    r = await as("editor", "insert into storage.objects (bucket_id, name) values ('media','uploads/2026/logo.png')");
    check("editor can upload media to uploads/", r.ok, r.error);
    r = await as("editor", "insert into storage.objects (bucket_id, name) values ('media','root.png')");
    check("editor cannot upload outside uploads/", !r.ok);
    r = await as("editor", "delete from storage.objects where name = 'uploads/2026/logo.png'");
    check("editor cannot delete media objects", r.ok && r.rowCount === 0);
    r = await as("editor", "insert into public.audit_logs (actor_id, action, resource_type) values ($1, 'x', 'y')", [ids.admin]);
    check("editor cannot forge audit actor", !r.ok);
    r = await as("editor", "insert into public.audit_logs (actor_id, action, resource_type) values ($1, 'service.create', 'service')", [ids.editor]);
    check("editor can append own audit entry", r.ok, r.error);
    r = await as("editor", "select * from public.audit_logs");
    check("editor cannot read audit log", r.ok && r.rows.length === 0);

    // ---------------- Admin ----------------
    r = await as("admin", "update public.services set status = 'published' where slug = 'editor-draft'");
    check("admin can publish", r.ok && r.rowCount === 1);
    r = await as("admin", "update public.pages set published_content = published_content where key = 'home'");
    check("admin can update pages", r.ok && r.rowCount === 1);
    r = await as("admin", "select public.set_staff_role($1, 'admin')", [ids.editor]);
    check("admin cannot change roles", !r.ok);
    r = await as("admin", "update public.site_settings set value = value where key = 'general'");
    check("admin cannot change settings", r.ok && r.rowCount === 0);
    r = await as("admin", "insert into public.seo_metadata (path, title) values ('/about', 'x')");
    check("admin cannot manage SEO", !r.ok);
    r = await as("admin", "select * from public.audit_logs");
    check("admin cannot read audit log", r.ok && r.rows.length === 0);
    r = await as("admin", "delete from storage.objects where name = 'uploads/2026/logo.png'");
    check("admin can delete media objects", r.ok && r.rowCount === 1);

    // ---------------- Service role (server) & leads ----------------
    r = await as("service", "insert into public.leads (submission_id, full_name, email, service_required, project_description) values ('11111111-1111-1111-1111-111111111111','Jane Client','jane@company.test','iOS App Development','We need an iOS app for our booking system.') returning id");
    check("server (service role) can store a lead", r.ok, r.error);
    r = await as("service", "insert into public.leads (submission_id, full_name, email, service_required, project_description) values ('11111111-1111-1111-1111-111111111111','Jane Client','jane@company.test','iOS App Development','We need an iOS app for our booking system.')");
    check("duplicate submission_id is rejected", !r.ok);
    r = await as("admin", "select * from public.leads");
    check("admin can read leads", r.ok && r.rows.length === 1);
    const leadId = r.rows?.[0]?.id;
    r = await as("admin", "insert into public.lead_notes (lead_id, body, author_id) values ($1, 'Called', $2)", [leadId, ids.admin]);
    check("admin can add lead notes", r.ok, r.error);
    r = await as("admin", "update public.leads set status = 'contacted' where id = $1", [leadId]);
    check("admin can update lead status", r.ok && r.rowCount === 1);

    // ---------------- Super admin ----------------
    r = await as("superadmin", "select public.set_staff_role($1, 'admin')", [ids.editor]);
    check("super admin can change roles", r.ok, r.error);
    r = await as("superadmin", "select public.set_staff_role($1, 'editor')", [ids.superadmin]);
    check("last super admin cannot demote self", !r.ok);
    r = await as("superadmin", "select public.set_staff_active($1, false)", [ids.superadmin]);
    check("super admin cannot deactivate self", !r.ok);
    r = await as("superadmin", "insert into public.seo_metadata (path, title, noindex) values ('/about', 'About ParitySoft AI', false)");
    check("super admin can manage SEO", r.ok, r.error);
    r = await as("superadmin", "insert into public.seo_metadata (path, title) values ('/admin/secret', 'x')");
    check("SEO overrides cannot target /admin", !r.ok);
    r = await as("superadmin", "select * from public.audit_logs");
    check("super admin can read audit log", r.ok && r.rows.length >= 1);
    r = await as("superadmin", "update public.audit_logs set action = 'tampered'");
    check("audit log is append-only", !r.ok || r.rowCount === 0);
    r = await as("superadmin", "select value from public.site_settings where key = 'notifications'");
    check("super admin can read notification settings", r.ok && r.rows.length === 1);

    // ---------------- Slug redirects ----------------
    await as("admin", "update public.services set slug = 'ios-development' where slug = 'ios-app-development'");
    r = await as("anon", "select to_path from public.slug_redirects where from_path = '/services/ios-app-development'");
    check("renaming a published slug records a redirect", r.ok && r.rows[0]?.to_path === "/services/ios-development", JSON.stringify(r));
    await as("admin", "update public.services set slug = 'ios-apps' where slug = 'ios-development'");
    r = await as("anon", "select from_path, to_path from public.slug_redirects order by from_path");
    check(
      "redirect chains are collapsed",
      r.ok && r.rows.every((x) => x.to_path === "/services/ios-apps") && r.rows.length === 2,
      JSON.stringify(r.rows),
    );

    // updated_by is stamped from the JWT
    r = await as("admin", "select updated_by from public.services where slug = 'ios-apps'");
    check("updated_by is set from the session user", r.ok && r.rows[0]?.updated_by === ids.admin);
  } finally {
    await client.end();
    try {
      sh(bin("pg_ctl"), ["-D", dataDir, "-m", "immediate", "stop"]);
    } catch {}
    rmSync(dataDir, { recursive: true, force: true });
  }

  console.log(results.join("\n"));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  try {
    sh(bin("pg_ctl"), ["-D", dataDir, "-m", "immediate", "stop"]);
  } catch {}
  process.exit(1);
});
