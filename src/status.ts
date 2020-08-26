import { git } from "./git.ts";
import { ReleaseError } from "./error.ts";

export interface Status {
  raw: Raw[];
  untracked: string[];
  index: Changes;
  tree: Changes;
}

type Path = string;

interface Raw {
  path: Path;
  x: string;
  y: string;
  to?: Path;
}

interface Rename {
  path: Path;
  to: Path;
}

interface Changes {
  modified: Path[];
  added: Path[];
  deleted: Path[];
  copied: Path[];
  updated: Path[];
  renamed: Rename[];
}

export async function fetchStatus(repo: string): Promise<Status> {
  const [status, output, err] = await git(repo, "status --porcelain");
  if (!status.success) throw new ReleaseError("GIT_EXE", err);

  const S: Status = {
    raw: [],
    untracked: [],
    index: {
      modified: [],
      added: [],
      deleted: [],
      copied: [],
      updated: [],
      renamed: [],
    },
    tree: {
      modified: [],
      added: [],
      deleted: [],
      copied: [],
      updated: [],
      renamed: [],
    },
  };

  function box(code: string, changes: Changes, path: string, to?: string) {
    switch (code) {
      case "M":
        return changes.modified.push(path);
      case "A":
        return changes.added.push(path);
      case "D":
        return changes.deleted.push(path);
      case "C":
        return changes.copied.push(path);
      case "U":
        return changes.updated.push(path);
      case "R":
        return changes.renamed.push({ path, to: to! });
    }
  }

  const entries = output.split("\n");
  for (const entry of entries) {
    if (!entry) continue;
    const x = entry.charAt(0);
    const y = entry.charAt(1);

    let path: string;
    let to: string | undefined = undefined;
    if (entry.includes(" -> ")) {
      const sep = entry.indexOf(" -> ", 3);
      path = entry.substr(3, sep - 3);
      to = entry.substr(sep + 4);
      S.raw.push({ path, x, y, to });
    } else {
      path = entry.substr(3);
      S.raw.push({ path, x, y });
    }
    box(x, S.index, path, to);
    box(y, S.tree, path, to);
    if (x === "?" && y === "?") {
      S.untracked.push(path);
    }
  }

  return S;
}
