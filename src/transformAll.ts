import { existsSync } from "fs";
import { walkDirectoryAsync } from "./util/files/walk-directory";
import { blue } from "colorette";
import { transformFile } from "./transformFile";

export async function transformAll(dir: string): Promise<number> {
  if (!existsSync(dir)) {
    throw new Error(`Directory ${dir} does not exist`);
  }
  const walkedFiles = await Promise.all([
    walkDirectoryAsync(dir, ".html"),
    walkDirectoryAsync(dir, ".css")
  ]);
  const promises = [];
  for (const file of walkedFiles.flat()) {
    console.log(blue(`Transforming ${file}`));
    const p = transformFile(dir, file).catch(console.error);
    promises.push(p);
  }
  return (await Promise.all(promises)).length;
}
