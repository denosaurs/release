import { git } from "./git.ts";
import { ReleaseError } from "./error.ts";

export async function fetchBranch(repo: string): Promise<string> {
  const [status, output, err] = await git(repo, "rev-parse --abbrev-ref HEAD");
  if (!status.success) throw new ReleaseError("GIT_EXE", err);
  return output;
}
