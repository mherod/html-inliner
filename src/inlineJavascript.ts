import { formatJavascript } from "./formatJavascript";
import { removeSourceMap } from "./removeSourceMap";
import { extractResource } from "./extractResource";

export async function inlineJavascript(document: Document, dir: string) {
  const arrayLike = document.querySelectorAll("script[src][type=module]");
  for (const script of Array.from(arrayLike)) {
    const src: string = script.getAttribute("src") ?? "";
    const resource = await extractResource(
      src,
      dir,
      (buffer: Buffer): Buffer => {
        const s = buffer.toString("utf8");
        // const s1 = s;
        const s1 = formatJavascript(s);
        const s2 = removeSourceMap(s1);
        const s3 = s2.trim();
        return Buffer.from(s3, "utf8");
      }
    );
    const resourceBuffer = resource?.buffer;
    if (resourceBuffer) {
      script.removeAttribute("src");
      script.textContent = resourceBuffer.toString("utf8");
    }
  }
}
