interface Response {
  ok: boolean;
  err?: string;
}

const BASE = "https://api.github.com";

const reToken = /^\w+$/;

export async function verifyToken(token: string): Promise<Response> {
  if (!token) return { ok: false, err: "Empty token" };
  if (!reToken.test(token)) return { ok: false, err: "Malformed token" };
  const res = await fetch(BASE, {
    headers: {
      Authorization: `token ${token}`,
    },
  });
  const body = await res.json();
  if (body.message === "Bad credentials") {
    return { ok: false, err: "Bad credentials" };
  }
  const scopes = res.headers.get("X-OAuth-Scopes");
  if (scopes && scopes.includes("repo")) {
    return { ok: true };
  } else {
    return { ok: false, err: "Missing <repo> scope" };
  }
}

interface Release {
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
}

export async function createRelease(
  token: string,
  owner: string,
  repo: string,
  release: Release,
): Promise<Response> {
  if (!token) return { ok: false, err: "Empty token" };
  if (!reToken.test(token)) return { ok: false, err: "Malformed token" };
  const res = await fetch(`${BASE}/repos/${owner}/${repo}/releases`, {
    method: "POST",
    headers: {
      Authorization: `token ${token}`,
    },
    body: JSON.stringify(release),
  });
  if (res.status !== 201) return { ok: false, err: "Release not created" };
  return { ok: true };
}
