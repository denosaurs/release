import { exists, join } from "../deps.ts";
import { ReleaseError } from "./error.ts";

import { fetchBranch } from "./branch.ts";
import { Commit, fetchCommits } from "./commits.ts";
import { fetchTags, Tag } from "./tags.ts";
import { fetchStatus, Status } from "./status.ts";
import { fetchConfig, GitConfig } from "./git.ts";

export interface Github {
  user: string;
  name: string;
}

export interface Remote {
  raw: string;
  github: Github | null;
}

export interface Repo {
  path: string;
  branch: string;
  remote: Remote | null;
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

  let remote: Remote | null = null;
  if (config.branch && config.branch[branch]) {
    const branchRef = config.branch[branch];
    const remoteRef = config.remote[branchRef.remote];
    remote = {
      raw: remoteRef.url,
      github: null,
    };
    const reGithub =
      /(?:(?:https?:\/\/github\.com\/)|git@github\.com:)(.*)\/(.*)/;
    if (reGithub.test(remote.raw)) {
      const match = reGithub.exec(remote.raw);
      if (match) {
        remote.github = {
          user: match[1],
          name: match[2],
        };
        if (remote.github.name.endsWith(".git")) {
          remote.github.name = remote.github.name.replace(".git", "");
        }
      }
    }
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
