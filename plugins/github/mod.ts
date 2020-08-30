import { log, readLines, encode } from "./deps.ts";

import {
  ReleasePlugin,
  ReleaseConfig,
  Action,
  Repo,
  store,
} from "../../plugin.ts";
import {
  Document,
  Filter,
  polyfillVersion,
  pushTag,
  render,
} from "../../src/changelog.ts";

import * as gh from "./api.ts";
import { ReleaseError } from "../../src/error.ts";

const logger = log.prefix("gh");

export const github = <ReleasePlugin> {
  name: "GitHub",
  async setup(): Promise<void> {
    let token = await store.get(store.known.github);
    if (!token) {
      logger.warning("GitHub token not found!");
      logger.info("Please enter your GitHub token with <repo> score");
      logger.info("(for more info https://git.io/JJyrT)");
      await Deno.stdout.write(encode("> "));
      for await (let line of readLines(Deno.stdin)) {
        token = line;
        break;
      }
      const res = await gh.verifyToken(token!);
      if (!res.ok || !token) {
        logger.critical(`GitHub token is not valid! (err: ${res.err})`);
        Deno.exit(1);
      }
      logger.info("Token saved to local store!");
      await store.set(store.known.github, token);
    }
  },
  async postCommit(
    repo: Repo,
    action: Action,
    from: string,
    to: string,
    config: ReleaseConfig,
  ): Promise<void> {
    if (!repo.remote || !repo.remote.github) return;
    const doc: Document = { sections: [], links: [] };

    const [tags, commits] = polyfillVersion(repo, to);
    const filters: Filter[] = [
      {
        type: "feat",
        title: "Features",
      },
      {
        type: "fix",
        title: "Bug Fixes",
      },
    ];

    const latest = tags[0];
    const parent = tags[1];
    const belonging = commits.filter((_) => _.belongs?.hash === latest.hash);
    pushTag(doc, repo, belonging, filters, latest, parent, "Changelog");

    if (!config.dry) {
      let token = (await store.get(store.known.github)) as string;
      const { user, name } = repo.remote.github;
      const result = await gh.createRelease(token, user, name, {
        tag_name: to,
        name: `v${to}`,
        body: render(doc),
        prerelease: action.startsWith("pre"),
        draft: true,
      });
      if (!result.ok) throw new ReleaseError("PLUGIN", result.err);
    }
  },
};
