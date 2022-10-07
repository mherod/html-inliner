import { existsSync, PathOrFileDescriptor, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { fetch } from "cross-fetch";
import { JSDOM } from "jsdom";
import LRUCache from "lru-cache";
import * as prettier from "prettier";

const cache = new LRUCache<string, string>({ max: 1000 });

export function formatHtml(s: string): string {
  try {
    return prettier.format(s, { parser: "html" });
  } catch (error) {
    return s;
  }
}

export function formatLess(s: string): string {
  try {
    return prettier.format(s, { parser: "less" });
  } catch (error) {
    return s;
  }
}

export function formatJavascript(s: string): string {
  try {
    return prettier.format(s, { parser: "babel" });
  } catch (error) {
    return s;
  }
}

async function extracted(
  href: string,
  dir: string,
  post?: (s: string) => string
) {
  if (cache.has(href)) {
    return cache.get(href) as string;
  }

  const url = new URL(href);

  const filePath = path.join(dir, url.pathname);
  let source;
  if (existsSync(filePath)) {
    source = readFileSync(filePath, "utf8");
    console.log("source from file", filePath);
  } else {
    source = await fetch(url).then((res) => res.text());
    console.log("source from url", url);
  }
  source = post ? post?.(source) ?? source : source;
  cache.set(href, source);
  return source;
}

async function inlineStyles(document: Document, distDir: string) {
  const arrayLike = document.querySelectorAll("link[rel=stylesheet]");
  for (const link of Array.from(arrayLike)) {
    const href: string = link.getAttribute("href") || "";
    const style = document.createElement("style");
    style.textContent = await extracted(href, distDir, (s: string) => {
      return removeSourceMap(formatLess(s)).trim();
    });
    const parentNode = link.parentNode;
    parentNode?.appendChild(style);
    link.remove();
  }
}

export function removeSourceMap(s: string) {
  const regExp = /(\/\/)?# sourceMappingURL=.*/g;
  const nl = "\n";
  return s
    .split(nl)
    .map((line) => line.replaceAll(regExp, ""))
    .join(nl);
}

async function inlineJavascript(document: Document, dir: string) {
  // const arrayLike = document.querySelectorAll("script[src][type=module]");
  const arrayLike = document.querySelectorAll("script[src]");
  for (const script of Array.from(arrayLike)) {
    const src: string = script.getAttribute("src") ?? "";
    script.removeAttribute("src");
    script.textContent = await extracted(src, dir, (s: string) => {
      return removeSourceMap(formatJavascript(s)).trim();
    });
  }
}

export async function transformHtml(dir: string, inputHtml: string) {
  const { window } = new JSDOM(inputHtml);
  const document = window.document;

  await inlineStyles(document, dir);
  await inlineJavascript(document, dir);

  const html2 = document.documentElement.innerHTML;
  return removeSourceMap(formatHtml(html2));
}

export async function transformFile(
  dir: string,
  sourceHtml: PathOrFileDescriptor
) {
  console.log("transforming", sourceHtml);
  const inputHtml: string = readFileSync(sourceHtml, "utf8");
  const outputHtml: string = await transformHtml(dir, inputHtml);
  writeFileSync(sourceHtml, outputHtml);
  return outputHtml;
}
