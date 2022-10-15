// noinspection SpellCheckingInspection

import { ExtractedResource } from "./extractedResource";
import { formatXml } from "./formatXml";
import { optimize, OptimizedError, OptimizedSvg } from "svgo";

const allowedContentTypes = [
  "image/svg+xml",
  "image/png",
  "image/jpeg",
  "image/gif"
];

const maxDataUrlSize = 10000;

export function makeDataUrl(resource: ExtractedResource): string {
  const contentType: string = resource.contentType;
  const buffer: Buffer | undefined = resource?.buffer;
  if (!buffer) {
    return resource.href;
  }
  if (contentType.startsWith("text/")) {
    const s = buffer.toString("utf8");
    return `data:${contentType};charset=utf-8,${encodeURIComponent(s)}`;
  }
  if (contentType == "image/svg+xml") {
    const string = buffer?.toString("utf8");
    const s2: string = formatXml(string);
    const result: OptimizedSvg | OptimizedError = optimize(s2, {
      multipass: true
    });
    const s3: string = "data" in result ? result.data : s2;
    const s4 = `data:image/svg+xml,${encodeURIComponent(s3)}`;
    if (s4.length < maxDataUrlSize) {
      return s4;
    } else {
      console.log(`Data URL for ${resource.href} too large: ${s4.length}`);
      return resource.href;
    }
  }
  if (allowedContentTypes.includes(contentType)) {
    const string1 = buffer?.toString("base64");
    const s2 = string1?.replaceAll(/"/g, "'");
    const s4 = `data:${contentType};base64,${s2}`;
    if (s4.length < maxDataUrlSize) {
      return s4;
    } else {
      console.log(`Data URL for ${resource.href} too large: ${s4.length}`);
      return resource.href;
    }
  } else {
    console.log(`Skipping content type for data url inline: ${contentType}`);
    console.log(`Resource: ${resource.href}`);
  }
  return resource.href;
}
