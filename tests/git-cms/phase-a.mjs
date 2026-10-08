import { chromium } from "playwright";
import { deflateSync } from "node:zlib";
const B = process.env.E2E_BASE_URL ?? "http://localhost:3300";
const ok = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; } else console.log("PASS:", m); };

// tiny valid PNG 64x64
function png() {
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(64, 0); ihdr.writeUInt32BE(64, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc(64 * (64 * 3 + 1)); for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const o = y * 193 + 1 + x * 3; raw[o] = 99; raw[o + 1] = 102; raw[o + 2] = 241; }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on("dialog", (d) => d.accept());

// ---- Zero state
for (const p of ["/products", "/work"]) {
  await page.goto(B + p);
  const text = await page.locator("main").innerText();
  ok(!/coming soon|on the way|check back shortly/i.test(text), `${p}: no placeholder copy`);
  ok((await page.locator("main a[href^='/services/']").count()) >= 5, `${p}: links to service pages`);
}
await page.goto(B + "/");
ok((await page.locator("#work-heading").count()) === 0 && (await page.locator("#products-heading").count()) === 0, "home: no featured sections when empty");
ok((await page.locator("#tech-heading").count()) === 1, "home: technology section present");

// ---- Admin auth
let r = await page.goto(B + "/admin/products");
ok(page.url().includes("/admin/login"), "admin redirects to login");
ok(r.headers()["x-robots-tag"]?.includes("noindex"), "login page noindex header");
await page.getByLabel("Email").fill("admin@example.com");
await page.getByLabel("Password").fill("wrong-password-here");
await page.getByRole("button", { name: "Sign in" }).click();
await page.getByText("Incorrect email or password.").waitFor();
ok(true, "wrong password rejected");
await page.getByLabel("Email").fill("admin@example.com");
await page.getByLabel("Password").fill("Very-Long-Test-Passw0rd!");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(B + "/admin/products");
ok(true, "login redirects back to requested page");

async function createProduct({ name, tagline, status, featured, icon, store }) {
  await page.goto(B + "/admin/products/new");
  await page.getByLabel("Product name", { exact: false }).fill(name);
  await page.getByLabel("Short description", { exact: false }).fill(tagline);
  const cat = page.getByLabel("Categories", { exact: false });
  await cat.fill("Productivity"); await cat.press("Enter");
  await page.getByLabel("iOS", { exact: true }).check();
  await page.getByLabel("macOS", { exact: true }).check();
  if (store) await page.getByLabel("App Store URL").fill(store);
  if (featured) await page.getByRole("switch", { name: "Featured on homepage" }).click();
  if (icon) {
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload" }).first().click();
    await (await chooser).setFiles({ name: "icon.png", mimeType: "image/png", buffer: png() });
    await page.waitForFunction(() => document.querySelector("input[placeholder^='/uploads']")?.value.startsWith("/uploads/products/"));
  }
  await page.getByLabel("Status").selectOption(status);
  await page.getByRole("button", { name: /^Save/ }).click();
  await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/, { timeout: 20000 });
  ok(true, `created product "${name.slice(0, 30)}" (${status})`);
}

await createProduct({ name: "Focus Timer", tagline: "A calm Pomodoro timer for deep work.", status: "published", featured: true, icon: true, store: "https://apps.apple.com/app/id123456789" });
await createProduct({ name: "Secret Draft App", tagline: "Not ready for the public yet.", status: "draft" });
await createProduct({ name: "An Exceptionally Long Product Name For Testing Wrapping Behaviour", tagline: "This product has a deliberately long description to make sure cards wrap text gracefully and keep equal heights across the grid without overflowing on small phones.", status: "published" });

// validation: wrong store domain
await page.goto(B + "/admin/products/new");
await page.getByLabel("Product name", { exact: false }).fill("Bad Link");
await page.getByLabel("Short description", { exact: false }).fill("Testing validation.");
const cat = page.getByLabel("Categories", { exact: false }); await cat.fill("Tools"); await cat.press("Enter");
await page.getByLabel("App Store URL").fill("https://example.com/not-apple");
await page.getByRole("button", { name: /^Save/ }).click();
await page.getByText("Enter a valid App Store link.").waitFor();
ok(page.url().endsWith("/new"), "invalid store link blocks save");

// duplicate slug
await page.goto(B + "/admin/products/new");
await page.getByLabel("Product name", { exact: false }).fill("Focus Timer");
await page.getByLabel("Short description", { exact: false }).fill("Duplicate.");
const c2 = page.getByLabel("Categories", { exact: false }); await c2.fill("Tools"); await c2.press("Enter");
await page.getByRole("button", { name: /^Save/ }).click();
await page.getByText("Another item already uses this slug.").waitFor();
ok(true, "duplicate slug blocked");

// Project: client without permission blocked, then company project published+featured w/o cover
await page.goto(B + "/admin/projects/new");
await page.getByLabel("Project name", { exact: false }).fill("Habit Tracker");
await page.getByLabel("Category", { exact: false }).fill("Health & Fitness");
await page.getByLabel("Ownership").selectOption("client");
await page.getByLabel("Short description", { exact: false }).fill("A habit tracking app built with SwiftUI and CloudKit.");
await page.getByLabel("Status").selectOption("published");
await page.getByRole("button", { name: /^Save/ }).click();
await page.getByText(/authorised publication/).first().waitFor();
ok(true, "client project cannot be published without authorisation");
await page.getByLabel("Ownership").selectOption("company");
await page.getByLabel("Flutter", { exact: true }).check();
await page.getByRole("switch", { name: "Featured on homepage" }).click();
const tech = page.getByLabel("Technology stack", { exact: false }); await tech.fill("Swift, SwiftUI, CloudKit"); await tech.press("Enter");
await page.getByRole("button", { name: /^Save/ }).click();
await page.waitForURL(/\/admin\/projects\/[0-9a-f-]{36}$/, { timeout: 20000 });
ok(true, "company project published (no cover image)");

await page.goto(B + "/admin");
const dash = await page.locator("main").innerText();
ok(/Published products\s*2/.test(dash), "dashboard counts published products");
await browser.close();
