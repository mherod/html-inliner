import * as fs from "fs";
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

async function extracted(href: string, distDir: string) {
  const url = new URL(href);

  const filePath = path.join(distDir, url.pathname);
  let source;
  if (fs.existsSync(filePath)) {
    source = fs.readFileSync(filePath, "utf8");
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

async function inlineJavascript(document: Document, distDir: string) {
  const arrayLike = document.querySelectorAll("script[src][type=module]");
  for (const script of Array.from(arrayLike)) {
    const src: string = script.getAttribute("src") ?? "";
    script.removeAttribute("src");
    const source = await extracted(src, distDir);
    script.textContent = formatJavascript(source);
  }
}

export async function transform(sourceHtml: fs.PathOrFileDescriptor, distDir: string) {
  console.log("transforming", sourceHtml);
  const html = fs.readFileSync(sourceHtml);
  const { window } = new JSDOM(html);
  const document = window.document;

  await inlineStyles(document, distDir);
  await inlineJavascript(document, distDir);

  const html2 = document.documentElement.innerHTML;
  fs.writeFileSync(sourceHtml, formatHtml(html2));
}
