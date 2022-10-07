import { PathLike, unlink } from "fs";

export async function deleteFileAsync(file: PathLike): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    unlink(file, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
