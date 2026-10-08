import { describe, expect, it } from "vitest";
import { safeHref } from "@/lib/utils";
import { safeAdminNext } from "@/lib/auth/safe-next";
import { csvCell, toCsv } from "@/lib/leads/csv";
import { escapeHtml } from "@/lib/leads/escape";
import { sniffImageType, storagePathFor, svgIsSafe } from "@/lib/media/validate";
import { can } from "@/lib/permissions";

describe("safeHref", () => {
  it.each([
    ["/contact", "/contact"],
    ["https://apps.apple.com/x", "https://apps.apple.com/x"],
    ["javascript:alert(1)", null],
    ["data:text/html,hi", null],
    ["//evil.com", null],
    ["  JAVASCRIPT:alert(1)", null],
  ])("%s", (input, expected) => expect(safeHref(input)).toBe(expected));
});

describe("safeAdminNext", () => {
  it.each([
    ["/admin/leads", "/admin/leads"],
    ["https://evil.com", "/admin"],
    ["//evil.com/admin", "/admin"],
    ["/admin\\..\\x", "/admin"],
    ["/products", "/admin"],
    [null, "/admin"],
  ])("%s", (input, expected) => expect(safeAdminNext(input)).toBe(expected));
});

describe("CSV export", () => {
  it("neutralises spreadsheet formulas and quotes properly", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(toCsv(["a", "b"], [["1", null]])).toBe("a,b\r\n1,");
  });
});

describe("escapeHtml", () => {
  it("escapes markup", () => expect(escapeHtml(`<img src=x onerror="a">`)).toBe("&lt;img src=x onerror=&quot;a&quot;&gt;"));
});

describe("image validation", () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
  const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
  it("sniffs real types from bytes", () => {
    expect(sniffImageType(png)).toBe("image/png");
    expect(sniffImageType(jpg)).toBe("image/jpeg");
    expect(sniffImageType(webp)).toBe("image/webp");
    expect(sniffImageType(new TextEncoder().encode('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>'))).toBe("image/svg+xml");
    expect(sniffImageType(new TextEncoder().encode("MZ executable"))).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("<html><script>"))).toBeNull();
  });
  it("rejects risky SVG", () => {
    expect(svgIsSafe('<svg><circle r="4"/></svg>')).toBe(true);
    expect(svgIsSafe("<svg><script>alert(1)</script></svg>")).toBe(false);
    expect(svgIsSafe('<svg onload="alert(1)"></svg>')).toBe(false);
    expect(svgIsSafe('<svg><a href="javascript:alert(1)">x</a></svg>')).toBe(false);
    expect(svgIsSafe("<svg><foreignObject></foreignObject></svg>")).toBe(false);
    expect(svgIsSafe('<svg><use href="https://evil/x.svg#a"/></svg>')).toBe(false);
    expect(svgIsSafe('<svg><use href="#local"/></svg>')).toBe(true);
  });
  it("builds safe storage paths", () => {
    const p = storagePathFor("../../Évil Name<script>.PNG", "image/png", "abc", new Date("2026-03-04T00:00:00Z"));
    expect(p).toBe("uploads/2026/03/abc-evil-name-script.png");
  });
});

describe("permissions", () => {
  it("matches the role matrix", () => {
    expect(can("editor", "content.edit")).toBe(true);
    expect(can("editor", "content.publish")).toBe(false);
    expect(can("editor", "leads.view")).toBe(false);
    expect(can("admin", "leads.delete")).toBe(true);
    expect(can("admin", "users.manage")).toBe(false);
    expect(can("admin", "seo.manage")).toBe(false);
    expect(can("super_admin", "audit.view")).toBe(true);
    expect(can(null, "dashboard.view")).toBe(false);
  });
});
