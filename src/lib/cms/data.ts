import "server-only";
import { cache } from "react";
import { getContentStore } from "@/lib/cms/store";
import { listItems, type Stored } from "@/lib/cms/service";
import { readCollectionFiles } from "@/lib/content/file-store";
import { sortForDisplay, type FileCollection } from "@/lib/content/file-format";
import { publishTarget, cmsEnv } from "@/lib/cms/config";

export interface AdminItems {
  items: Stored[];
  invalid: { path: string; error: string }[];
  source: "github" | "filesystem" | "deployment";
  error?: string;
}

/** Admin reads: the GitHub branch head when configured (fresh), otherwise the deployed files. */
export const loadAdminItems = cache(async (collection: FileCollection): Promise<AdminItems> => {
  const store = getContentStore();
  if (store) {
    try {
      const { items, invalid } = await listItems(store, collection);
      return { items, invalid, source: store.kind };
    } catch (e) {
      console.error("[cms] failed to read content", e);
      return { items: [], invalid: [], source: store.kind, error: e instanceof Error ? e.message : "Could not read content." };
    }
  }
  const items = sortForDisplay((await readCollectionFiles(collection)) as Stored[]);
  return { items, invalid: [], source: "deployment" };
});

export function publishStatus() {
  const target = publishTarget();
  const env = cmsEnv();
  return {
    target,
    repo: env.githubRepo,
    branch: env.githubBranch,
    note:
      target === "github"
        ? "Saving commits to GitHub. Published changes appear after Vercel redeploys (usually 1–3 minutes)."
        : target === "filesystem"
          ? "Local mode: saving writes to the content/ folder on this computer. Commit and push to publish."
          : "Read-only: set GITHUB_CONTENT_TOKEN and GITHUB_CONTENT_REPO to enable publishing.",
  };
}
