import { log, colors, semver, wait, delay } from "./deps.ts";

import { ReleaseConfig } from "./config.ts";
import { fetchRepo, Repo } from "./src/repo.ts";
import { ezgit } from "./src/git.ts";

import { github } from "./plugins/github/mod.ts";
import { changelog } from "./plugins/changelog/mod.ts";
import { zen } from "./zen.ts";

const logger = log.prefix("r");

const VERSION = "0.1.0";

export type Action =
  | "patch"
  | "minor"
  | "major"
  | "prepatch"
  | "preminor"
  | "premajor";

if (import.meta.main) {
  await log.setup({ filter: "INFO" });
  let args = [...Deno.args];

  if (~args.indexOf("--help") || ~args.indexOf("-h") || args.length === 0) {
    console.log(`${colors.bold("RELEASE")} v${VERSION}
${colors.dim("the denosaurs team")}
${colors.dim(`zen: ${colors.italic(zen())}`)}

usage: ${colors.yellow("release")} [options] <type> [...]

example: ${colors.yellow("release")} major

[options]:
  ${colors.bold("-h --help")}     ${colors.dim("Show this message")}
  ${colors.bold("--dry")}         ${colors.dim("Prevent changes to git")}

[type]:
  release type:
    * ${colors.bold("patch")}             ${colors.dim("eg: 1.2.3 -> 1.2.4")}
    * ${colors.bold("minor")}             ${colors.dim("eg: 1.2.3 -> 1.3.0")}
    * ${colors.bold("major")}             ${colors.dim("eg: 1.2.3 -> 2.0.0")}
    * ${colors.bold("prepatch <name>")}   ${
      colors.dim(
        "eg: 1.2.3 -> 1.2.4-name",
      )
    }
    * ${colors.bold("preminor <name>")}   ${
      colors.dim(
        "eg: 1.2.3 -> 1.2.4-name",
      )
    }
    * ${colors.bold("premajor <name>")}   ${
      colors.dim(
        "eg: 1.2.3 -> 1.2.4-name",
      )
    }`);
    Deno.exit(0);
  }

  const config: ReleaseConfig = {
    plugins: [github, changelog],
    dry: false,
  };

  if (~args.indexOf("--dry")) {
    config.dry = true;
    args.splice(args.indexOf("--dry"), 1);
  }

  const actions = [
    "patch",
    "minor",
    "major",
    "prepatch",
    "preminor",
    "premajor",
  ];

  let arg = args[0];
  if (!actions.includes(arg)) {
    logger.critical(`"${arg}" is not a valid action!`);
    Deno.exit(1);
  }
  if (arg === "pre") arg = "prerelease";

  const action = arg as Action;
  let suffix = undefined;
  if (["prepatch", "preminor", "premajor"].includes(action)) {
    if (args[1]) suffix = args[1];
    else suffix = "canary";
  }

  const features = {
    setup: false,
    preCommit: false,
    postCommit: false,
  };

  for (const plugin of config.plugins) {
    if (plugin.setup) features.setup = true;
    if (plugin.preCommit) features.preCommit = true;
    if (plugin.postCommit) features.postCommit = true;
  }

  for (const plugin of config.plugins) {
    if (!plugin.setup) continue;
    try {
      await plugin.setup();
    } catch (err) {
      logger.critical(err.message);
      Deno.exit(1);
    }
  }

  const fetch = wait("Loading project info").start();
  let repo: Repo;
  try {
    repo = await fetchRepo(Deno.cwd());
  } catch (err) {
    fetch.fail(Deno.inspect(err));
    Deno.exit(1);
  }
  fetch.succeed("Project loaded correctly");

  const [latest] = repo.tags;
  const from = latest ? latest.version : "0.0.0";
  const to = semver.inc(from, action, undefined, suffix)!;

  let integrity = wait("Checking the project").start();
  await delay(1000);
  if (repo.status.raw.length !== 0) {
    integrity.fail("Uncommitted changes on your repository!");
    Deno.exit(1);
  } else if (!repo.commits.some((_) => _.belongs === null)) {
    integrity.fail(`No changes since the last release!`);
    Deno.exit(1);
  }
  integrity.succeed("Project check successful!");

  if (features.preCommit) {
    for (const plugin of config.plugins) {
      if (!plugin.preCommit) continue;
      try {
        await plugin.preCommit(repo, action, from, to, config);
      } catch (err) {
        logger.critical(err.message);
        Deno.exit(1);
      }
    }
  }

  try {
    repo = await fetchRepo(Deno.cwd());
  } catch (err) {
    Deno.exit(1);
  }

  const bump = wait(
    `Releasing ${colors.bold(to)} ${colors.dim(`(latest was ${from})`)}`,
  ).start();

  if (!config.dry) {
    try {
      await ezgit(repo.path, "add -A");
      await ezgit(repo.path, [
        "commit",
        "--allow-empty",
        "--message",
        `chore: release ${to}`,
      ]);
      await ezgit(repo.path, `tag ${to}`);
      await ezgit(repo.path, "push");
      await ezgit(repo.path, "push --tags");
    } catch (err) {
      bump.fail(`Unable to release ${colors.bold(to)}\n`);
      logger.critical(err.message);
      Deno.exit(1);
    }
    bump.succeed(`Released ${colors.bold(to)}!`);
  } else {
    bump.warn(
      `Skipping release ${colors.bold(to)} ${
        colors.dim(
          `(latest was ${from})`,
        )
      }`,
    );
  }

  if (features.postCommit) {
    for (const plugin of config.plugins) {
      if (!plugin.postCommit) continue;
      try {
        await plugin.postCommit(repo, action, from, to, config);
      } catch (err) {
        logger.critical(err.message);
        Deno.exit(1);
      }
    }
  }
}
