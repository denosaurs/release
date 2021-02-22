import { ensureFile, exists, join } from "../deps.ts";
import { home } from "./dirs.ts";

const STORE_PATH = [".config", "release"];

export const known = {
  github: "GITHUB_TOKEN",
};

export async function get(name: string): Promise<string | null> {
  const ci = Deno.env.get(name);
  if (ci) return ci;

  const oshome = home();
  if (!oshome) return null;
  const path = join(oshome, ...STORE_PATH);
  if (!(await exists(path))) return null;
  const source = await Deno.readTextFile(path);
  const constants = JSON.parse(source);
  return constants[name];
}

export async function set(name: string, value: string) {
  const oshome = home();
  if (!oshome) return;
  const path = join(oshome, ...STORE_PATH);
  let patch: string;
  if (await exists(path)) {
    const source = await Deno.readTextFile(path);
    const constants = JSON.parse(source);
    patch = JSON.stringify({ ...constants, [name]: value });
  } else {
    await ensureFile(path);
    patch = JSON.stringify({ [name]: value });
  }
  return Deno.writeTextFile(path, patch);
}
