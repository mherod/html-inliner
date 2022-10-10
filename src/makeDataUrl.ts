// noinspection SpellCheckingInspection

import { ExtractedResource } from "./extractedResource";
import { formatXml } from "./formatXml";
import { optimize, OptimizedError, OptimizedSvg } from "svgo";

export function makeDataUrl(resource: ExtractedResource): string {
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
