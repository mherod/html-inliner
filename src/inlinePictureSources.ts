import { extractResource } from "./extractResource";

export async function inlinePictureSources(document: Document, dir: string) {
  const arrayLike = document.querySelectorAll("picture source[srcset]");
  for (const source of Array.from(arrayLike)) {
    const srcset: string = source.getAttribute("srcset") ?? "";
    if (srcset.startsWith("data:")) {
      continue;
    }
    const srcset1 = await Promise.all(
      srcset.split(",").map(async (s) => {
        const [url, size] = s.trim().split(" ");
        const resource = await extractResource(url, dir);
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
