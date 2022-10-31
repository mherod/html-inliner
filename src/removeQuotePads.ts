

export function removeQuotePads(href: string) {
  const quotes = ["'", '"'];
  href = href.trim();
  while (quotes.some(q => href.startsWith(q) && href.endsWith(q))) {
    href = href.slice(1, -1).trim();
  }
  return href;
}
