interface Verification {
  ok: boolean;
  err?: string;
}

const reToken = /^\w+$/;

export async function verifyToken(token: string): Promise<Verification> {
  if (!token) return { ok: false, err: "Empty token" };
  if (!reToken.test(token)) return { ok: false, err: "Malformed token" };
  const res = await fetch("https://api.github.com", {
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
