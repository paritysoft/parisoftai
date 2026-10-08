#!/usr/bin/env node
/**
 * Prints an ADMIN_PASSWORD_HASH value for the Git-backed admin, plus a fresh
 * ADMIN_SESSION_SECRET. The password is read from a hidden prompt (or stdin when piped)
 * and is never written anywhere.
 *
 *   npm run admin:hash-password
 */
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { createInterface } from "node:readline";

const N = 2 ** 15, r = 8, p = 1, KEYLEN = 64;

function readHidden(prompt) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      let data = "";
      process.stdin.on("data", (c) => (data += c));
      process.stdin.on("end", () => resolve(data.replace(/\r?\n$/, "")));
      return;
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(prompt)) rl.output.write(prompt); };
    rl.question(prompt, (answer) => { rl.close(); process.stdout.write("\n"); resolve(answer); });
  });
}

const password = await readHidden("New admin password (14+ characters): ");
if (password.length < 14) {
  console.error("Password must be at least 14 characters. Use a password manager to generate a long random one.");
  process.exit(1);
}
if (process.stdin.isTTY) {
  const again = await readHidden("Repeat password: ");
  if (again !== password) { console.error("Passwords do not match."); process.exit(1); }
}
const salt = randomBytes(16);
const key = await new Promise((res, rej) => scryptCb(password.normalize("NFKC"), salt, KEYLEN, { N, r, p, maxmem: 128 * N * r * 2 }, (e, k) => (e ? rej(e) : res(k))));
const hash = ["scrypt", N, r, p, salt.toString("base64url"), key.toString("base64url")].join(":");

console.log("\nAdd these to Vercel → Project → Settings → Environment Variables (Production):\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
console.log("\nAlso set ADMIN_EMAIL to the email you will sign in with. Changing the password signs out existing sessions.");
