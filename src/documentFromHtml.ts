import { DOMWindow, JSDOM } from "jsdom";
import { formatHtml } from "./formatHtml";

export function documentFromHtml(inputHtml: string): Document | null {
  try {
    const s: string = formatHtml(inputHtml);
    const { window }: JSDOM = new JSDOM(s);
    const { document }: DOMWindow = window;
    return document;
  } catch (e) {
    return null;
  }
}
