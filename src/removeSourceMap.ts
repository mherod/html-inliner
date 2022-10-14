export function removeSourceMap(s: string): string {
  const regExp = /(\/\/)?# sourceMappingURL=.+$/g;
  const nl = "\n";
  return s
    .split(nl)
    .map((line) => line.replaceAll(regExp, "").trim())
    // .filter((line) => line.match(/^\S+$/))
    .join(nl);
}
