import { Repo } from "./src/repo.ts";

export * as store from "./src/store.ts";
export * as gh from "./src/gh.ts";
export { Repo } from "./src/repo.ts";

export interface ReleasePlugin {
  name: string
  setup?: () => Promise<void>,
  preCommit?: (repo: Repo, from: string, to: string) => Promise<void>,
  postCommit?: (repo: Repo, from: string, to: string) => Promise<void>,
}
