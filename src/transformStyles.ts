import { minifyStyles } from "./minifyStyles";
import { ignoreUrl } from "./ignoreUrl";
import { red } from "colorette";
import { formatLess } from "./formatLess";
import { makeDataUrl } from "./makeDataUrl";
import { cache, extractedResource } from "./extractedResource";

export async function transformStyles(inputStyles: string, dir: string): Promise<string> {
  const styles1: string = minifyStyles(inputStyles);
  const urlExtractRegex: RegExp = /\surl\(["']?([^)]+)["']?\)/g;
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
