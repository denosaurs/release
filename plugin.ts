import { Repo } from "./src/repo.ts";

export * as store from "./src/store.ts";

export { Repo } from "./src/repo.ts";
export { Tag } from "./src/tags.ts";
export { Commit } from "./src/commits.ts";

export interface ReleasePlugin {
  name: string;
  setup?: () => Promise<void>;
  preCommit?: (repo: Repo, from: string, to: string) => Promise<void>;
  postCommit?: (repo: Repo, from: string, to: string) => Promise<void>;
}
