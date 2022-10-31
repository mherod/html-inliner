export function urlOrNull(href: string) {
  let url: URL | undefined;
  try {
    url = new URL(href);
  } catch (e) {
  }
  return url;
}
