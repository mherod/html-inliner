import { mergeAllStyleElements } from "./mergeAllStyleElements";
import { transformStyles } from "./transformStyles";
import { extractedResource } from "./extractedResource";

export async function inlineStyles(document: Document, dir: string) {
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
