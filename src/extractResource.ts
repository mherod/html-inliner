import { removeQuotePads } from "./removeQuotePads";
import { urlOrNull } from "./urlOrNull";
import path from "path";
import { existsSync, readFileSync } from "fs";
import mime from "mime-types";
import { red } from "colorette";
import { ignoreUrl } from "./ignoreUrl";
import { fetchResource } from "./fetchResource";
import { cache, ExtractedResource } from "./extractedResource";

export async function extractResource(
  href: string,
  dir: string,
  post?: (s: Buffer) => Buffer | Promise<Buffer>
): Promise<ExtractedResource | undefined> {
  href = removeQuotePads(href);

  if (cache.has(href)) {
    return cache.get(href) as ExtractedResource;
  }

  const url = urlOrNull(href);
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
        localPath: url1.href,
        url: url1.href,
        publishedUrl: url1.href,
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
