import { PathOrFileDescriptor, writeFile } from "fs";

export async function writeFileAsync(
  file: PathOrFileDescriptor,
  content: string | NodeJS.ArrayBufferView
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    writeFile(file, content, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
