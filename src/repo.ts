import { exists, join } from "../deps.ts";
import { ReleaseError } from "./error.ts";

import { fetchBranch } from "./branch.ts";
import { fetchCommits, Commit } from "./commits.ts";
import { fetchTags, Tag } from "./tags.ts";
import { fetchStatus, Status } from "./status.ts";

export interface Repo {
  path: string;
  branch: string;
  tags: Tag[];
  commits: Commit[];
  status: Status;
}

export async function fetchRepo(path: string): Promise<Repo> {
  const configpath = join(path, ".git", "config");
  if (!(await exists(configpath))) {
    throw new ReleaseError("NO_REPO");
  }

  const branch = await fetchBranch(path);

  if (branch === "HEAD") throw new ReleaseError("UNINITIALIZED_REPO");

  const tags = await fetchTags(path);
  const commits = await fetchCommits(path, tags);

  const status = await fetchStatus(path);

  return {
    path,
    branch,
    commits,
    tags,
    status,
  };
}
