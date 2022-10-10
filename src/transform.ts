import { existsSync, readFileSync, writeFileSync } from "fs";
import * as path from "path";
import { DOMWindow, JSDOM } from "jsdom";
import LRUCache from "lru-cache";
import { argv } from "./argv";
import { green, red, yellow } from "colorette";
import mime from "mime-types";
import { optimize, OptimizedError, OptimizedSvg } from "svgo";
import { ignoreUrl } from "./ignoreUrl";
import { minifyCss } from "./minifyCss";
import { formatXml } from "./formatXml";
import { formatHtml } from "./formatHtml";
import { formatLess } from "./formatLess";
import { formatJavascript } from "./formatJavascript";
import { ExtractedResource } from "./extractedResource";
import { fetchResource } from "./fetchResource";

const cache = new LRUCache<string, ExtractedResource>({ max: 1000 });

async function extractedResource(
  href: string,
  dir: string,
  post?: (s: Buffer) => Buffer | Promise<Buffer>
): Promise<ExtractedResource | undefined> {
  href = href.trim().replace(/^"/, "").replace(/"$/, "").trim();

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
    const contentType = mime.lookup(filePath);
    if (!contentType) {
      console.log(red("unknown content type"), filePath);
      return;
    }
    extractedResource = {
      href: href,
      buffer: readFileSync(filePath),
      contentType
    };
  } else if (url instanceof URL) {
    const url1: URL = url!;
    if (ignoreUrl(url1.href)) {
      return;
    } else if (url1.protocol === "http:" || url1.protocol === "https:") {
      extractedResource = await fetchResource(url1);
    } else if (url1.protocol === "data:") {
      extractedResource = {
        href: href,
        buffer: Buffer.from(url1.href),
        contentType: mime.lookup(url1.pathname) || "application/octet-stream"
      };
    }
  } else {
    return;
  }
  if (extractedResource?.buffer) {
    buffer = extractedResource.buffer;
    buffer = await (post ? post?.(buffer) ?? buffer : buffer);
    extractedResource.buffer = buffer;
    cache.set(href, extractedResource);
  }
  return extractedResource;
}

export async function transformStyles(input: string, dir: string): Promise<string> {
  const styles1 = minifyCss(input);
  const urlExtractRegex = /\surl\(["']?([^)]+)["']?\)/g;
  const urls = styles1.matchAll(urlExtractRegex);
  const urls2 = Array.from(urls).map((url) => url[1]);
  await Promise.all(urls2.map((url) => extractedResource(url, dir)));
  const styles2: string = styles1.replaceAll(
    urlExtractRegex,
    (match: string, p1: string) => {
      if (ignoreUrl(p1)) {
        return match;
      }
      let url: URL | undefined;
      try {
        url = new URL(p1);
      } catch (e) {
        console.log(red("invalid url"), p1.substring(0, 100));
      }
      if (!url) {
        return match;
      }
      const s2 = url.href;
      const resource = cache.get(s2);
      const s3 = resource ? makeDataUrl(resource) : s2;
      return `url('${s3}')`;
    }
  );
  return formatLess(styles2);
}

export async function mergeAllStyleElements(document: Document, dir: string) {
  const tagName = "style";
  const qualifiedName = "type";
  const textCss = "text/css";
  const arrayLike2 = document.querySelectorAll(tagName);
  const styleElements = Array.from(arrayLike2).filter(style => {
    const attrs = style.attributes;
    if (attrs.length === 0) {
      return true;
    }
    if (attrs.length === 1) {
      const attr = attrs[0];
      return attr.name == qualifiedName && attr.value == textCss;
    }
    return false;
  });
  if (styleElements.length > 0) {
    const allStyles = styleElements.map((style) => style.textContent).join("\n").replaceAll(/\s+/g, " ");
    const style = document.createElement(tagName);
    style.setAttribute(qualifiedName, textCss);
    style.textContent = await transformStyles(allStyles, dir);
    document.head.appendChild(style);
    for (const style of styleElements) {
      style.remove();
    }
  }
}

async function inlineStyles(document: Document, dir: string) {
  const arrayLike = document.querySelectorAll("link[rel=stylesheet]");
  for (const link of Array.from(arrayLike)) {
    const href: string = link.getAttribute("href") || "";
    const parentNode = link.parentNode;
    link.remove();
    const style = document.createElement("style");
    style.setAttribute("type", "text/css");
    const resource = await extractedResource(
      href,
      dir,
      async (buffer: Buffer): Promise<Buffer> => {
        const stylesheet: string = buffer.toString("utf8");
        const transformedStyles = await transformStyles(stylesheet, dir);
        return Buffer.from(transformedStyles, "utf8");
      }
    );
    const resourceBuffer = resource?.buffer;
    if (resourceBuffer) {
      style.textContent = resourceBuffer.toString("utf8");
    }

    parentNode?.appendChild(style);
  }
  await mergeAllStyleElements(document, dir);
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
    const resource = await extractedResource(
      src,
      dir,
      (buffer: Buffer): Buffer => {
        const s = buffer.toString("utf8");
        const s1 = formatJavascript(s);
        const s2 = removeSourceMap(s1);
        const s3 = s2.trim();
        return Buffer.from(s3, "utf8");
      }
    );
    const resourceBuffer = resource?.buffer;
    if (resourceBuffer) {
      script.textContent = resourceBuffer.toString("utf8");
    }
  }
}

function makeDataUrl(resource: ExtractedResource): string {
  const contentType: string = resource.contentType;
  const buffer = resource?.buffer;
  if (!buffer) {
    return resource.href;
  }
  if (contentType.startsWith("text/")) {
    const s = buffer.toString("utf8");
    return `data:${contentType};charset=utf-8,${encodeURIComponent(s)}`;
  } else if (contentType == "image/svg+xml") {
    const string = buffer?.toString("utf8");
    const s2: string = formatXml(string);
    const result: OptimizedSvg | OptimizedError = optimize(s2, {
      multipass: true
    });
    const s3: string = "data" in result ? result.data : s2;
    return `data:image/svg+xml,${encodeURIComponent(s3)}`;
  } else {
    const string1 = buffer?.toString("base64");
    const s2 = string1?.replaceAll(/"/g, "'");
    return `data:${contentType};base64,${s2}`;
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
    if (!resource?.buffer) {
      continue;
    }
    const dataSrc = makeDataUrl(resource);
    if (dataSrc) {
      img.setAttribute("src", dataSrc);
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

function documentFromHtml(inputHtml: string): Document {
  const { window }: JSDOM = new JSDOM(inputHtml);
  const { document }: DOMWindow = window;
  return document;
}

export async function transformHtml(inputHtml: string, dir: string) {
  const document: Document = documentFromHtml(inputHtml);

  const firstTag = inputHtml.match(/<(\w+)[^>]+>/i)?.pop();
  // noinspection HtmlRequiredLangAttribute
  const hasHTML = firstTag?.match(/html/i) != null;
  // noinspection HtmlRequiredTitleElement
  const hasHead = inputHtml.includes("<head>") || inputHtml.includes("<title>");
  const hasBody = inputHtml.includes("<body>");

  if (document == null) {
    throw new Error("document is null");
  }

  if (!argv.find((arg) => arg === "--no-inline-images")) {
    await inlineImages(document, dir);
    await inlinePictureSources(document, dir);
  }

  if (!argv.find((arg) => arg.startsWith("--no-inline-css"))) {
    await inlineStyles(document, dir);
  }

  if (!argv.find((arg) => arg.startsWith("--no-inline-js"))) {
    await inlineJavascript(document, dir);
  }

  const documentElement = document.documentElement ?? document.body;

  if (hasHTML || (hasHead && hasBody)) {
    const html2 = documentElement.outerHTML;
    return removeSourceMap(formatHtml(html2));
  }

  const html = document.head.innerHTML + "" + document.body.innerHTML;
  return formatHtml(html);
}

function padString(s: string, n: number): string {
  return s.padStart(n, " ");
}

export async function transformFile(dir: string, fileName: string) {
  if (!existsSync(fileName)) {
    throw new Error("file does not exist: " + fileName.substring(0, 100));
  }
  const fileNameForPrint = fileName.substring(dir.length).slice(-30);
  // console.log(blue("Transforming"), fileNameForPrint);
  const inputText: string = readFileSync(fileName, "utf8");
  let outputText: string = inputText;
  switch (mime.lookup(fileName)) {
    case "text/html":
      outputText = await transformHtml(inputText, dir);
      break;
    case "text/css":
      outputText = await transformStyles(inputText, dir);
      break;
  }
  if (inputText != outputText) {
    const increase = outputText.length - inputText.length;
    if (increase > 1024 * 1024) {
      console.log(
        padString(fileNameForPrint, 30),
        yellow("Increased by"),
        red((increase / 1024 / 1024).toFixed(1) + "MB")
      );
    } else if (increase > 1024) {
      console.log(
        padString(fileNameForPrint, 30),
        yellow("Increased by"),
        yellow((increase / 1024).toFixed(1) + "KB")
      );
    } else if (increase > 0) {
      console.log(
        padString(fileNameForPrint, 30),
        yellow("Increased by"),
        green(increase.toFixed(1) + "B")
      );
    }
    writeFileSync(fileName, outputText, "utf8");
  }
  return outputText ?? "";
}
