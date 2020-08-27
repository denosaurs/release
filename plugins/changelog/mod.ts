import { join } from "./deps.ts";

import { ReleasePlugin, Repo, Tag, Commit } from "../../plugin.ts";

const filters = [
  {
    type: "feat",
    title: "Features",
  },
  {
    type: "fix",
    title: "Bug Fixes",
  },
];

interface Document {
  sections: string[];
  links: string[];
}

function fmtLink(name: string, to: string): string {
  return `[${name}]: ${to}`;
}

function pushHeader(doc: Document): void {
  doc.links.push(
    fmtLink("keep a changelog", "https://keepachangelog.com/en/1.0.0/"),
  );
  doc.links.push(
    fmtLink("semantic versioning", "https://semver.org/spec/v2.0.0.html"),
  );
  doc.sections.push(`# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog],
and this project adheres to [Semantic Versioning].`);
}

function pushChanges(
  doc: Document,
  repo: Repo,
  title: string,
  commits: Commit[],
): void {
  doc.sections.push(`### ${title}`);
  const list: string[] = [];
  for (let commit of commits) {
    const { hash } = commit;
    const shortid = `\`${hash.substr(0, 7)}\``;
    list.push(`- ${commit.cc.subject} ([${shortid}])`);

    if (repo.remote && repo.remote.startsWith("https://github.com/")) {
      let url = repo.remote;
      if (url.endsWith(".git")) url = url.slice(0, -4);
      if (!url.endsWith("/")) url += "/";
      url = `${url}commit/${hash}`;
      doc.links.push(fmtLink(shortid, url));
    }
  }
  doc.sections.push(list.join("\n"));
}

function pushTag(
  doc: Document,
  repo: Repo,
  commits: Commit[],
  tag: Tag,
  parent?: Tag,
): void {
  let year = tag.date.getUTCFullYear();
  let month = String(tag.date.getUTCMonth() + 1).padStart(2, "0");
  let day = String(tag.date.getUTCDate()).padStart(2, "0");

  if (repo.remote && repo.remote.startsWith("https://github.com/")) {
    let url = repo.remote;
    if (url.endsWith(".git")) url = url.slice(0, -4);
    if (!url.endsWith("/")) url += "/";

    url = parent
      ? `${url}compare/${parent.version}...${tag.version}`
      : `${url}compare/${tag.version}`;
    doc.links.push(fmtLink(tag.version, url));
  }

  doc.sections.push(`## [${tag.version}] - ${year}-${month}-${day}`);

  for (let filter of filters) {
    const filtered = commits.filter((_) => _.cc.type === filter.type);
    if (filtered.length > 0) {
      pushChanges(doc, repo, filter.title, filtered);
    }
  }
}

function render(doc: Document): string {
  const sections = doc.sections.join("\n\n");
  const links = doc.links.join("\n");
  return `${sections}\n\n${links}\n`;
}

function polyfillVersion(repo: Repo, to: string): [Tag[], Commit[]] {
  const newtag: Tag = {
    tag: to,
    version: to,
    date: new Date(),
    hash: "",
  };
  const tags = [newtag, ...repo.tags];
  const commits = [...repo.commits];

  for (let commit of commits) {
    if (commit.belongs !== null) break;
    commit.belongs = newtag;
  }

  return [tags, commits];
}

export const changelog = <ReleasePlugin> {
  name: "Changelog",
  async preCommit(repo: Repo, from: string, to: string): Promise<void> {
    const doc: Document = { sections: [], links: [] };
    pushHeader(doc);

    const [tags, commits] = polyfillVersion(repo, to);

    for (let i = 0; i < tags.length; i++) {
      const tag = tags[i];
      const parent = tags[i + 1]; // last is undefined
      const belonging = commits.filter((_) => _.belongs?.hash === tag.hash);
      pushTag(doc, repo, belonging, tag, parent);
    }

    await Deno.writeTextFile(join(repo.path, "CHANGELOG.md"), render(doc));
  },
};
