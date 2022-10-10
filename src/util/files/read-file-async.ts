import { PathOrFileDescriptor, readFile } from "fs";

export async function readFileAsync(
  file: PathOrFileDescriptor,
  encoding: string = "utf8"
  //
): Promise<string> {
  return new Promise((resolve, reject) => {
    // @ts-ignore
    readFile(file, { encoding }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
