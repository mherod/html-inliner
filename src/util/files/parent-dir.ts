export function parentDir(dir: string): string {
  return dir.split("/").slice(0, -1).join("/");
}
