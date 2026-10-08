import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { db, hasStack, login } from "./helpers";

test.describe.configure({ mode: "serial" });
test.skip(!hasStack, "needs the local Supabase test stack");

test("signed-out visitors are redirected to login; wrong password is rejected", async ({ page }) => {
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fleads/);
  await page.getByLabel("Email").fill("admin@test.local");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /Incorrect email or password/ })).toBeVisible();
});

test("login honours a safe ?next and ignores external redirects", async ({ page }) => {
  await page.goto("/admin/login?next=https://evil.example/");
  await page.getByLabel("Email").fill("admin@test.local");
  await page.getByLabel("Password").fill("Test-password-123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/localhost:3200\/admin$/);
});

test("admin pages are noindex", async ({ page }) => {
  await login(page, "admin");
  const res = await page.goto("/admin");
  expect(res?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("editor: limited navigation, drafts only, no access to leads or users", async ({ page }) => {
  await login(page, "editor");
  const nav = page.getByRole("navigation", { name: "Admin" }).first();
  await expect(nav.getByRole("link", { name: "Services" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Leads" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Users" })).toHaveCount(0);
  await page.goto("/admin/leads");
  await expect(page).toHaveURL(/\/admin\?denied=1/);
  await expect(page.getByText("You don't have permission to open that page")).toBeVisible();

  // Create a draft product
  await page.goto("/admin/products/new");
  await expect(page.getByLabel("Status")).toHaveValue("draft");
  await expect(page.getByLabel("Status").locator("option")).toHaveCount(1);
  await page.getByLabel("Product name").fill("Focus Timer");
  await page.getByLabel("Category").fill("Productivity");
  await page.getByLabel("One-sentence description").fill("A calm focus timer for deep work sessions.");
  await page.getByText("iOS", { exact: true }).click();
  await page.getByText("macOS", { exact: true }).click();
  await page.getByLabel("App Store URL").fill("https://apps.apple.com/app/id000000");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Draft saved." })).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/products\/[0-9a-f-]{36}$/);

  // Draft is not public
  const res = await page.goto("/products/focus-timer");
  expect(res?.status()).toBe(404);
});

test("editor cannot publish even by calling the server action directly", async ({ page }) => {
  await login(page, "editor");
  const client = await db();
  const { rows } = await client.query("select id from public.products where slug = 'focus-timer'");
  await page.goto(`/admin/products/${rows[0].id}`);
  // Tamper with the select in the DOM to submit "published"
  await page.getByLabel("Status").evaluate((el: HTMLSelectElement) => {
    const o = document.createElement("option");
    o.value = "published";
    o.text = "Published";
    el.appendChild(o);
  });
  await page.getByLabel("Status").selectOption("published");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /Save/ }).first().click();
  await expect(page.getByRole("alert").filter({ hasText: "Editors can save drafts only" })).toBeVisible();
  const { rows: after } = await client.query("select status from public.products where slug = 'focus-timer'");
  expect(after[0].status).toBe("draft");
  await client.end();
});

test("admin publishes the product and it appears on the website", async ({ page }) => {
  await login(page, "admin");
  await page.goto("/admin/products");
  await page.getByRole("main").getByRole("link", { name: "Focus Timer", exact: true }).click();
  await page.getByLabel("Status").selectOption("published");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Save & publish" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved and published." })).toBeVisible();

  await page.goto("/products");
  await expect(page.getByRole("main").getByRole("link", { name: "Focus Timer", exact: true })).toBeVisible();
  await page.goto("/products/focus-timer");
  await expect(page.getByRole("heading", { level: 1, name: "Focus Timer" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Focus Timer on App Store/ })).toHaveAttribute("href", "https://apps.apple.com/app/id000000");
  await expect(page.getByRole("link", { name: /Google Play/ })).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Our Own Software Products" })).toBeVisible();
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/products/focus-timer");
});

test("renaming a published slug keeps the old URL working", async ({ page }) => {
  await login(page, "admin");
  await page.goto("/admin/products");
  await page.getByRole("main").getByRole("link", { name: "Focus Timer", exact: true }).click();
  await page.getByLabel("Slug").fill("focus-timer-app");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Save & publish" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Saved and published." })).toBeVisible();
  await page.goto("/products/focus-timer");
  await expect(page).toHaveURL(/\/products\/focus-timer-app$/);
});

test("admin manages a lead: status, note, CSV export", async ({ page }) => {
  const client = await db();
  await client.query(
    "insert into public.leads (submission_id, full_name, email, service_required, project_description, consent_given) values (gen_random_uuid(), 'Lena Lead', 'lena@example.com', 'Android App Development', '=HYPERLINK(\"http://evil\") We need an Android app.', true)",
  );
  await login(page, "admin");
  await page.goto("/admin/leads?q=lena");
  await page.getByRole("link", { name: /Lena Lead/ }).click();
  await expect(page.getByText("We need an Android app.")).toBeVisible();
  await page.getByLabel("Status").selectOption("contacted");
  await expect(page.getByRole("status").filter({ hasText: "Lead updated." })).toBeVisible();
  await page.getByLabel("Add a note").fill("Called Lena, follow up next week.");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Called Lena, follow up next week.")).toBeVisible();
  const { rows } = await client.query("select status, is_read from public.leads where email = 'lena@example.com'");
  expect(rows[0]).toMatchObject({ status: "contacted", is_read: true });

  await page.goto("/admin/leads?q=lena");
  await page.getByRole("checkbox", { name: "Select Lena Lead" }).check();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: /Export 1 selected leads/ }).click()]);
  const csv = readFileSync(await download.path(), "utf8");
  expect(csv).toContain("Lena Lead");
  expect(csv).toContain(`"'=HYPERLINK(""http://evil"") We need an Android app."`); // formula injection neutralised
  await client.end();
});

test("export endpoint refuses editors", async ({ page }) => {
  await login(page, "editor");
  const res = await page.request.get("/api/admin/leads/export");
  expect(res.status()).toBe(403);
});

test("homepage draft stays private until published", async ({ page }) => {
  await login(page, "superadmin");
  await page.goto("/admin/pages");
  await page.getByRole("link", { name: "Home" }).click();
  await page.getByLabel("Headline").fill("Software That Works Everywhere.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Draft saved." })).toBeVisible();

  const anon = await page.context().browser()!.newPage();
  await anon.goto("http://localhost:3200/");
  await expect(anon.getByRole("heading", { level: 1 })).toContainText("We Build Digital Products That Make an Impact.");

  // Preview shows the draft to the signed-in admin
  await page.goto("/api/preview?path=/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Software That Works Everywhere.");
  await expect(page.getByText("Preview mode")).toBeVisible();
  await page.goto("/api/preview/disable");

  await page.goto("/admin/pages");
  await page.getByRole("link", { name: "Home" }).click();
  await expect(page.getByLabel("Headline")).toHaveValue("Software That Works Everywhere.");
  await page.getByRole("button", { name: "Publish" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Published." })).toBeVisible();

  await anon.goto("http://localhost:3200/");
  await expect(anon.getByRole("heading", { level: 1 })).toContainText("Software That Works Everywhere.");
  await anon.close();
});

test("super admin sets an SEO override with noindex", async ({ page }) => {
  await login(page, "superadmin");
  await page.goto("/admin/seo");
  await page.getByRole("button", { name: /Terms/ }).click();
  await page.getByLabel("SEO title").fill("Website terms | ParitySoft AI");
  await page.getByRole("switch", { name: /Hide from search engines/ }).click();
  await page.getByRole("button", { name: "Save SEO" }).click();
  await expect(page.getByRole("status").filter({ hasText: "SEO saved." })).toBeVisible();
  await page.goto("/terms");
  await expect(page).toHaveTitle("Website terms | ParitySoft AI");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("/terms");
});

test("super admin updates settings; contact email appears publicly", async ({ page }) => {
  await login(page, "superadmin");
  await page.goto("/admin/settings");
  const general = page.locator("#general");
  await general.getByLabel("Public contact email").fill("hello@parisoftai.test");
  await general.getByRole("button", { name: "Save" }).click();
  await expect(general.getByRole("status").filter({ hasText: "Settings saved." })).toBeVisible();
  await page.goto("/contact");
  await expect(page.getByRole("link", { name: "hello@parisoftai.test" }).first()).toBeVisible();
});

test("super admin changes a role; last super admin is protected", async ({ page }) => {
  await login(page, "superadmin");
  await page.goto("/admin/users");
  await expect(page.getByText("You")).toBeVisible();
  const client = await db();
  const { rows } = await client.query("select id from public.profiles where email = 'owner@test.local'");
  await page.getByLabel("Role for owner@test.local").selectOption("editor");
  await expect(page.getByRole("alert").filter({ hasText: "At least one active super admin is required" })).toBeVisible();
  const { rows: after } = await client.query("select role from public.profiles where id = $1", [rows[0].id]);
  expect(after[0].role).toBe("super_admin");
  await client.end();
});

test("media upload is verified server-side and rejects disguised files", async ({ page }) => {
  await login(page, "editor");
  await page.goto("/admin/media");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  await page.locator('input[type="file"]').setInputFiles({ name: "Pixel Test.png", mimeType: "image/png", buffer: png });
  await expect(page.getByRole("button", { name: /pixel-test|Pixel Test/i }).first()).toBeVisible();
  // A text file pretending to be a PNG is rejected and removed
  await page.locator('input[type="file"]').setInputFiles({ name: "fake.png", mimeType: "image/png", buffer: Buffer.from("not really an image") });
  await expect(page.getByRole("alert").filter({ hasText: "isn't a supported image" })).toBeVisible();
  const client = await db();
  const { rows } = await client.query("select file_name from public.media_assets order by created_at");
  expect(rows.map((r) => r.file_name)).toEqual(["Pixel Test.png"]);
  const { rows: objects } = await client.query("select name from storage.objects");
  expect(objects).toHaveLength(1);
  await client.end();
});

test("audit log records administrative actions", async ({ page }) => {
  await login(page, "superadmin");
  await page.goto("/admin/audit-logs");
  for (const action of ["product.create", "product.publish", "lead.status_change", "page.publish", "seo.update", "settings.update", "media.upload"]) {
    await expect(page.getByText(action, { exact: true }).first()).toBeVisible();
  }
});

test("dashboard shows real counts and recent inquiries", async ({ page }) => {
  await login(page, "admin");
  await expect(page.getByText("Published products").locator("..")).toContainText("1");
  await expect(page.getByRole("heading", { name: "Recent inquiries" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lena Lead" })).toBeVisible();
});

test("sign out ends the session", async ({ page }) => {
  await login(page, "admin");
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});
