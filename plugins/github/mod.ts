import { log, readLines, encode } from "./deps.ts";

import { ReleasePlugin, store } from "../../plugin.ts";

import * as gh from "./api.ts";

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
};
