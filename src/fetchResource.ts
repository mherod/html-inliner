import { ExtractedResource } from "./extractedResource";
import { fetch } from "cross-fetch";
import mime from "mime-types";

export async function fetchResource(url: URL | string): Promise<ExtractedResource> {
  const url1: URL = url instanceof URL ? url : new URL(url);
  const res = await fetch(url1);
  const arrayBuffer: ArrayBuffer = await res.arrayBuffer();
  const headers = res.headers;
  const contentType = headers.get("content-type") ??
    (mime.lookup(url1.pathname) || "application/octet-stream");
  return {
    href: url1.href,
    buffer: Buffer.from(arrayBuffer),
    contentType
  };
}
