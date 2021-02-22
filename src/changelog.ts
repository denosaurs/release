import type { Repo } from "./repo.ts";
import type { Commit } from "./commits.ts";
import type { Tag } from "./tags.ts";

export interface Filter {
  type: string;
  title: string;
}

export interface Document {
  sections: string[];
  links: string[];
}

export function fmtLink(name: string, to: string): string {
  return `[${name}]: ${to}`;
}

export function pushHeader(doc: Document): void {
  doc.links.push(
    fmtLink("keep a changelog", "https://keepachangelog.com/en/1.0.0/"),
  );
  doc.links.push(
    fmtLink("semantic versioning", "https://semver.org/spec/v2.0.0.html"),
  );
  doc.sections.push(`# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to
[Semantic Versioning].`);
}

export function pushChanges(
  doc: Document,
  repo: Repo,
  title: string,
  commits: Commit[],
): void {
  doc.sections.push(`### ${title}`);
  const list: string[] = [];
  for (let commit of commits) {
    const { hash } = commit;
    const { subject } = commit.cc;
    const shortid = `\`${hash.substr(0, 7)}\``;

    if (repo.remote && repo.remote.github) {
      const { user, name } = repo.remote.github;
      let url = `https://github.com/${user}/${name}/`;
      url = `${url}commit/${hash}`;

      list.push(`- ${subject} ([${shortid}])`);
      doc.links.push(fmtLink(shortid, url));
    } else {
      list.push(`- ${subject} (${shortid})`);
    }
  }
  doc.sections.push(list.join("\n"));
}

export function pushTag(
  doc: Document,
  repo: Repo,
  commits: Commit[],
  filters: Filter[],
  tag: Tag,
  parent?: Tag,
  title?: string,
): void {
  let year = tag.date.getUTCFullYear();
  let month = String(tag.date.getUTCMonth() + 1).padStart(2, "0");
  let day = String(tag.date.getUTCDate()).padStart(2, "0");

  if (repo.remote && repo.remote.github) {
    const { user, name } = repo.remote.github;
    let url = `https://github.com/${user}/${name}/`;

    url = parent
      ? `${url}compare/${parent.version}...${tag.version}`
      : `${url}compare/${tag.version}`;
    doc.links.push(fmtLink(tag.version, url));
  }

  if (title) {
    doc.sections.push(`## ${title}`);
  } else {
    doc.sections.push(`## [${tag.version}] - ${year}-${month}-${day}`);
  }

  for (let filter of filters) {
    const filtered = commits.filter((_) => _.cc.type === filter.type);
    if (filtered.length > 0) {
      pushChanges(doc, repo, filter.title, filtered);
    }
  }
}

export function render(doc: Document): string {
  const sections = doc.sections.join("\n\n");
  const links = doc.links.join("\n");
  const full = [sections, links];
  return `${full.join("\n\n").trim()}\n`;
}

export function polyfillVersion(repo: Repo, to: string): [Tag[], Commit[]] {
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
