import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cmsEnv, publishTarget } from "@/lib/cms/config";
import { GitHubClient, type TreeChange } from "@/lib/cms/github";
import { CONTENT_DIR, FILE_COLLECTIONS, REDIRECTS_PATH, type FileCollection } from "@/lib/content/file-format";

/**
 * Where the admin reads and writes content files.
 * - GitHub: reads the branch head (not the deployed copy, which may be minutes behind) and commits.
 * - Filesystem: a developer's working tree (`npm run dev`); commit and push yourself.
 */
export interface RawFile {
  path: string;
  text: string;
}

export interface ContentStore {
  kind: "github" | "filesystem";
  listFiles(collection: FileCollection): Promise<RawFile[]>;
  readText(filePath: string): Promise<string | null>;
  /** Stage an uploaded image; returns a reference to pass to commit(). */
  stageBinary(publicPath: string, bytes: Uint8Array): Promise<{ blobSha?: string }>;
  commit(message: string, changes: TreeChange[]): Promise<void>;
}

/* --------------------------------- GitHub --------------------------------- */

const blobCache = new Map<string, string>(); // sha → text (blobs are immutable)

function githubStore(): ContentStore {
  const e = cmsEnv();
  const gh = new GitHubClient({ token: e.githubToken, repo: e.githubRepo, branch: e.githubBranch });
  let headPromise: Promise<{ commitSha: string; treeSha: string }> | null = null;
  const head = () => (headPromise ??= gh.headCommit());
  const readBlob = async (sha: string) => {
    const hit = blobCache.get(sha);
    if (hit !== undefined) return hit;
    const text = await gh.readBlob(sha);
    if (blobCache.size > 500) blobCache.clear();
    blobCache.set(sha, text);
    return text;
  };
  return {
    kind: "github",
    async listFiles(collection) {
      const { treeSha } = await head();
      const prefix = `${CONTENT_DIR}/${FILE_COLLECTIONS[collection].dir}/`;
      const entries = (await gh.listTree(treeSha, prefix)).filter((x) => x.path.endsWith(".json") && !x.path.slice(prefix.length).includes("/"));
      return Promise.all(entries.map(async (x) => ({ path: x.path, text: await readBlob(x.sha) })));
    },
    async readText(filePath) {
      const { treeSha } = await head();
      const entry = (await gh.listTree(treeSha, filePath)).find((x) => x.path === filePath);
      return entry ? readBlob(entry.sha) : null;
    },
    async stageBinary(_publicPath, bytes) {
      return { blobSha: await gh.createBlob(bytes) };
    },
    async commit(message, changes) {
      await gh.commit(message, changes);
      headPromise = null;
    },
  };
}

/* ------------------------------- Filesystem ------------------------------- */

function fsStore(root = process.cwd()): ContentStore {
  const abs = (p: string) => {
    const full = path.resolve(/*turbopackIgnore: true*/ root, p);
    if (!full.startsWith(path.resolve(/*turbopackIgnore: true*/ root) + path.sep)) throw new Error("Path escapes project root");
    return full;
  };
  return {
    kind: "filesystem",
    async listFiles(collection) {
      const dir = `${CONTENT_DIR}/${FILE_COLLECTIONS[collection].dir}`;
      let names: string[] = [];
      try {
        names = (await fs.readdir(/*turbopackIgnore: true*/ abs(dir))).filter((n) => n.endsWith(".json"));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      }
      return Promise.all(names.map(async (n) => ({ path: `${dir}/${n}`, text: await fs.readFile(/*turbopackIgnore: true*/ abs(`${dir}/${n}`), "utf8") })));
    },
    async readText(filePath) {
      try {
        return await fs.readFile(/*turbopackIgnore: true*/ abs(filePath), "utf8");
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw e;
      }
    },
    async stageBinary(publicPath, bytes) {
      const target = abs(path.join("public", publicPath));
      await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(target), { recursive: true });
      await fs.writeFile(/*turbopackIgnore: true*/ target, bytes, { flag: "wx" });
      return {};
    },
    async commit(_message, changes) {
      for (const c of changes) {
        const target = abs(c.path);
        if ("delete" in c) await fs.rm(/*turbopackIgnore: true*/ target, { force: true });
        else if ("content" in c) {
          await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(target), { recursive: true });
          await fs.writeFile(/*turbopackIgnore: true*/ target, c.content, "utf8");
        }
        // blobSha changes only occur with GitHub; images were written by stageBinary.
      }
    },
  };
}

export function getContentStore(): ContentStore | null {
  const target = publishTarget();
  if (target === "github") return githubStore();
  if (target === "filesystem") return fsStore();
  return null;
}

export { REDIRECTS_PATH, fsStore as createFilesystemStore };
