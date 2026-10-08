import { describe, expect, it } from "vitest";
import { deleteItem, listItems, saveItem, stageImage, type Stored } from "@/lib/cms/service";
import type { ContentStore, RawFile } from "@/lib/cms/store";
import type { TreeChange } from "@/lib/cms/github";
import { GitHubClient } from "@/lib/cms/github";
import { hashPassword, verifyPassword, hashFingerprint } from "@/lib/cms/password";
import { updateRedirects, parseStored, sortForDisplay } from "@/lib/content/file-format";
import { applyFilters, filterOptions, NO_FILTERS } from "@/lib/content/filters";
import { emptyProduct, emptyProject } from "@/lib/content/forms";

/* ------------------------------ In-memory store ----------------------------- */

function memoryStore(kind: "github" | "filesystem" = "github") {
  const files = new Map<string, string>();
  const commits: { message: string; changes: TreeChange[] }[] = [];
  const store: ContentStore = {
    kind,
    async listFiles(collection) {
      const prefix = `content/${collection}/`;
      return [...files.entries()].filter(([p]) => p.startsWith(prefix) && p.endsWith(".json")).map(([path, text]): RawFile => ({ path, text }));
    },
    async readText(p) {
      return files.get(p) ?? null;
    },
    async stageBinary() {
      return kind === "github" ? { blobSha: "a".repeat(40) } : {};
    },
    async commit(message, changes) {
      commits.push({ message, changes });
      for (const c of changes) {
        if ("delete" in c) files.delete(c.path);
        else if ("content" in c) files.set(c.path, c.content);
        else files.set(c.path, `<blob ${c.blobSha}>`);
      }
    },
  };
  return { store, files, commits };
}

const project = (over: Record<string, unknown> = {}) => ({
  ...emptyProject,
  title: "Habit Tracker",
  slug: "habit-tracker",
  summary: "A focused habit tracking app for iPhone.",
  category: "Productivity",
  ownership: "company",
  platforms: ["ios"],
  ...over,
});
const product = (over: Record<string, unknown> = {}) => ({
  ...emptyProduct,
  name: "Focus Timer",
  slug: "focus-timer",
  tagline: "A calm Pomodoro timer.",
  categories: ["Productivity"],
  platforms: ["ios", "macos"],
  ...over,
});

const now = (iso: string) => ({ now: new Date(iso) });

describe("Git-backed publishing", () => {
  it("creates a draft that is stored but not published", async () => {
    const { store, files, commits } = memoryStore();
    const res = await saveItem(store, "projects", null, project(), now("2026-10-01T10:00:00Z"));
    expect(res.ok).toBe(true);
    expect(commits).toHaveLength(1);
    const [path, text] = [...files.entries()][0]!;
    expect(path).toMatch(/^content\/projects\/[0-9a-f-]{36}\.json$/);
    const stored = JSON.parse(text);
    expect(stored.status).toBe("draft");
    expect(stored.publishedAt).toBeNull();
    expect(parseStored("projects", stored).ok).toBe(true);
  });

  it("sets publishedAt on first publish and keeps it on later edits", async () => {
    const { store } = memoryStore();
    const created = await saveItem(store, "products", null, product({ status: "published" }), now("2026-10-01T10:00:00Z"));
    if (!created.ok) throw new Error(created.error);
    const id = created.data!.id;
    const edited = await saveItem(store, "products", id, product({ status: "published", tagline: "Updated tagline." }), { ...now("2026-10-05T10:00:00Z"), expectedUpdatedAt: created.data!.updatedAt });
    expect(edited.ok).toBe(true);
    const { items } = await listItems(store, "products");
    expect(items).toHaveLength(1); // editing never duplicates
    expect(items[0]!.publishedAt).toBe("2026-10-01T10:00:00.000Z");
    expect(items[0]!.updatedAt).toBe("2026-10-05T10:00:00.000Z");
  });

  it("rejects duplicate slugs and invalid slugs", async () => {
    const { store } = memoryStore();
    await saveItem(store, "projects", null, project());
    const dup = await saveItem(store, "projects", null, project({ title: "Other" }));
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.fieldErrors?.slug).toMatch(/already uses/);
    const bad = await saveItem(store, "projects", null, project({ slug: "Bad Slug!" }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.fieldErrors?.slug).toBeTruthy();
  });

  it("refuses to publish client work without authorisation", async () => {
    const { store, commits } = memoryStore();
    const res = await saveItem(store, "projects", null, project({ ownership: "client", status: "published", clientApproved: false }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.fieldErrors?.clientApproved).toBeTruthy();
    expect(commits).toHaveLength(0);
    const ok = await saveItem(store, "projects", null, project({ ownership: "client", status: "published", clientApproved: true }));
    expect(ok.ok).toBe(true);
  });

  it("rejects store links on the wrong domain and non-https URLs", async () => {
    const { store } = memoryStore();
    const res = await saveItem(store, "products", null, product({ appStoreUrl: "https://evil.example.com/app", websiteUrl: "http://example.com" }));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.fieldErrors?.appStoreUrl).toBeTruthy();
      expect(res.fieldErrors?.websiteUrl).toBeTruthy();
    }
  });

  it("detects edits made elsewhere (stale updatedAt)", async () => {
    const { store } = memoryStore();
    const a = await saveItem(store, "projects", null, project(), now("2026-10-01T00:00:00Z"));
    if (!a.ok) throw new Error();
    await saveItem(store, "projects", a.data!.id, project({ summary: "Changed in another tab." }), now("2026-10-02T00:00:00Z"));
    const stale = await saveItem(store, "projects", a.data!.id, project(), { expectedUpdatedAt: a.data!.updatedAt });
    expect(stale.ok).toBe(false);
  });

  it("adds a redirect when a published slug changes, and none for drafts", async () => {
    const { store, files } = memoryStore();
    const a = await saveItem(store, "projects", null, project({ status: "published" }));
    if (!a.ok) throw new Error();
    await saveItem(store, "projects", a.data!.id, project({ status: "published", slug: "habit-tracker-pro" }));
    expect(JSON.parse(files.get("content/redirects.json")!)).toEqual([{ from: "/work/habit-tracker", to: "/work/habit-tracker-pro" }]);
    const d = await saveItem(store, "projects", null, project({ slug: "draft-one", title: "Draft" }));
    if (!d.ok) throw new Error();
    await saveItem(store, "projects", d.data!.id, project({ slug: "draft-two", title: "Draft" }));
    expect(JSON.parse(files.get("content/redirects.json")!)).toHaveLength(1);
  });

  it("unpublishing keeps the file but marks it non-public", async () => {
    const { store } = memoryStore();
    const a = await saveItem(store, "products", null, product({ status: "published" }));
    if (!a.ok) throw new Error();
    const res = await saveItem(store, "products", a.data!.id, product({ status: "archived" }));
    expect(res.ok && res.message).toMatch(/Unpublished/);
    const { items } = await listItems(store, "products");
    expect(items[0]!.status).toBe("archived");
  });

  it("commits uploaded images with the item in a single commit", async () => {
    const { store, commits } = memoryStore("github");
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const up = await stageImage(store, "projects", { name: "Cover Shot.PNG", bytes: png }, new Date("2026-10-08T00:00:00Z"));
    if (!up.ok) throw new Error(up.error);
    expect(up.data!.path).toMatch(/^\/uploads\/projects\/202610-[0-9a-f]{8}-cover-shot\.png$/);
    const res = await saveItem(store, "projects", null, project({ coverImage: up.data!.path }), { uploads: [up.data!] });
    expect(res.ok).toBe(true);
    expect(commits).toHaveLength(1);
    expect(commits[0]!.changes.map((c) => c.path)).toContain(`public${up.data!.path}`);
  });

  it("ignores uploads that are no longer referenced and rejects bad image files", async () => {
    const { store, commits } = memoryStore("github");
    const res = await saveItem(store, "projects", null, project(), { uploads: [{ path: "/uploads/projects/202610-abcdef12-x.png", blobSha: "b".repeat(40) }] });
    expect(res.ok).toBe(true);
    expect(commits[0]!.changes).toHaveLength(1);
    const svg = await stageImage(store, "projects", { name: "x.svg", bytes: new TextEncoder().encode("<svg><script>alert(1)</script></svg>") });
    expect(svg.ok).toBe(false);
    const big = await stageImage(store, "projects", { name: "x.png", bytes: new Uint8Array(4 * 1024 * 1024) });
    expect(big.ok).toBe(false);
  });

  it("deletes an item", async () => {
    const { store, files } = memoryStore();
    const a = await saveItem(store, "projects", null, project());
    if (!a.ok) throw new Error();
    expect((await deleteItem(store, "projects", a.data!.id)).ok).toBe(true);
    expect([...files.keys()].filter((k) => k.startsWith("content/projects/"))).toHaveLength(0);
    expect((await deleteItem(store, "projects", a.data!.id)).ok).toBe(false);
  });
});

describe("file format helpers", () => {
  it("collapses redirect chains and never redirects away from a live URL", () => {
    let r = updateRedirects([], "/work/a", "/work/b");
    r = updateRedirects(r, "/work/b", "/work/c");
    expect(r).toEqual([
      { from: "/work/a", to: "/work/c" },
      { from: "/work/b", to: "/work/c" },
    ]);
    r = updateRedirects(r, "/work/c", "/work/a");
    expect(r.find((x) => x.from === "/work/a")).toBeUndefined();
  });

  it("sorts by display order, then newest", () => {
    const items = [
      { slug: "b", sortOrder: 10, publishedAt: "2026-01-01" },
      { slug: "a", sortOrder: 10, publishedAt: "2026-05-01" },
      { slug: "c", sortOrder: 1, publishedAt: null },
    ];
    expect(sortForDisplay(items).map((i) => i.slug)).toEqual(["c", "a", "b"]);
  });

  it("rejects files with unknown status or missing fields", () => {
    expect(parseStored("products", { id: "x" }).ok).toBe(false);
  });
});

describe("filters", () => {
  const items = [
    { platforms: ["ios" as const], categories: ["Health"], ownership: "company" as const },
    { platforms: ["android" as const], categories: ["Finance"], ownership: "client" as const },
    { platforms: ["ios" as const, "android" as const], categories: ["Health"], ownership: "client" as const },
    { platforms: ["web" as const], categories: ["Tools"], ownership: "company" as const },
  ];
  it("hides filters for small collections", () => {
    expect(filterOptions(items.slice(0, 3))).toEqual({ platforms: [], categories: [], ownerships: [] });
  });
  it("offers and applies filters", () => {
    const o = filterOptions(items);
    expect(o.platforms).toEqual(["ios", "android", "web"]);
    expect(applyFilters(items, { ...NO_FILTERS, platform: "ios" })).toHaveLength(2);
    expect(applyFilters(items, { ...NO_FILTERS, ownership: "client", category: "Health" })).toHaveLength(1);
  });
});

describe("admin password hashing", () => {
  it("verifies the right password only", async () => {
    const hash = await hashPassword("correct horse battery staple", { N: 2 ** 14, r: 8, p: 1 });
    expect(hash).not.toContain("$");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password entirely", hash)).toBe(false);
    expect(await verifyPassword("x", "garbage")).toBe(false);
    expect(hashFingerprint(hash)).toHaveLength(16);
  });
});

describe("GitHub client", () => {
  it("creates one commit via the Git Data API and retries when the branch moved", async () => {
    const calls: string[] = [];
    let refPatches = 0;
    const fakeFetch = (async (url: string, init?: RequestInit) => {
      const u = url.replace("https://api.github.com/repos/o/r", "");
      calls.push(`${init?.method ?? "GET"} ${u}`);
      const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status });
      if (u === "/git/ref/heads/main") return json({ object: { sha: "c1" } });
      if (u.startsWith("/git/commits/")) return json({ tree: { sha: "t1" } });
      if (u === "/git/trees") return json({ sha: "t2" });
      if (u === "/git/commits") return json({ sha: "c2" });
      if (u === "/git/refs/heads/main") return ++refPatches === 1 ? json({ message: "Update is not a fast forward" }, 422) : json({});
      return json({ message: "nope" }, 404);
    }) as typeof fetch;
    const gh = new GitHubClient({ token: "t", repo: "o/r", branch: "main", fetchImpl: fakeFetch });
    const sha = await gh.commit("msg", [{ path: "content/projects/x.json", content: "{}" }, { path: "old.json", delete: true }]);
    expect(sha).toBe("c2");
    expect(refPatches).toBe(2);
    expect(calls.filter((c) => c === "POST /git/trees")).toHaveLength(2);
  });

  it("explains auth failures", async () => {
    const gh = new GitHubClient({ token: "t", repo: "o/r", branch: "main", fetchImpl: (async () => new Response("{}", { status: 401 })) as unknown as typeof fetch });
    await expect(gh.headCommit()).rejects.toThrow(/invalid or expired/);
  });
});

export type { Stored };
