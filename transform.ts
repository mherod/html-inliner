import { existsSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { fetch } from "cross-fetch";
import { DOMWindow, JSDOM } from "jsdom";
import LRUCache from "lru-cache";
import * as prettier from "prettier";
import { argv } from "./argv";

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
    const parentNode = link.parentNode;
    link.remove();
    const style = document.createElement("style");
    style.textContent = await extracted(href, distDir, formatLess);
    parentNode?.appendChild(style);
  }
}

export function removeSourceMap(s: string): string {
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
  const { window }: JSDOM = new JSDOM(inputHtml);
  const { document }: DOMWindow = window;

  if (document == null) {
    throw new Error("document is null");
  }

  if (!argv.includes("--no-inline-styles")) {
    await inlineStyles(document, dir);
  }

  if (!argv.includes("--no-inline-js") || !argv.includes("-n")) {
    await inlineJavascript(document, dir);
  }

  const documentElement = (document.documentElement ?? document.body);
  const html2 = documentElement.outerHTML;
  return removeSourceMap(formatHtml(html2));
}

export async function transformFile(
  dir: string,
  sourceHtml: string
) {
  if (!existsSync(sourceHtml)) {
    throw new Error("file does not exist: " + sourceHtml.substring(0, 100));
  }
  console.log("transforming", sourceHtml);
  const inputHtml: string = readFileSync(sourceHtml, "utf8");
  const outputHtml: string = await transformHtml(dir, inputHtml);
  writeFileSync(sourceHtml, outputHtml, "utf8");
  return outputHtml;
}
