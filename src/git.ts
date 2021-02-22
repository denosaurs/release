import { ini, join } from "../deps.ts";

import { ReleaseError } from "./error.ts";

const decoder = new TextDecoder();

export async function git(
  repo: string,
  args: string[] | string,
): Promise<[Deno.ProcessStatus, string, string]> {
  const dir = `--git-dir=${join(repo, ".git")}`;
  if (typeof args === "string") args = args.split(" ");
  const process = Deno.run({
    cwd: repo,
    cmd: ["git", dir, ...args],
    stdout: "piped",
    stderr: "piped",
  });
  let output = await process.output();
  let err = await process.stderrOutput();
  let status = await process.status();
  process.close();
  return [status, decoder.decode(output), decoder.decode(err)];
}

export async function ezgit(
  repo: string,
  args: string[] | string,
): Promise<void> {
  const [status, _, err] = await git(repo, args);
  if (!status.success) throw new ReleaseError("GIT_EXE", err);
}

export async function fetchConfig(repo: string): Promise<GitConfig> {
  const path = join(repo, ".git", "config");
  let source = await Deno.readTextFile(path);
  source = source.replace(/\[(\S+) "(.*)"\]/g, (m, $1, $2) => {
    return $1 && $2 ? `[${$1} "${$2.split(".").join("\\.")}"]` : m;
  });
  let config = ini.decode(source);
  for (let key of Object.keys(config)) {
    let m = /(\S+) "(.*)"/.exec(key);
    if (!m) continue;
    let prop = m[1];
    config[prop] = config[prop] || {};
    config[prop][m[2]] = config[key];
    delete config[key];
  }
  return config;
}

interface GitConfigCore {
  [key: string]: unknown;
}

export interface Remote {
  url: string;
  fetch: string;
  [key: string]: unknown;
}

interface GitConfigRemote {
  [key: string]: Remote;
}

export interface Branch {
  remote: string;
  merge: string;
  [key: string]: unknown;
}

interface GitConfigBranch {
  [key: string]: Branch;
}

export interface GitConfig {
  core: GitConfigCore;
  remote: GitConfigRemote;
  branch: GitConfigBranch;
}
