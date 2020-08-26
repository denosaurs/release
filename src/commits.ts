import { git } from "./git.ts";
import { Tag } from "./tags.ts";
import { ReleaseError } from "./error.ts";

export interface RawCommit {
  hash: string;
  title: string;
  description: string;
  author: string;
}

export async function fetchRawCommits(
  repo: string,
  rev?: string,
): Promise<RawCommit[]> {
  const inner = Date.now();
  const outer = inner - 1;

  // How the output shoud look like
  const spec = ["s", "n", "ae", "b"]; // add at
  const format = `${inner}%${spec.join(`${inner}%`)}${outer}`;

  const [status, output, err] = await git(repo, [
    "rev-list",
    `--pretty=format:${format}`,
    "--header",
    rev ?? "HEAD",
  ]);
  if (!status.success) throw new ReleaseError("GIT_EXE", err);

  let commits: RawCommit[] = [];
  const parts = output
    .split(String(outer))
    .map((item) => item.trim())
    .filter((item) => item.length)
    .map((item) => {
      const splitted = item.split(String(inner));
      const details = splitted.map((i) => i.trim()).filter((i) => i);

      return {
        hash: details[0].split(" ")[1],
        title: details[1] || "",
        description: details[3] || "",
        author: details[2],
      };
    })
    .filter((i) => i);

  commits = commits.concat(parts);
  return commits;
}

export interface Commit {
  hash: string;
  title: string;
  description: string;
  author: string;
  belongs: Tag | null;
}

export async function fetchCommits(
  repo: string,
  tags: Tag[],
): Promise<Commit[]> {
  let all: Commit[] = [];

  async function add(rev: string | undefined, belongs: Tag | null) {
    let commits = await fetchRawCommits(repo, rev);
    all = all.concat(
      commits.map((_) => ({
        ..._,
        belongs,
      })),
    );
  }

  if (tags.length === 0) {
    await add(undefined, null);
    return all;
  }

  let child = tags[0];
  let parent = tags[0];

  if (child) {
    await add(`${child.hash}..HEAD`, null);
  }

  for (let i = 0; i < tags.length - 1; i++) {
    child = tags[i];
    parent = tags[i + 1];
    await add(`${parent.hash}..${child.hash}`, child);
  }

  if (parent) {
    await add(parent.hash, parent);
  }

  return all;
}

// export interface NewCommits {
//   all: Commit[],
//   latest: Commit | undefined
// }

// export async function fetchNewCommits(repo: string, tags: Tag[]): Promise<NewCommits> {
//   const [release, parent] = tags;
//   let loadAll = false;

//   if (!release || !parent || !parent.hash || !release.hash) {
//     loadAll = true;
//   }

//   const rev = loadAll ? undefined : `${parent.hash}..${release.hash}`;

//   // Load the commits using `git rev-list`
//   const all = await fetchCommits(repo, rev);

//   // Find the latest commit, as it's the release reference
//   const latest = all.find((commit) => commit.hash === release.hash);
//   const latestIndex = all.indexOf(latest as Commit);

//   // Remove the latest commit from the collection
//   all.splice(latestIndex, 1);

//   // Hand back the commits
//   return { all, latest };
// }
