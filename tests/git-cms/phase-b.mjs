import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const B = process.env.E2E_BASE_URL ?? "http://localhost:3300";
const ok = (c, m) => { if (!c) { console.error("FAIL:", m); process.exitCode = 1; } else console.log("PASS:", m); };
const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

await page.goto(B + "/products");
const cards = page.locator("main article");
ok((await cards.count()) === 2, "products page lists 2 published products (draft hidden)");
ok(!(await page.locator("main").innerText()).includes("Secret Draft App"), "draft not shown");
ok((await page.locator("main a[href='https://apps.apple.com/app/id123456789']").count()) === 1, "verified store link rendered");
await page.goto(B + "/");
ok((await page.locator("#products-heading").count()) === 1, "home shows featured products section");
ok((await page.locator("#work-heading").count()) === 1, "home shows featured projects section");
ok((await page.locator("section[aria-labelledby='products-heading'] article").count()) === 1, "only featured product on home");
let r = await page.goto(B + "/products/focus-timer");
ok(r.status() === 200, "direct navigation to product page");
const html = await (await fetch(B + "/products/focus-timer")).text();
ok(/<title>[^<]*Focus Timer/.test(html), "title in initial HTML");
ok(html.includes('rel="canonical" href="https://parisoftai.com/products/focus-timer"'), "canonical in initial HTML");
ok(html.includes('property="og:title"') && html.includes('name="twitter:card"'), "OG + Twitter in initial HTML");
ok(html.includes('"@type":"SoftwareApplication"') && !html.includes("aggregateRating"), "SoftwareApplication JSON-LD, no ratings");
ok(html.includes('"@type":"BreadcrumbList"'), "breadcrumb JSON-LD");
r = await page.goto(B + "/products/secret-draft-app");
ok(r.status() === 404, "draft product URL returns 404");
const nf = await (await fetch(B + "/products/secret-draft-app")).text();
ok(/noindex/.test(nf), "404 page is noindex");
r = await page.goto(B + "/work/habit-tracker");
ok(r.status() === 200 && (await page.locator("h1").innerText()) === "Habit Tracker", "project page renders without cover image");
for (const p of ["/admin", "/admin/products", "/git-cms", "/git-cms/login"]) {
  const res = await fetch(B + p, { redirect: "manual" });
  ok([307, 308, 404].includes(res.status) || (res.headers.get("x-robots-tag") ?? "").includes("noindex"), `${p} not publicly accessible (${res.status})`);
}
// structured data parses
for (const p of ["/", "/products/focus-timer", "/work/habit-tracker", "/services/ios-app-development"]) {
  const h = await (await fetch(B + p)).text();
  const blocks = [...h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  ok(blocks.length > 0 && blocks.every((b) => b["@context"] === "https://schema.org"), `${p}: ${blocks.length} valid JSON-LD blocks (${blocks.map((b) => b["@type"]).join(", ")})`);
}
// accessibility of populated pages (WCAG 2.x A/AA, serious + critical)
for (const p of ["/products", "/products/focus-timer", "/work", "/work/habit-tracker", "/"]) {
  await page.goto(B + p);
  const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const bad = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  ok(bad.length === 0, `${p}: axe ${bad.length ? bad.map((v) => v.id).join(", ") : "no serious/critical violations"}`);
}
await browser.close();
