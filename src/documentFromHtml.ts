import { DOMWindow, JSDOM } from "jsdom";

export function documentFromHtml(inputHtml: string): Document | null {
  try {
    const { window }: JSDOM = new JSDOM(inputHtml);
    const { document }: DOMWindow = window;
    return document;
  } catch (e) {
    return null;
  }
}
