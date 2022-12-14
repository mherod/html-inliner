import { existsSync } from "fs";
import { walkDirectoryAsync } from "./util/files/walk-directory";
import { blue, yellow } from "colorette";
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
    const subFilePath: string = file.substring(dir.length);
    console.log(
      blue(`Transforming`),
      yellow(subFilePath)
    );
    promises.push(
      transformFile(dir, file).catch(console.error)
    );
  }
  const all = await Promise.all(promises);
  return all.length;
}
