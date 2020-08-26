import { Repo } from "./repo.ts";

import { git } from "./git.ts";
import { ReleaseError } from "./error.ts";

export async function pushBump(repo: Repo, to: string) {
  let [status, _, err] = await git(repo.path, [
    "commit",
    "--allow-empty",
    "--message",
    `"chore: release ${to}"`,
  ]);
  if (!status.success) throw new ReleaseError("GIT_EXE", err);

  [status, _, err] = await git(repo.path, `tag ${to}`);
  if (!status.success) throw new ReleaseError("GIT_EXE", err);

  // [status, _, err] = await git(repo.path, "push --follow-tags");
  // if (status.success) throw new ReleaseError("GIT_EXE", err);
}
