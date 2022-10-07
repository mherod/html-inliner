export function tidyPath(dirtyPath: string) {
  const absolute = dirtyPath.startsWith("/");
  const joined = dirtyPath
    .split("/")
    .filter((x: string | any[]) => x.length > 0)
    .join("/");
  return absolute ? `/${joined}` : joined;
}
