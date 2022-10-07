import { existsSync, mkdirSync, PathLike } from "fs";

export function assertDir(dir: PathLike): boolean | void {
  return existsSync(dir) || mkdirSync(dir);
}
