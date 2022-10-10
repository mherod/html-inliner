export function ignoreUrl(url: string) {
  return url.startsWith("data:") || url.startsWith("#");
}
