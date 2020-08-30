import { ReleaseConfig } from "./config.ts";
import { Action } from "./release.ts";
import { Repo } from "./src/repo.ts";

export * as store from "./src/store.ts";

export { ReleaseConfig } from "./config.ts";
export { Action } from "./release.ts";
export { Repo } from "./src/repo.ts";
export { Tag } from "./src/tags.ts";
export { Commit } from "./src/commits.ts";

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
