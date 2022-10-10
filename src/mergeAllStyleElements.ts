import { transformStyles } from "./transformStyles";

export async function mergeAllStyleElements(document: Document, dir: string) {
  const tagName = "style";
  const qualifiedName = "type";
  const textCss = "text/css";
  const arrayLike2 = document.querySelectorAll(tagName);
  const styleElements = Array.from(arrayLike2).filter(style => {
    const attrs = style.attributes;
    if (attrs.length === 0) {
      return true;
    }
    if (attrs.length === 1) {
      const attr = attrs[0];
      return attr.name == qualifiedName && attr.value == textCss;
    }
    return false;
  });
  if (styleElements.length > 0) {
    const allStyles = styleElements.map((style) => style.textContent).join("\n").replaceAll(/\s+/g, " ");
    const style = document.createElement(tagName);
    style.setAttribute(qualifiedName, textCss);
    style.textContent = await transformStyles(allStyles, dir);
    document.head.appendChild(style);
    for (const style of styleElements) {
      style.remove();
    }
  }
}
