import * as fs from "fs";

export function walkDirectory(dir: fs.PathLike, fileName: string): string[] {
  const found = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const path = dir + "/" + file;
    if (fs.statSync(path).isDirectory()) {
      found.push(...walkDirectory(path, fileName));
    } else {
      if (path.endsWith(fileName)) {
        found.push(path);
      }
    }
  }
  return found;
}
