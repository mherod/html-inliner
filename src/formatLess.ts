import * as prettier from "prettier";
import { yellow } from "colorette";

export function formatLess(s: string): string {
  try {
    return prettier.format(s, { parser: "less" });
  } catch (error) {
    try {
      return prettier.format(s, { parser: "css" });
    } catch (error) {
      console.warn(
        yellow("format css failed"),
        error
      );
      return s;
    }
  }
}
