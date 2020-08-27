import { exists, join } from "../deps.ts";
import { ReleaseError } from "./error.ts";

import { fetchBranch } from "./branch.ts";
import { fetchCommits, Commit } from "./commits.ts";
import { fetchTags, Tag } from "./tags.ts";
import { fetchStatus, Status } from "./status.ts";
import { fetchConfig, GitConfig } from "./git.ts";

export interface Repo {
  path: string;
  branch: string;
  remote: string | null;
  tags: Tag[];
  commits: Commit[];
  status: Status;
  config: GitConfig;
}

export async function fetchRepo(path: string): Promise<Repo> {
  const repo = join(path, ".git");
  if (!(await exists(repo))) {
    throw new ReleaseError("NO_REPO");
  }

  const branch = await fetchBranch(path);
  if (branch === "HEAD") throw new ReleaseError("UNINITIALIZED_REPO");

  const config = await fetchConfig(path);

  let remote = null;
  if (config.branch && config.branch[branch]) {
    const branchRef = config.branch[branch];
    const remoteRef = config.remote[branchRef.remote];
    remote = remoteRef.url;
  }

  const tags = await fetchTags(path);
  const commits = await fetchCommits(path, tags);

  const status = await fetchStatus(path);

  return {
    path,
    branch,
    remote,
    commits,
    tags,
    status,
    config,
  };
}
