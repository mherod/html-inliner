import { minifyStyles } from "./minifyStyles";
import { ignoreUrl } from "./ignoreUrl";
import { red } from "colorette";
import { formatLess } from "./formatLess";
import { makeDataUrl } from "./makeDataUrl";
import { cache, ExtractedResource, extractedResource } from "./extractedResource";

export async function transformStyles(inputStyles: string, dir: string): Promise<string> {
  const styles1: string = await minifyStyles(inputStyles);
  const styles2: string = formatLess(styles1); // helps to extract urls
  const urlExtractRegex: RegExp = /\surl\(["']?([^)]+)["']?\)/g;
  const urls = styles2.matchAll(urlExtractRegex);
  const urls2 = Array.from(urls).map((url) => url[1]);
  const urls3 = urls2.filter((url) => !ignoreUrl(url));
  const extractedResources0 = await Promise.all(urls3.map((url) => extractedResource(url, dir)));
  // @ts-ignore
  const extractedResources: ExtractedResource[] = extractedResources0.filter((resource) => resource?.buffer != null);
  const styles3: string = styles2.replaceAll(
    urlExtractRegex,
    function(match: string, p1: string) {
      if (ignoreUrl(p1)) {
        return match;
      }
      const matchedResource = extractedResources.find((resource: ExtractedResource) => {
        return resource?.href == p1;
      });
      if (matchedResource) {
        return `url('${makeDataUrl(matchedResource)}')`;
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
      if (resource) {
        return `url('${makeDataUrl(resource)}')`;
      }
      return match;
    }
  );
  return formatLess(styles3);
}
