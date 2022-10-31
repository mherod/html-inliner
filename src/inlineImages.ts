import { makeInlineUrl } from "./makeInlineUrl";
import { extractResource } from "./extractResource";

export async function inlineImages(document: Document, dir: string) {
  const arrayLike = document.querySelectorAll("img[src]");
  for (const img of Array.from(arrayLike)) {
    const src: string = img.getAttribute("src") ?? "";
    if (src.startsWith("data:")) {
      continue;
    }
    const resource = await extractResource(src, dir);
    if (!resource?.buffer) {
      continue;
    }
    const dataSrc = makeInlineUrl(resource);
    if (dataSrc) {
      img.setAttribute("src", dataSrc);
    }
  }
}
