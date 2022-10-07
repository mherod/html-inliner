import {
  existsSync,
  PathOrFileDescriptor,
  readFileSync,
  writeFileSync,
} from "fs";
import * as path from "path";
import { fetch } from "cross-fetch";
import { JSDOM } from "jsdom";
import * as prettier from "prettier";

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

async function extracted(href: string, dir: string) {
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
  return source;
}

async function inlineStyles(document: Document, distDir: string) {
  const arrayLike = document.querySelectorAll("link[rel=stylesheet]");
  for (const link of Array.from(arrayLike)) {
    const href: string = link.getAttribute("href") || "";
    let source = await extracted(href, distDir);
    const style = document.createElement("style");
    style.textContent = formatLess(source);
    const parentNode = link.parentNode;
    parentNode?.appendChild(style);
    link.remove();
  }
}

async function inlineJavascript(document: Document, dir: string) {
  // const arrayLike = document.querySelectorAll("script[src][type=module]");
  const arrayLike = document.querySelectorAll("script[src]");
  for (const script of Array.from(arrayLike)) {
    const src: string = script.getAttribute("src") ?? "";
    script.removeAttribute("src");
    const source = await extracted(src, dir);
    script.textContent = formatJavascript(source);
  }
}

export async function transformHtml(dir: string, inputHtml: string) {
  const { window } = new JSDOM(inputHtml);
  const document = window.document;

  await inlineStyles(document, dir);
  await inlineJavascript(document, dir);

  const html2 = document.documentElement.innerHTML;
  return formatHtml(html2);
}

export async function transformFile(
  dir: string,
  sourceHtml: PathOrFileDescriptor
) {
  const inputHtml: string = readFileSync(sourceHtml, "utf8");
  const outputHtml: string = await transformHtml(dir, inputHtml);
  writeFileSync(sourceHtml, outputHtml);
  return outputHtml;
}
