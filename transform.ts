import { existsSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { fetch } from "cross-fetch";
import { DOMWindow, JSDOM } from "jsdom";
import LRUCache from "lru-cache";
import * as prettier from "prettier";
import { argv } from "./argv";

const cache = new LRUCache<string, ExtractedResource>({ max: 1000 });

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

async function fetchResource(url: URL): Promise<ExtractedResource> {
  const res = await fetch(url);
  const result1: ArrayBuffer = await res.arrayBuffer();
  return {
    href: url.href,
    buffer: Buffer.from(result1),
    contentType: res.headers.get("content-type") ?? "text/javascript"
  };
}

async function extractedResource(
  href: string,
  dir: string,
  post?: (s: Buffer) => Buffer
): Promise<ExtractedResource | undefined> {

  if (cache.has(href)) {
    return cache.get(href) as ExtractedResource;
  }

  let url: URL | undefined;
  try {
    url = new URL(href);
  } catch (e) {

  }
  const pathname = url?.pathname ?? href;
  const filePath = path.join(dir, pathname);
  let buffer: Buffer;
  let extractedResource: ExtractedResource | undefined;
  if (existsSync(filePath)) {
    console.log("source from file", filePath);
    extractedResource = {
      href: href,
      buffer: readFileSync(filePath),
      contentType: pathname.endsWith(".css") ? "text/css" : "text/javascript"
    };
  } else if (url) {
    console.log("source from url", url);
    extractedResource = await fetchResource(url);
  }
  if (extractedResource?.buffer) {
    buffer = extractedResource.buffer;
    buffer = post ? post?.(buffer) ?? buffer : buffer;
    extractedResource.buffer = buffer;
    cache.set(href, extractedResource);
  }
  return extractedResource;
}

async function inlineStyles(document: Document, distDir: string) {
  const arrayLike = document.querySelectorAll("link[rel=stylesheet]");
  for (const link of Array.from(arrayLike)) {
    const href: string = link.getAttribute("href") || "";
    const parentNode = link.parentNode;
    link.remove();
    const style = document.createElement("style");
    style.setAttribute("type", "text/css");
    const resource = await extractedResource(href, distDir, (buffer: Buffer): Buffer => {
      const s = buffer.toString("utf8");
      const s1 = formatLess(s);
      return Buffer.from(s1);
    });
    const resourceBuffer = resource?.buffer;
    if (resourceBuffer) {
      style.textContent = resourceBuffer.toString("utf8");
    }

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
    const resource = await extractedResource(src, dir, (buffer: Buffer): Buffer => {
      const s = buffer.toString("utf8");
      const s1 = formatJavascript(s);
      const s2 = removeSourceMap(s1);
      const s3 = s2.trim();
      return Buffer.from(s3, "utf8");
    });
    const resourceBuffer = resource?.buffer;
    if (resourceBuffer) {
      script.textContent = resourceBuffer.toString("utf8");
    }
  }
}

async function inlineImages(document: Document, dir: string) {
  const arrayLike = document.querySelectorAll("img[src]");
  for (const img of Array.from(arrayLike)) {
    const src: string = img.getAttribute("src") ?? "";
    if (src.startsWith("data:")) {
      continue;
    }
    const resource = await extractedResource(src, dir);
    const buffer = resource?.buffer;
    if (!buffer) {
      continue;
    }
    const contentType: string = resource.contentType;
    if (contentType == "image/svg+xml") {
      const svg: string = buffer.toString("utf8");
      img.setAttribute("src", `data:image/svg+xml,${svg}`);
    } else {
      const base64: string = buffer.toString("base64");
      img.setAttribute("src", `data:${contentType};base64,${base64}`);
    }
  }
}

async function inlinePictureSources(document: Document, dir: string) {
  const arrayLike = document.querySelectorAll("picture source[srcset]");
  for (const source of Array.from(arrayLike)) {
    const srcset: string = source.getAttribute("srcset") ?? "";
    if (srcset.startsWith("data:")) {
      continue;
    }
    const srcset1 = await Promise.all(
      srcset.split(",").map(async (s) => {
        const [url, size] = s.trim().split(" ");
        const resource = await extractedResource(url, dir);
        const buffer = resource?.buffer;
        if (!buffer) {
          return s;
        }
        const contentType: string = resource.contentType;
        const base64: string = buffer.toString("base64");
        const s1 = `data:${contentType};base64,${base64} ${size ?? ""}`;
        return s1.trim();
      })
    );
    source.setAttribute("srcset", srcset1.join(","));
  }
}

export async function transformHtml(dir: string, inputHtml: string) {
  const { window }: JSDOM = new JSDOM(inputHtml);
  const { document }: DOMWindow = window;

  // noinspection HtmlRequiredTitleElement
  const hasHead = inputHtml.includes("<head>");
  const hasBody = inputHtml.includes("<body>");

  if (document == null) {
    throw new Error("document is null");
  }

  if (!argv.find((arg) => arg === "--no-inline-images")) {
    await inlineImages(document, dir);
    await inlinePictureSources(document, dir);
  }

  if (!argv.find((arg) => arg.startsWith("--no-inline-css"))) {
    console.log("inlining css");
    await inlineStyles(document, dir);
  }

  if (!argv.find((arg) => arg.startsWith("--no-inline-js"))) {
    console.log("inlining js");
    await inlineJavascript(document, dir);
  }

  const documentElement = document.documentElement ?? document.body;

  if (hasHead && hasBody) {
    const html2 = documentElement.innerHTML;
    return removeSourceMap(formatHtml(html2));
  }

  const html = document.head.innerHTML + "" + document.body.innerHTML;
  return formatHtml(html);
}

export async function transformFile(dir: string, sourceHtml: string) {
  if (!existsSync(sourceHtml)) {
    throw new Error("file does not exist: " + sourceHtml.substring(0, 100));
  }
  console.log("transforming", sourceHtml);
  const inputHtml: string = readFileSync(sourceHtml, "utf8");
  const outputHtml: string = await transformHtml(dir, inputHtml);
  writeFileSync(sourceHtml, outputHtml, "utf8");
  return outputHtml;
}

interface ExtractedResource {
  href: string;
  buffer: Buffer;
  contentType: string;
}
