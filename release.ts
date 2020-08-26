import { log, colors, semver, wait } from "./deps.ts";

import { ReleaseConfig } from "./config.ts";
import { fetchRepo, Repo } from "./src/repo.ts";
import { github } from "./plugins/github/mod.ts";
import { pushBump } from "./src/bump.ts";

const logger = log.prefix("@");

const VERSION = "0.1.0";

type Action = "patch" | "minor" | "major" | "prerelease";

if (import.meta.main) {
  await log.setup({ filter: "INFO" });
  const args = Deno.args;

  if (~args.indexOf("--help") || ~args.indexOf("-h")) {
    console.log(`${colors.bold("RELEASE")} v${VERSION}
${colors.dim("the denosaurs team")}

usage: ${colors.yellow("release")} [options] [type] [...]

[options]:
  ${colors.bold("-h --help")}     ${colors.dim("Show this message")}

[type]:
  release type:
    * ${colors.bold("patch")}     ${colors.dim("eg: 1.2.3 -> 1.2.4")}
    * ${colors.bold("minor")}     ${colors.dim("eg: 1.2.3 -> 1.3.0")}
    * ${colors.bold("major")}     ${colors.dim("eg: 1.2.3 -> 2.0.0")}`);
    Deno.exit(0);
  }

  let arg = args[0];
  if (!["patch", "minor", "major", "pre"].includes(arg)) {
    logger.critical(`"${arg}" is not a valid action!`);
    Deno.exit(1);
  }
  if (arg === "pre") arg = "prerelease";

  const action = arg as Action;
  let suffix = undefined;
  if (action === "prerelease") {
    if (args[1]) suffix = args[1];
    else suffix = "canary";
  }

  const config: ReleaseConfig = {
    plugins: [github],
  };

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
    fetch.fail("Unable to load repo");
    Deno.exit(1);
  }
  fetch.succeed("Project loaded correctly");

  const [latest] = repo.tags;
  const from = latest.version;
  const to = semver.inc(from, action, undefined, suffix)!;

  if (repo.status.raw.length !== 0) {
    logger.critical("You have uncommitted changes on your repository!");
    Deno.exit(1);
  }

  if (features.preCommit) {
    for (const plugin of config.plugins) {
      if (!plugin.preCommit) continue;
      try {
        await plugin.preCommit(repo, from, to);
      } catch (err) {
        logger.critical(err.message);
        Deno.exit(1);
      }
    }
  }

  const bump = wait(
    `Releasing ${colors.bold(to)} ${colors.dim(`(latest was ${from})`)}`,
  ).start();
  try {
    await pushBump(repo, to);
  } catch (err) {
    bump.fail(`Unable to release ${colors.bold(to)}`);
    Deno.exit(1);
  }
  bump.succeed(`Released ${colors.bold(to)}`);

  if (features.postCommit) {
    for (const plugin of config.plugins) {
      if (!plugin.postCommit) continue;
      try {
        await plugin.postCommit(repo, from, to);
      } catch (err) {
        logger.critical(err.message);
        Deno.exit(1);
      }
    }
  }
}
