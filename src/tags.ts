import { semver } from "../deps.ts";

import { git } from "./git.ts";
import { ReleaseError } from "./error.ts";

const reTag = /tag:\s*([^,)]+)/g;
const reCommitDetails = /^(.+);(.+);(.+)$/;

export interface Tag {
  tag: string;
  version: string;
  hash: string;
  date: Date;
}

function filterByRange(tags: Tag[], range?: string) {
  if (!range) {
    return tags;
  }

  return tags.filter((tag) => semver.satisfies(tag.version, range));
}

function extractCommit(refs: string): Omit<Tag, "date" | "hash">[] {
  const tagNames = [];
  let match: RegExpExecArray | null;

  // Finding successive matches
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec#Finding_successive_matches
  while ((match = reTag.exec(refs)) !== null) {
    tagNames.push(match[1]);
  }

  return tagNames
    .map((name) => ({
      tag: name,
      version: semver.valid(name),
    }))
    .filter((tag) => tag.version != null) as Omit<Tag, "date" | "hash">[];
}

export function parseLine(line: string): Tag[] {
  const match = reCommitDetails.exec(line);

  if (!match || match.length < 4) {
    return [];
  }

  const tags = extractCommit(match[1]);
  const hash = match[2].trim();
  const date = new Date(match[3].trim());

  return tags.map((tag) => Object.assign(tag, { hash, date }));
}

interface FetchOptions {
  range: string;
  rev?: string;
}

export async function fetchTags(repo: string, options?: FetchOptions | string) {
  if (typeof options === "string") options = { range: options };
  const range = options && options.range;
  const rev = options && options.rev;
  const fmt = '--pretty="%d;%H;%ci" --decorate=short';
  const cmd = rev
    ? `log --simplify-by-decoration ${fmt} ${rev}`
    : `log --no-walk --tags ${fmt}`;

  const [status, output, err] = await git(repo, cmd);
  if (!status.success) throw new ReleaseError("GIT_EXE", err);

  const lines = output.split("\n");
  const tags = lines.map(parseLine).flat();

  return filterByRange(tags, range).sort((a, b) => {
    return semver.rcompare(a.version, b.version);
  });
}
