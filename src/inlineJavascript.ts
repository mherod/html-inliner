import { formatJavascript } from "./formatJavascript";
import { removeSourceMap } from "./removeSourceMap";
import { extractedResource } from "./extractedResource";

export async function inlineJavascript(document: Document, dir: string) {
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
