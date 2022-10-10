import * as prettier from "prettier";
import { yellow } from "colorette";

export function formatHtml(s: string): string {
  try {
    const s1 = s.replaceAll(/<[^>]+>/ig, (match) => `${match}
`);
    return prettier.format(s1, { parser: "html" });
  } catch (error) {
    console.warn(
      yellow("format html failed"),
      error
    );
    return s;
  }
}
