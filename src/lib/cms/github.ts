import "server-only";

/**
 * Minimal GitHub REST client for committing content. Uses the Git Data API so a save
 * (JSON file + any new images + redirects) lands as ONE commit → one Vercel deployment.
 */

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface GitHubConfig {
  token: string;
  repo: string; // owner/repo
  branch: string;
  fetchImpl?: typeof fetch;
}

export type TreeChange = { path: string; content: string } | { path: string; blobSha: string } | { path: string; delete: true };

export class GitHubClient {
  private readonly f: typeof fetch;
  constructor(private readonly cfg: GitHubConfig) {
    this.f = cfg.fetchImpl ?? fetch;
  }

  private async api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await this.f(`https://api.github.com/repos/${this.cfg.repo}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.cfg.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
    if (!res.ok) {
      let detail = "";
      try {
        detail = ((await res.json()) as { message?: string }).message ?? "";
      } catch {}
      const hint =
        res.status === 401
          ? "The GitHub token is invalid or expired."
          : res.status === 403 || res.status === 404
            ? "The GitHub token cannot access this repository/branch (check GITHUB_CONTENT_REPO and the token's Contents permission)."
            : "";
      throw new GitHubError(`GitHub ${res.status}: ${hint || detail || res.statusText}`, res.status);
    }
    return (await res.json()) as T;
  }

  async headCommit(): Promise<{ commitSha: string; treeSha: string }> {
    const ref = await this.api<{ object: { sha: string } }>(`/git/ref/heads/${encodeURIComponent(this.cfg.branch)}`);
    const commit = await this.api<{ tree: { sha: string } }>(`/git/commits/${ref.object.sha}`);
    return { commitSha: ref.object.sha, treeSha: commit.tree.sha };
  }

  /** Lists blobs under a directory prefix at a tree (recursive). */
  async listTree(treeSha: string, prefix: string): Promise<{ path: string; sha: string }[]> {
    const tree = await this.api<{ tree: { path: string; type: string; sha: string }[]; truncated: boolean }>(`/git/trees/${treeSha}?recursive=1`);
    return tree.tree.filter((e) => e.type === "blob" && e.path.startsWith(prefix)).map((e) => ({ path: e.path, sha: e.sha }));
  }

  async readBlob(sha: string): Promise<string> {
    const blob = await this.api<{ content: string; encoding: string }>(`/git/blobs/${sha}`);
    return blob.encoding === "base64" ? Buffer.from(blob.content, "base64").toString("utf8") : blob.content;
  }

  async createBlob(bytes: Uint8Array): Promise<string> {
    const res = await this.api<{ sha: string }>(`/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: Buffer.from(bytes).toString("base64"), encoding: "base64" }),
    });
    return res.sha;
  }

  /** Creates one commit on top of the branch head. Retries once if the branch moved meanwhile. */
  async commit(message: string, changes: TreeChange[]): Promise<string> {
    for (let attempt = 0; ; attempt++) {
      const head = await this.headCommit();
      const tree = await this.api<{ sha: string }>(`/git/trees`, {
        method: "POST",
        body: JSON.stringify({
          base_tree: head.treeSha,
          tree: changes.map((c) =>
            "delete" in c
              ? { path: c.path, mode: "100644", type: "blob", sha: null }
              : "blobSha" in c
                ? { path: c.path, mode: "100644", type: "blob", sha: c.blobSha }
                : { path: c.path, mode: "100644", type: "blob", content: c.content },
          ),
        }),
      });
      const commit = await this.api<{ sha: string }>(`/git/commits`, {
        method: "POST",
        body: JSON.stringify({ message, tree: tree.sha, parents: [head.commitSha] }),
      });
      try {
        await this.api(`/git/refs/heads/${encodeURIComponent(this.cfg.branch)}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha, force: false }) });
        return commit.sha;
      } catch (e) {
        if (attempt === 0 && e instanceof GitHubError && e.status === 422) continue; // not a fast-forward: rebuild on the new head
        throw e;
      }
    }
  }
}
