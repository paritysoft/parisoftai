#!/usr/bin/env node
/**
 * Creates the first Super Admin. Run once per environment, from a trusted machine.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SECRET_KEY=... \
 *     node scripts/bootstrap-admin.mjs --email you@company.com [--name "Your Name"] [--invite]
 *
 * Default: prompts for a password (not echoed) and creates a confirmed user.
 * --invite: sends a Supabase invite email instead (requires the invite email template set up — see docs/DEPLOYMENT.md).
 * Refuses to run if a super admin already exists, unless --force is passed.
 * Nothing is hardcoded and no credentials are written to disk.
 */
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://parisoftai.com").replace(/\/$/, "");
const email = value("email")?.trim().toLowerCase();
const name = value("name") ?? "";

if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (server secret) in the environment.");
  process.exit(1);
}
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: node scripts/bootstrap-admin.mjs --email you@company.com [--name \"Your Name\"] [--invite] [--force]");
  process.exit(1);
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => rl.output.write(s.includes(question) ? s : "");
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "super_admin");
if ((count ?? 0) > 0 && !flag("force")) {
  console.error("A super admin already exists. Invite further users from /admin/users, or pass --force.");
  process.exit(1);
}

let userId;
if (flag("invite")) {
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: name },
    redirectTo: `${siteUrl}/auth/confirm?next=/admin/account/password`,
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`Invitation sent to ${email}.`);
} else {
  const password = await promptHidden("Password (min 12 characters): ");
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const confirm = await promptHidden("Confirm password: ");
  if (confirm !== password) {
    console.error("Passwords don't match.");
    process.exit(1);
  }
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  if (error) throw error;
  userId = data.user.id;
  console.log(`Created user ${email}.`);
}

const { error: roleError } = await supabase.from("profiles").update({ role: "super_admin", full_name: name || null, is_active: true }).eq("id", userId);
if (roleError) throw roleError;
await supabase.from("audit_logs").insert({ actor_id: userId, action: "user.bootstrap", resource_type: "user", resource_id: userId, summary: "Initial super admin created via bootstrap script" });
console.log("Granted Super Admin. Sign in at /admin/login.");
