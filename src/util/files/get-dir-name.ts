import { resolvePath } from "./resolve-path";

export function getDirName(dir: string): string {
  return `${resolvePath(dir).split("/").pop()}`;
}
