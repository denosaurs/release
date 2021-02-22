import { join } from "./deps.ts";

import type {
  Action,
  ReleaseConfig,
  ReleasePlugin,
  Repo,
} from "../../plugin.ts";
import {
  Document,
  Filter,
  polyfillVersion,
  pushHeader,
  pushTag,
  render,
} from "../../src/changelog.ts";

export const changelog = <ReleasePlugin> {
  name: "Changelog",
  async preCommit(
    repo: Repo,
    action: Action,
    from: string,
    to: string,
    config: ReleaseConfig,
  ): Promise<void> {
    const doc: Document = { sections: [], links: [] };
    pushHeader(doc);

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

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const parent = tags[i + 1]; // last is undefined
      const belonging = commits.filter((_) => _.belongs?.hash === tag.hash);
      pushTag(doc, repo, belonging, filters, tag, parent);
    }

    const md = render(doc);
    if (!config.dry) {
      await Deno.writeTextFile(join(repo.path, "CHANGELOG.md"), md);
    } else {
      console.log(md);
    }
  },
};
