// noinspection JSUnusedGlobalSymbols

import * as fs from "fs";
import { readdirAsync } from "./readdir-async";
import { statAsync } from "./stat-async";

export function walkDirectory(dir: fs.PathLike, fileName: string): string[] {
  const found: string[] = [];
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

export async function walkDirectoryAsync(dir: fs.PathLike, fileName: string): Promise<string[]> {
  const found: string[] = [];
  const files = await readdirAsync(dir);
  const promises = [];
  for (const file of files) {
    const path = dir + "/" + file;
    const p = statAsync(path).then(stats => {
      if (stats.isDirectory()) {
        return walkDirectoryAsync(path, fileName).then(files => {
          found.push(...files);
        });
      } else {
        if (path.endsWith(fileName)) {
          found.push(path);
        }
      }
    });
    promises.push(p);
  }
  await Promise.all(promises);
  return found;
}
