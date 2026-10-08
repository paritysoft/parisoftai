import { expect, test } from "@playwright/test";
import { db, hasStack, waitFillTime } from "./helpers";

test.describe("contact form", () => {
  test("shows accessible validation errors and does not submit", async ({ page }) => {
    let posted = false;
    page.on("request", (r) => {
      if (r.url().endsWith("/api/contact")) posted = true;
    });
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send inquiry" }).click();
    await expect(page.getByText("Please enter your full name.")).toBeVisible();
    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Please choose a service.")).toBeVisible();
    await expect(page.getByLabel(/Full name/)).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel(/Full name/)).toBeFocused();
    expect(posted).toBe(false);
  });

  test("pre-selects the service when coming from a service page", async ({ page }) => {
    await page.goto("/services/flutter-app-development");
    await page.getByRole("link", { name: "Discuss your project" }).click();
    await expect(page.getByLabel(/Service required/)).toHaveValue("Flutter Cross-Platform Development");
  });

  test("API rejects invalid payloads and cross-origin posts", async ({ request }) => {
    const bad = await request.post("/api/contact", { data: { fullName: "x" } });
    expect(bad.status()).toBe(400);
    const cross = await request.post("/api/contact", { data: {}, headers: { origin: "https://evil.example" } });
    expect(cross.status()).toBe(403);
  });

  test("successful submission is stored once, server-confirmed", async ({ page }) => {
    test.skip(!hasStack, "needs the local Supabase test stack");
    const client = await db();
    const unique = `e2e-${Date.now()}@example.com`;
    await page.goto("/contact");
    await page.getByLabel(/Full name/).fill("Test Person");
    await page.getByLabel(/Business email/).fill(unique);
    await page.getByLabel(/Company name/).fill("Example Co");
    await page.getByLabel(/Service required/).selectOption("iOS App Development");
    await page.getByLabel(/Estimated budget/).selectOption({ index: 2 });
    await page.getByLabel(/Project description/).fill("We would like a native iOS app for booking appointments with offline support.");
    await page.getByRole("checkbox").check();
    await waitFillTime(page);
    const [response] = await Promise.all([page.waitForResponse("**/api/contact"), page.getByRole("button", { name: "Send inquiry" }).click()]);
    expect(response.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Inquiry received" })).toBeVisible();
    const { rows } = await client.query("select * from public.leads where email = $1", [unique]);
    expect(rows).toHaveLength(1);
    expect(rows[0].service_required).toBe("iOS App Development");
    expect(rows[0].ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0].notification_status).toBe("skipped"); // no email provider configured in tests
    await client.end();
  });

  test("retrying the same submission does not create a duplicate", async ({ request }) => {
    test.skip(!hasStack, "needs the local Supabase test stack");
    const client = await db();
    const submissionId = crypto.randomUUID();
    const email = `dup-${Date.now()}@example.com`;
    const body = {
      fullName: "Dup Test",
      email,
      companyName: "",
      serviceRequired: "UI/UX Design",
      estimatedBudget: "",
      preferredTimeline: "",
      projectDescription: "Testing that duplicate submissions are ignored safely.",
      consent: true,
      submissionId,
      website: "",
      elapsedMs: 5000,
    };
    const headers = { "x-real-ip": "203.0.113.10" };
    expect((await request.post("/api/contact", { data: body, headers })).status()).toBe(200);
    expect((await request.post("/api/contact", { data: body, headers })).status()).toBe(200);
    const { rows } = await client.query("select count(*)::int as n from public.leads where email = $1", [email]);
    expect(rows[0].n).toBe(1);
    await client.end();
  });

  test("honeypot and too-fast submissions are silently discarded", async ({ request }) => {
    test.skip(!hasStack, "needs the local Supabase test stack");
    const client = await db();
    const email = `bot-${Date.now()}@example.com`;
    const base = { fullName: "Bot", email, serviceRequired: "Other / not sure yet", projectDescription: "Buy cheap things now at this link please.", consent: true, website: "", elapsedMs: 5000 };
    const r1 = await request.post("/api/contact", { data: { ...base, submissionId: crypto.randomUUID(), website: "http://spam" }, headers: { "x-real-ip": "203.0.113.20" } });
    const r2 = await request.post("/api/contact", { data: { ...base, submissionId: crypto.randomUUID(), elapsedMs: 300 }, headers: { "x-real-ip": "203.0.113.20" } });
    expect(r1.status()).toBe(200);
    expect(r2.status()).toBe(200);
    const { rows } = await client.query("select count(*)::int as n from public.leads where email = $1", [email]);
    expect(rows[0].n).toBe(0);
    await client.end();
  });

  test("rate limiting blocks bursts from one address", async ({ request }) => {
    test.skip(!hasStack, "needs the local Supabase test stack");
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await request.post("/api/contact", {
        data: {
          fullName: "Rate Test",
          email: `rate-${i}-${Date.now()}@example.com`,
          serviceRequired: "Other / not sure yet",
          projectDescription: "Checking that the rate limiter kicks in after a few tries.",
          consent: true,
          submissionId: crypto.randomUUID(),
          website: "",
          elapsedMs: 5000,
        },
        headers: { "x-real-ip": "198.51.100.77" },
      });
      statuses.push(res.status());
    }
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});
