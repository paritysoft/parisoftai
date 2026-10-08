import { expect, test } from "@playwright/test";

test.describe("public website", () => {
  test("homepage renders hero, services and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("ParitySoft AI | Mobile App & Software Development");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("We Build Digital Products That Make an Impact.");
    await expect(page.getByRole("link", { name: /Start a Project/ }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "End-to-End Software Development for a Digital-First World" })).toBeVisible();
    await expect(page.locator("#services-heading ~ * a, section[aria-labelledby=services-heading] h3 a")).toHaveCount(8);
    // Unverified statistics are never shown
    await expect(page.getByText("Total users")).toHaveCount(0);
    await expect(page.getByText("Active subscribers")).toHaveCount(0);
    // Empty collections are hidden rather than showing placeholders
    await expect(page.getByRole("heading", { name: "Our Own Software Products" })).toHaveCount(0);
  });

  test("meta tags, canonical and structured data", async ({ page }) => {
    await page.goto("/services/ios-app-development");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/services\/ios-app-development$/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /iOS App Development/);
    const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(ld.some((s) => s.includes('"FAQPage"'))).toBe(true);
    expect(ld.some((s) => s.includes('"BreadcrumbList"'))).toBe(true);
    expect(ld.some((s) => s.includes('"Organization"'))).toBe(true);
  });

  test("desktop navigation marks the active page", async ({ page }) => {
    await page.goto("/services");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Services" })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Engineering What's Next.");
  });

  test("service cards navigate to service pages with FAQ", async ({ page }) => {
    await page.goto("/services");
    await page.getByRole("main").getByRole("link", { name: "AI Integration" }).click();
    await expect(page).toHaveURL(/\/services\/ai-integration$/);
    await expect(page.getByRole("heading", { name: "Frequently asked questions" })).toBeVisible();
    const q = page.getByText("Will our data be used to train AI models?");
    await q.click();
    await expect(page.getByText(/We select providers and configurations/)).toBeVisible();
  });

  test("work and products pages are complete without published items (no placeholders)", async ({ page }) => {
    for (const path of ["/work", "/products"]) {
      await page.goto(path);
      const main = page.locator("main");
      await expect(main).not.toContainText(/coming soon|on the way|check back shortly/i);
      await expect(main.locator("a[href^='/services/']").first()).toBeVisible();
      await expect(main.getByRole("link", { name: /Start a Project/ })).toBeVisible();
    }
  });

  test("legal pages show the draft notice", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("note")).toContainText("must be reviewed by a qualified legal professional");
  });

  test("404 for unknown pages and unknown services", async ({ page }) => {
    const r1 = await page.goto("/does-not-exist");
    expect(r1?.status()).toBe(404);
    const r2 = await page.goto("/services/not-a-service");
    expect(r2?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  });

  test("sitemap and robots", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/services/ios-app-development");
    expect(sitemap).not.toContain("/admin");
    expect(sitemap).toContain("/work</loc>");
    expect(sitemap).toContain("/products</loc>");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/admin/);
  });

  test("security headers are set", async ({ request }) => {
    const res = await request.get("/");
    const h = res.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-powered-by"]).toBeUndefined();
  });

  test("footer shows no placeholder contact details", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.locator('a[href^="mailto:"]')).toHaveCount(0);
    await expect(footer.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(footer).toContainText(`© ${new Date().getFullYear()} ParitySoft AI`);
  });
});

test.describe("responsive layout", () => {
  for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/", "/services/flutter-app-development", "/contact", "/about"]) {
        await page.goto(path);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(0);
      }
    });
  }

  test("mobile drawer opens, traps focus and closes with Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const drawer = page.getByRole("dialog", { name: "Site navigation" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "Home" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(toggle).toBeFocused();
    // Navigating closes the drawer
    await toggle.click();
    await drawer.getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(drawer).toBeHidden();
  });

  test("touch targets in mobile nav are at least 44px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const btn = await page.getByRole("button", { name: "Open menu" }).boundingBox();
    expect(btn!.height).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: "Open menu" }).click();
    const link = await page.getByRole("dialog").getByRole("link", { name: "Services" }).boundingBox();
    expect(link!.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe("reduced motion", () => {
  test.use({ colorScheme: "dark" });
  test("content is fully visible with prefers-reduced-motion", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(process.env.E2E_BASE_URL ?? "http://localhost:3200/");
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(300);
    const hidden = await page.evaluate(() => Array.from(document.querySelectorAll("main .opacity-0")).length);
    expect(hidden).toBe(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await ctx.close();
  });
});
