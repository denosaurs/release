import { decode, join, ini } from "../deps.ts";

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
  return [status, decode(output), decode(err)];
}

export function gitconfig(source: string): GitConfig {
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
  [key: string]: any;
}

export interface Remote {
  url: string;
  fetch: string;
  [key: string]: any;
}

interface GitConfigRemote {
  [key: string]: Remote;
}

export interface Branch {
  remote: string;
  merge: string;
  [key: string]: any;
}

interface GitConfigBranch {
  [key: string]: Branch;
}

export interface GitConfig {
  core: GitConfigCore;
  remote: GitConfigRemote;
  branch: GitConfigBranch;
}
