// noinspection ES6UnusedImports

import { documentFromHtml } from "./documentFromHtml";
import { argvOptions } from "./argv";
import { inlineJavascript } from "./inlineJavascript";
import { formatHtml } from "./formatHtml";
import { inlineImages } from "./inlineImages";
import { inlinePictureSources } from "./inlinePictureSources";
import { inlineStyles } from "./inlineStyles";
import { removeSourceMap } from "./removeSourceMap";

export async function transformHtml(inputHtml: string, dir: string): Promise<string> {
  const document: Document | null = documentFromHtml(inputHtml);
  if (!document) {
    throw new Error("document is null");
  }

  const firstTag = inputHtml.match(/<(\w+)[^>]+>/i)?.pop();
  // noinspection HtmlRequiredLangAttribute
  const hasHTML = firstTag?.match(/html/i) != null;
  // noinspection HtmlRequiredTitleElement
  const hasHead = inputHtml.includes("<head>") || inputHtml.includes("<title>");
  const hasBody = inputHtml.includes("<body>");

  if (argvOptions["inline-images"]) {
    await inlineImages(document, dir);
    await inlinePictureSources(document, dir);
  }

  if (argvOptions["inline-styles"]) {
    await inlineStyles(document, dir);
  }

  // if (argvOptions["inline-js"]) {
  //   await inlineJavascript(document, dir);
  // }

  const documentElement = document.documentElement ?? document.body;

  if (hasHTML || (hasHead && hasBody)) {
    const html2 = documentElement.outerHTML;
    return removeSourceMap(formatHtml(html2));
  }

  const html = document.head.innerHTML + "" + document.body.innerHTML;
  return formatHtml(html);
}
