import type { ReleaseConfig } from "./config.ts";
import type { Action } from "./release.ts";
import type { Repo } from "./src/repo.ts";

export type { ReleaseConfig } from "./config.ts";
export type { Action } from "./release.ts";
export type { Repo } from "./src/repo.ts";
export type { Tag } from "./src/tags.ts";
export type { Commit } from "./src/commits.ts";

export * as store from "./src/store.ts";

export interface ReleasePlugin {
  name: string;
  setup?: () => Promise<void>;
  preCommit?: (
    repo: Repo,
    action: Action,
    from: string,
    to: string,
    config: ReleaseConfig,
  ) => Promise<void>;
  postCommit?: (
    repo: Repo,
    action: Action,
    from: string,
    to: string,
    config: ReleaseConfig,
  ) => Promise<void>;
}
