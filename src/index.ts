import { transformFile, transformHtml } from "./transform";
import { walkDirectory } from "./util/files/walk-directory";
import { existsSync } from "fs";
import { blue } from "colorette";

export async function transformAll(dir: string): Promise<number> {
  if (!existsSync(dir)) {
    throw new Error(`Directory ${dir} does not exist`);
  }
  const files = [];
  files.push(...walkDirectory(dir, ".html"));
  files.push(...walkDirectory(dir, ".css"));
  const promises = [];
  for (const file of files) {
    console.log(blue(`Transforming ${file}`));
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
