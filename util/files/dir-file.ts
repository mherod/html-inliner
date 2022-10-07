import * as path from "path";

export function dirFile(dir: string, file: string): string {
  return path.join(dir, file);
}
