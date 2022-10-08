import { transformFile, transformHtml } from "./transform";
import { walkDirectory } from "./util/files/walk-directory";
import { existsSync } from "fs";

export async function transformAll(dir: string): Promise<number> {
  if (!existsSync(dir)) {
    throw new Error(`Directory ${dir} does not exist`);
  }
  console.log("transforming all in " + dir);
  const files = [];
  for (const path of walkDirectory(dir, ".html")) files.push(path);
  for (const path of walkDirectory(dir, ".css")) files.push(path);
  const promises = [];
  for (const file of files) {
    const p = transformFile(dir, file).catch(console.error);
    promises.push(p);
  }
  return (await Promise.all(promises)).length;
}

// noinspection JSUnusedGlobalSymbols
export default {
  transformFile,
  transformHtml,
  transformAll
};
