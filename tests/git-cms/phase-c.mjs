import { chromium } from "playwright";
const B = process.env.E2E_BASE_URL ?? "http://localhost:3300";
const ok = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; } else console.log("PASS:", m); };
const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on("dialog", (d) => d.accept());
await page.goto(B + "/admin/login");
await page.getByLabel("Email").fill("admin@example.com");
await page.getByLabel("Password").fill("Very-Long-Test-Passw0rd!");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(B + "/admin");
// unpublish Focus Timer
await page.goto(B + "/admin/products");
await page.getByRole("link", { name: "Focus Timer" }).click();
await page.waitForURL(/products\/[0-9a-f-]{36}$/);
await page.getByLabel("Status").selectOption("archived");
await page.getByRole("button", { name: /^Save/ }).click();
await page.getByText(/Unpublished/).waitFor();
ok(true, "Focus Timer unpublished via admin");
// rename published project slug
await page.goto(B + "/admin/projects");
await page.getByRole("link", { name: "Habit Tracker" }).click();
await page.waitForURL(/projects\/[0-9a-f-]{36}$/);
await page.getByLabel("Slug", { exact: false }).fill("habit-tracker-app");
await page.getByRole("button", { name: /^Save/ }).click();
await page.getByText(/^Published\./).waitFor();
ok(true, "project slug changed");
// sign out
await page.getByRole("button", { name: "Sign out" }).first().click();
await page.waitForURL(/admin\/login/);
const r = await fetch(B + "/admin/products", { redirect: "manual" });
ok(r.status === 307, "signed out: admin protected again");
await browser.close();
