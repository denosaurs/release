import { ReleasePlugin } from "./plugin.ts";

export interface ReleaseConfig {
  plugins: ReleasePlugin[];
  dry: boolean;
}
