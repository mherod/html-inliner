import LRUCache from "lru-cache";

export interface ExtractedResource {
  localPath: string;
  url: string;
  publishedUrl: string;
  href: string;
  buffer: Buffer;
  contentType: string;
}

export const cache = new LRUCache<string, ExtractedResource>({ max: 1000 });

